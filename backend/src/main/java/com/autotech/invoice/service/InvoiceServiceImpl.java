package com.autotech.invoice.service;

import com.autotech.client.model.Client;
import com.autotech.client.model.ClientType;
import com.autotech.client.repository.ClientRepository;
import com.autotech.common.exception.BusinessException;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.estimate.dto.EstimateInvoiceDataResponse;
import com.autotech.estimate.service.EstimateService;
import com.autotech.invoice.dto.InvoiceDetailResponse;
import com.autotech.invoice.dto.InvoiceMapper;
import com.autotech.invoice.dto.InvoiceProductRequest;
import com.autotech.invoice.dto.InvoiceRequest;
import com.autotech.invoice.dto.InvoiceResponse;
import com.autotech.invoice.dto.InvoiceServiceItemRequest;
import com.autotech.invoice.model.Invoice;
import com.autotech.invoice.model.InvoiceProduct;
import com.autotech.invoice.model.InvoiceServiceItem;
import com.autotech.invoice.model.InvoiceStatus;
import com.autotech.invoice.repository.InvoiceRepository;
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
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceMapper invoiceMapper;
    private final ClientRepository clientRepository;
    private final VehicleRepository vehicleRepository;
    private final RepairOrderRepository repairOrderRepository;
    private final EstimateService estimateService;

    @Override
    @Transactional(readOnly = true)
    public Page<InvoiceResponse> getAll(Pageable pageable) {
        log.debug("Fetching all invoices");
        return invoiceRepository.findAll(pageable)
                .map(invoiceMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InvoiceResponse> search(String clientName, String plate, InvoiceStatus status, Pageable pageable) {
        log.debug("Searching invoices - clientName: '{}', plate: '{}', status: '{}'", clientName, plate, status);
        return invoiceRepository.search(clientName, plate, status, pageable)
                .map(invoiceMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceDetailResponse getById(Long id) {
        log.debug("Fetching invoice with id {}", id);
        Invoice entity = invoiceRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));
        return invoiceMapper.toDetailResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceDetailResponse getByRepairOrderId(Long repairOrderId) {
        log.debug("Fetching invoice for repair order {}", repairOrderId);
        Invoice entity = invoiceRepository.findByRepairOrderId(repairOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice for RepairOrder", repairOrderId));
        // Re-fetch with details to avoid lazy loading issues
        return getById(entity.getId());
    }

    @Override
    @Transactional
    public InvoiceDetailResponse create(InvoiceRequest request) {
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", request.clientId()));

        if (client.getClientType() == ClientType.TEMPORAL) {
            if (request.services() != null && !request.services().isEmpty()) {
                throw new BusinessException(
                        "Los clientes temporales solo pueden tener facturas de productos, no de servicios");
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

        Invoice entity = invoiceMapper.toEntity(request);
        entity.setClient(client);
        entity.setVehicle(vehicle);
        entity.setRepairOrder(repairOrder);
        entity.setStatus(InvoiceStatus.PENDIENTE);

        if (request.estimateId() != null) {
            com.autotech.estimate.model.Estimate estimateRef = com.autotech.estimate.model.Estimate.builder().build();
            estimateRef.setId(request.estimateId());
            entity.setEstimate(estimateRef);
        }

        addChildEntities(entity, request);

        BigDecimal total = calculateTotal(request.services(), request.products(),
                request.discountPercentage(), request.taxPercentage());
        entity.setTotal(total);

        Invoice saved = invoiceRepository.save(entity);
        log.info("Created invoice with id {}", saved.getId());
        return getById(saved.getId());
    }

    @Override
    @Transactional
    public InvoiceDetailResponse createFromEstimate(Long estimateId) {
        EstimateInvoiceDataResponse estimateData = estimateService.convertToInvoiceData(estimateId);

        List<InvoiceServiceItemRequest> services = estimateData.services().stream()
                .map(s -> new InvoiceServiceItemRequest(s.serviceName(), s.price()))
                .toList();

        List<InvoiceProductRequest> products = estimateData.products().stream()
                .map(p -> new InvoiceProductRequest(p.productName(), p.quantity(), p.unitPrice()))
                .toList();

        InvoiceRequest request = new InvoiceRequest(
                estimateData.clientId(),
                estimateData.vehicleId(),
                estimateData.repairOrderId(),
                estimateId,
                estimateData.discountPercentage(),
                estimateData.taxPercentage(),
                services,
                products
        );

        return create(request);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));

        if (invoice.getRepairOrder() != null) {
            throw new BusinessException(
                    "No se puede eliminar una factura asociada a una orden de trabajo");
        }

        if (invoice.getStatus() == InvoiceStatus.PAGADA) {
            throw new BusinessException("No se puede eliminar una factura que ya fue pagada");
        }

        invoiceRepository.deleteById(id);
        log.info("Deleted invoice with id {}", id);
    }

    @Override
    public BigDecimal calculateTotal(List<InvoiceServiceItemRequest> services,
                                     List<InvoiceProductRequest> products,
                                     BigDecimal discountPercentage,
                                     BigDecimal taxPercentage) {
        BigDecimal servicesTotal = BigDecimal.ZERO;
        if (services != null) {
            for (InvoiceServiceItemRequest svc : services) {
                servicesTotal = servicesTotal.add(svc.price());
            }
        }
        BigDecimal productsTotal = BigDecimal.ZERO;
        if (products != null) {
            for (InvoiceProductRequest prod : products) {
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
        Invoice entity = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));
        entity.setStatus(InvoiceStatus.PAGADA);
        invoiceRepository.save(entity);
        log.info("Marked invoice {} as PAGADA", id);
    }

    @Override
    @Transactional
    public void updateStatusToPagada(Long id) {
        Invoice entity = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));
        entity.setStatus(InvoiceStatus.PAGADA);
        invoiceRepository.save(entity);
        log.info("Updated invoice {} status to PAGADA", id);
    }

    @Override
    @Transactional
    public void updateStatusToPendiente(Long id) {
        Invoice entity = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));
        entity.setStatus(InvoiceStatus.PENDIENTE);
        invoiceRepository.save(entity);
        log.info("Updated invoice {} status to PENDIENTE", id);
    }

    private void addChildEntities(Invoice entity, InvoiceRequest request) {
        if (request.services() != null) {
            for (InvoiceServiceItemRequest svcReq : request.services()) {
                InvoiceServiceItem svc = InvoiceServiceItem.builder()
                        .invoice(entity)
                        .serviceName(svcReq.serviceName())
                        .price(svcReq.price())
                        .build();
                entity.getServices().add(svc);
            }
        }
        if (request.products() != null) {
            for (InvoiceProductRequest prodReq : request.products()) {
                InvoiceProduct prod = InvoiceProduct.builder()
                        .invoice(entity)
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
