package com.autotech.deliverynote.service;

import com.autotech.catalog.repository.ProductRepository;
import com.autotech.catalog.model.Product;
import com.autotech.client.model.Client;
import com.autotech.client.model.ClientType;
import com.autotech.client.repository.ClientRepository;
import com.autotech.common.audit.AuditAction;
import com.autotech.common.audit.AuditEntityType;
import com.autotech.common.audit.AuditService;
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
import com.autotech.payment.repository.PaymentRepository;
import com.autotech.repairorder.model.RepairOrder;
import com.autotech.repairorder.service.RepairOrderService;
import com.autotech.tax.service.TaxConfigService;
import com.autotech.repairorder.repository.RepairOrderRepository;
import com.autotech.vehicle.model.Vehicle;
import com.autotech.vehicle.repository.VehicleRepository;
import com.autotech.stock.service.StockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeliveryNoteServiceImpl implements DeliveryNoteService {

    private final DeliveryNoteRepository deliveryNoteRepository;
    private final ProductRepository productRepository;
    private final DeliveryNoteMapper deliveryNoteMapper;
    private final ClientRepository clientRepository;
    private final VehicleRepository vehicleRepository;
    private final RepairOrderRepository repairOrderRepository;
    private final EstimateService estimateService;
    private final EmailNotificationService emailNotificationService;
    private final TaxConfigService taxConfigService;
    private final StockService stockService;
    private final RepairOrderService repairOrderService;
    private final AuditService auditService;
    private final PaymentRepository paymentRepository;

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

            // One delivery note per repair order: covers both create and createFromEstimate (which delegates here)
            if (deliveryNoteRepository.findByRepairOrderId(request.repairOrderId()).isPresent()) {
                throw new BusinessException("La orden de trabajo ya tiene un remito asociado");
            }
        }

        // Validate estimate existence via EstimateService (cross-module boundary)
        if (request.estimateId() != null) {
            // One delivery note per estimate: covers both create and createFromEstimate (which delegates here)
            if (deliveryNoteRepository.findByEstimateId(request.estimateId()).isPresent()) {
                throw new BusinessException("El presupuesto ya tiene un remito asociado");
            }
            estimateService.getById(request.estimateId());
        }

        BigDecimal taxPercentage = request.taxPercentage() != null
                ? request.taxPercentage()
                : taxConfigService.getConfig().getTaxPercentage();

        DeliveryNote entity = deliveryNoteMapper.toEntity(request);
        entity.setTaxPercentage(taxPercentage);
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
                request.discountPercentage(), taxPercentage);
        entity.setTotal(total);

        DeliveryNote saved = deliveryNoteRepository.save(entity);
        log.info("Created delivery note with id {}", saved.getId());
        stockService.syncDeliveryNote(saved.getId());
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
                .map(p -> new DeliveryNoteProductRequest(p.productName(), p.quantity(), p.unitPrice(), p.productId()))
                .toList();

        DeliveryNoteRequest request = new DeliveryNoteRequest(
                estimateData.clientId(),
                estimateData.vehicleId(),
                estimateData.repairOrderId(),
                estimateId,
                estimateData.discountPercentage(),
                estimateData.taxPercentage() != null ? estimateData.taxPercentage() : BigDecimal.ZERO,
                services,
                products
        );

        return create(request);
    }

    /**
     * Attaches an existing standalone remito to a repair order: the workshop
     * collects at the counter and records the order afterwards, so the remito
     * would otherwise stay orphaned. One-way and one-time: there is no unlink
     * and re-attaching is refused. The V21 partial unique index on
     * delivery_notes.repair_order_id is the authority if two requests race;
     * the in-memory guard below is only the fast path.
     */
    @Override
    @Transactional
    public DeliveryNoteDetailResponse attachToRepairOrder(Long id, Long repairOrderId) {
        DeliveryNote deliveryNote = deliveryNoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DeliveryNote", id));

        // Rule 1: attaching is a one-time act; there is no unlink in this version,
        // so re-attaching (even to the same order) is refused
        if (deliveryNote.getRepairOrder() != null) {
            throw new BusinessException("El remito ya está asociado a una orden de trabajo");
        }

        RepairOrder order = repairOrderRepository.findById(repairOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("RepairOrder", repairOrderId));

        // Rule 2: one delivery note per repair order. The V21 partial unique index is
        // the authority if two requests race; this guard is only the fast path.
        if (deliveryNoteRepository.findByRepairOrderId(repairOrderId).isPresent()) {
            throw new BusinessException("La orden de trabajo ya tiene un remito asociado");
        }

        // Rule 3: the remito's client must match the order's client
        if (!deliveryNote.getClient().getId().equals(order.getClient().getId())) {
            throw new BusinessException(
                    "El cliente del remito no coincide con el cliente de la orden de trabajo");
        }

        // Rule 4 (D14): the vehicle must match, or be null on the remito and is then
        // filled from the order — a deliberate second field mutation, declared here and
        // carried in the audit row so the remito never vanishes from per-vehicle reports
        boolean vehicleFilled = false;
        if (deliveryNote.getVehicle() == null) {
            deliveryNote.setVehicle(order.getVehicle());
            vehicleFilled = true;
        } else if (order.getVehicle() == null
                || !deliveryNote.getVehicle().getId().equals(order.getVehicle().getId())) {
            throw new BusinessException(
                    "El vehículo del remito no coincide con el vehículo de la orden de trabajo");
        }

        // Rule 5: the order must be open — the D1 guard is reused, never reimplemented
        repairOrderService.validateNotClosedByStatus(order);

        // Rule 6: a paid or partially paid remito is allowed — that is the whole point
        // of this endpoint (pay at the counter, record the order afterwards). The payment
        // sum is carried in the audit trail, never used to refuse the attachment.
        BigDecimal paidAmount = paymentRepository.sumAmountByDeliveryNoteId(id);

        deliveryNote.setRepairOrder(order);
        DeliveryNote saved = deliveryNoteRepository.save(deliveryNote);
        recordAssociationAudit(saved.getId(), repairOrderId,
                vehicleFilled && order.getVehicle() != null ? order.getVehicle().getId() : null, paidAmount);
        log.info("Attached delivery note {} to repair order {}", id, repairOrderId);
        return getById(saved.getId());
    }

    /**
     * Records an audit row for the association of a remito to a repair order,
     * mirroring the invoice association shape with AuditEntityType.DELIVERY_NOTE.
     * The completed vehicleId is carried on both sides when the D14 fill happened,
     * and the payment sum is carried (when present) so the audit shows the remito
     * was already paid at attach time.
     */
    private void recordAssociationAudit(Long deliveryNoteId, Long repairOrderId,
                                        Long filledVehicleId, BigDecimal paidAmount) {
        Map<String, Object> oldValues = new LinkedHashMap<>();
        oldValues.put("repairOrderId", null);
        Map<String, Object> newValues = new LinkedHashMap<>();
        newValues.put("repairOrderId", repairOrderId);
        if (filledVehicleId != null) {
            oldValues.put("vehicleId", null);
            newValues.put("vehicleId", filledVehicleId);
        }
        if (paidAmount != null && paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            newValues.put("paidAmount", paidAmount);
        }
        auditService.record(AuditEntityType.DELIVERY_NOTE, deliveryNoteId, AuditAction.MODIFIED,
                oldValues, newValues);
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

        stockService.revertDeliveryNote(id);
        deliveryNoteRepository.deleteById(id);
        log.info("Deleted delivery note with id {}", id);
    }

    @Override
    public BigDecimal calculateTotal(List<DeliveryNoteServiceItemRequest> services,
                                     List<DeliveryNoteProductRequest> products,
                                     BigDecimal discountPercentage,
                                     BigDecimal taxPercentage) {
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
        BigDecimal afterDiscount = subtotal.subtract(discount);
        BigDecimal tax = taxPercentage != null
                ? afterDiscount.multiply(taxPercentage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        return afterDiscount.add(tax);
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
                        .product(resolveProduct(prodReq.productId()))
                        .productName(prodReq.productName())
                        .quantity(prodReq.quantity())
                        .unitPrice(prodReq.unitPrice())
                        .totalPrice(prodReq.unitPrice().multiply(BigDecimal.valueOf(prodReq.quantity())))
                        .build();
                entity.getProducts().add(prod);
            }
        }
    }

    private Product resolveProduct(Long productId) {
        if (productId == null) return null;
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));
    }
}
