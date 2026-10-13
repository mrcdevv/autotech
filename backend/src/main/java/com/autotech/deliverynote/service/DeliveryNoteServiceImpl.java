package com.autotech.deliverynote.service;

import com.autotech.client.model.Client;
import com.autotech.client.model.ClientType;
import com.autotech.client.repository.ClientRepository;
import com.autotech.common.exception.BusinessException;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.estimate.dto.EstimateDeliveryNoteDataResponse;
import com.autotech.email.service.EmailNotificationService;
import com.autotech.estimate.service.EstimateService;
import com.autotech.deliverynote.dto.DeliveryNoteDetailResponse;
import com.autotech.deliverynote.dto.DeliveryNoteMapper;
import com.autotech.deliverynote.dto.DeliveryNoteProductRequest;
import com.autotech.deliverynote.dto.DeliveryNoteRequest;
import com.autotech.deliverynote.dto.DeliveryNoteResponse;
import com.autotech.deliverynote.dto.DeliveryNoteServiceItemRequest;
import com.autotech.deliverynote.model.DeliveryNote;
import com.autotech.deliverynote.model.DeliveryNoteProduct;
import com.autotech.deliverynote.model.DeliveryNoteServiceItem;
import com.autotech.deliverynote.model.DeliveryNoteStatus;
import com.autotech.deliverynote.repository.DeliveryNoteRepository;
import com.autotech.repairorder.model.RepairOrder;
import com.autotech.repairorder.repository.RepairOrderRepository;
import com.autotech.vehicle.model.Vehicle;
import com.autotech.vehicle.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeliveryNoteServiceImpl implements DeliveryNoteService {

    private final DeliveryNoteRepository deliveryNoteRepository;
    private final DeliveryNoteMapper deliveryNoteMapper;
    private final ClientRepository clientRepository;
    private final VehicleRepository vehicleRepository;
    private final RepairOrderRepository repairOrderRepository;
    private final EstimateService estimateService;
    private final EmailNotificationService emailNotificationService;

    @Override
    @Transactional(readOnly = true)
    public Page<DeliveryNoteResponse> getAll(Pageable pageable) {
        log.debug("Fetching all delivery notes");
        return deliveryNoteRepository.findAll(pageable)
                .map(deliveryNoteMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DeliveryNoteResponse> search(String clientName, String plate, DeliveryNoteStatus status, Pageable pageable) {
        log.debug("Searching delivery notes - clientName: '{}', plate: '{}', status: '{}'", clientName, plate, status);
        return deliveryNoteRepository.search(clientName, plate, status, pageable)
                .map(deliveryNoteMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public DeliveryNoteDetailResponse getById(Long id) {
        log.debug("Fetching delivery note with id {}", id);
        DeliveryNote entity = deliveryNoteRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DeliveryNote", id));
        return deliveryNoteMapper.toDetailResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public DeliveryNoteDetailResponse getByRepairOrderId(Long repairOrderId) {
        log.debug("Fetching delivery note for repair order {}", repairOrderId);
        DeliveryNote entity = deliveryNoteRepository.findByRepairOrderId(repairOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("DeliveryNote for RepairOrder", repairOrderId));
        // Re-fetch with details to avoid lazy loading issues
        return getById(entity.getId());
    }

    @Override
    @Transactional
    public DeliveryNoteDetailResponse create(DeliveryNoteRequest request) {
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", request.clientId()));

        if (client.getClientType() == ClientType.TEMPORAL) {
            if (request.services() != null && !request.services().isEmpty()) {
                throw new BusinessException(
                        "Los clientes temporales solo pueden tener remitos de productos, no de servicios");
            }
        }

        Vehicle vehicle = null;
        if (request.vehicleId() != null) {
            vehicle = vehicleRepository.findById(request.vehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle", request.vehicleId()));
        }

        RepairOrder repairOrder = null;
        if (request.repairOrderId() != null) {
            repairOrder = repairOrderRepository.findById(request.repairOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("RepairOrder", request.repairOrderId()));
        }

        // Validate estimate existence via EstimateService (cross-module boundary)
        if (request.estimateId() != null) {
            estimateService.getById(request.estimateId());
        }

        DeliveryNote entity = deliveryNoteMapper.toEntity(request);
        entity.setClient(client);
        entity.setVehicle(vehicle);
        entity.setRepairOrder(repairOrder);
        entity.setStatus(DeliveryNoteStatus.PENDIENTE);
        entity.setNumber(deliveryNoteRepository.nextNumber());

        if (request.estimateId() != null) {
            com.autotech.estimate.model.Estimate estimateRef = com.autotech.estimate.model.Estimate.builder().build();
            estimateRef.setId(request.estimateId());
            entity.setEstimate(estimateRef);
        }

        addChildEntities(entity, request);

        BigDecimal total = calculateTotal(request.services(), request.products(),
                request.discountPercentage());
        entity.setTotal(total);

        DeliveryNote saved = deliveryNoteRepository.save(entity);
        log.info("Created delivery note with id {}", saved.getId());
        DeliveryNoteDetailResponse response = getById(saved.getId());
        emailNotificationService.notifyDeliveryNoteCreated(response);
        return response;
    }

    @Override
    @Transactional
    public DeliveryNoteDetailResponse createFromEstimate(Long estimateId) {
        EstimateDeliveryNoteDataResponse estimateData = estimateService.convertToDeliveryNoteData(estimateId);

        List<DeliveryNoteServiceItemRequest> services = estimateData.services().stream()
                .map(s -> new DeliveryNoteServiceItemRequest(s.serviceName(), s.price()))
                .toList();

        List<DeliveryNoteProductRequest> products = estimateData.products().stream()
                .map(p -> new DeliveryNoteProductRequest(p.productName(), p.quantity(), p.unitPrice()))
                .toList();

        DeliveryNoteRequest request = new DeliveryNoteRequest(
                estimateData.clientId(),
                estimateData.vehicleId(),
                estimateData.repairOrderId(),
                estimateId,
                estimateData.discountPercentage(),
                services,
                products
        );

        return create(request);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        DeliveryNote deliveryNote = deliveryNoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DeliveryNote", id));

        if (deliveryNote.getRepairOrder() != null) {
            throw new BusinessException(
                    "No se puede eliminar un remito asociado a una orden de trabajo");
        }

        if (deliveryNote.getStatus() == DeliveryNoteStatus.PAGADA) {
            throw new BusinessException("No se puede eliminar un remito que ya fue pagado");
        }

        deliveryNoteRepository.deleteById(id);
        log.info("Deleted delivery note with id {}", id);
    }

    @Override
    public BigDecimal calculateTotal(List<DeliveryNoteServiceItemRequest> services,
                                     List<DeliveryNoteProductRequest> products,
                                     BigDecimal discountPercentage) {
        BigDecimal servicesTotal = BigDecimal.ZERO;
        if (services != null) {
            for (DeliveryNoteServiceItemRequest svc : services) {
                servicesTotal = servicesTotal.add(svc.price());
            }
        }
        BigDecimal productsTotal = BigDecimal.ZERO;
        if (products != null) {
            for (DeliveryNoteProductRequest prod : products) {
                productsTotal = productsTotal.add(prod.unitPrice().multiply(BigDecimal.valueOf(prod.quantity())));
            }
        }
        BigDecimal subtotal = servicesTotal.add(productsTotal);
        BigDecimal discount = discountPercentage != null
                ? subtotal.multiply(discountPercentage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        return subtotal.subtract(discount);
    }

    @Override
    @Transactional
    public void markAsPaid(Long id) {
        DeliveryNote entity = deliveryNoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DeliveryNote", id));
        entity.setStatus(DeliveryNoteStatus.PAGADA);
        deliveryNoteRepository.save(entity);
        log.info("Marked delivery note {} as PAGADA", id);
    }

    @Override
    @Transactional
    public void updateStatusToPagada(Long id) {
        DeliveryNote entity = deliveryNoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DeliveryNote", id));
        entity.setStatus(DeliveryNoteStatus.PAGADA);
        deliveryNoteRepository.save(entity);
        log.info("Updated delivery note {} status to PAGADA", id);
    }

    @Override
    @Transactional
    public void updateStatusToPendiente(Long id) {
        DeliveryNote entity = deliveryNoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DeliveryNote", id));
        entity.setStatus(DeliveryNoteStatus.PENDIENTE);
        deliveryNoteRepository.save(entity);
        log.info("Updated delivery note {} status to PENDIENTE", id);
    }

    private void addChildEntities(DeliveryNote entity, DeliveryNoteRequest request) {
        if (request.services() != null) {
            for (DeliveryNoteServiceItemRequest svcReq : request.services()) {
                DeliveryNoteServiceItem svc = DeliveryNoteServiceItem.builder()
                        .deliveryNote(entity)
                        .serviceName(svcReq.serviceName())
                        .price(svcReq.price())
                        .build();
                entity.getServices().add(svc);
            }
        }
        if (request.products() != null) {
            for (DeliveryNoteProductRequest prodReq : request.products()) {
                DeliveryNoteProduct prod = DeliveryNoteProduct.builder()
                        .deliveryNote(entity)
                        .productName(prodReq.productName())
                        .quantity(prodReq.quantity())
                        .unitPrice(prodReq.unitPrice())
                        .totalPrice(prodReq.unitPrice().multiply(BigDecimal.valueOf(prodReq.quantity())))
                        .build();
                entity.getProducts().add(prod);
            }
        }
    }
}
