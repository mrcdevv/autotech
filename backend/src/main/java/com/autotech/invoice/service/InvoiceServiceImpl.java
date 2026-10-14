package com.autotech.invoice.service;

import com.autotech.client.model.Client;
import com.autotech.client.model.ClientType;
import com.autotech.client.repository.ClientRepository;
import com.autotech.common.audit.AuditAction;
import com.autotech.common.audit.AuditEntityType;
import com.autotech.common.audit.AuditService;
import com.autotech.common.exception.BusinessException;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.estimate.dto.EstimateInvoiceDataResponse;
import com.autotech.email.service.EmailNotificationService;
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
import com.autotech.payment.repository.PaymentRepository;
import com.autotech.repairorder.model.RepairOrder;
import com.autotech.repairorder.repository.RepairOrderRepository;
import com.autotech.repairorder.service.RepairOrderService;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceMapper invoiceMapper;
    private final ClientRepository clientRepository;
    private final VehicleRepository vehicleRepository;
    private final RepairOrderRepository repairOrderRepository;
    private final RepairOrderService repairOrderService;
    private final EstimateService estimateService;
    private final EmailNotificationService emailNotificationService;
    private final AuditService auditService;
    private final PaymentRepository paymentRepository;

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

            // The OT must not be closed by status; the one-invoice rule is enforced below (D1)
            repairOrderService.validateNotClosedByStatus(repairOrder);

            // One invoice per repair order: covers both create and createFromEstimate (which delegates here)
            if (invoiceRepository.findByRepairOrderId(request.repairOrderId()).isPresent()) {
                throw new BusinessException("La orden de trabajo ya tiene una factura asociada");
            }
        }

        // Validate estimate existence via EstimateService (cross-module boundary)
        if (request.estimateId() != null) {
            // One invoice per estimate: covers both create and createFromEstimate (which delegates here)
            if (invoiceRepository.findByEstimateId(request.estimateId()).isPresent()) {
                throw new BusinessException("El presupuesto ya tiene una factura asociada");
            }
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
        InvoiceDetailResponse response = getById(saved.getId());
        emailNotificationService.notifyInvoiceCreated(response);
        return response;
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
    public InvoiceDetailResponse attachToRepairOrder(Long id, Long repairOrderId) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));

        // Rule 1: attaching is a one-time act; there is no unlink in this version,
        // so re-attaching (even to the same order) is refused
        if (invoice.getRepairOrder() != null) {
            throw new BusinessException("La factura ya está asociada a una orden de trabajo");
        }

        RepairOrder order = repairOrderRepository.findById(repairOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("RepairOrder", repairOrderId));

        // Rule 2: one invoice per repair order. The V9 partial unique index is the
        // authority if two requests race; this guard is only the fast path.
        if (invoiceRepository.findByRepairOrderId(repairOrderId).isPresent()) {
            throw new BusinessException("La orden de trabajo ya tiene una factura asociada");
        }

        // Rule 3: the invoice's client must match the order's client
        if (!invoice.getClient().getId().equals(order.getClient().getId())) {
            throw new BusinessException(
                    "El cliente de la factura no coincide con el cliente de la orden de trabajo");
        }

        // Rule 4 (D14): the vehicle must match, or be null on the invoice and is then
        // filled from the order — a deliberate second field mutation, declared here and
        // carried in the audit row so the invoice never vanishes from per-vehicle reports
        boolean vehicleFilled = false;
        if (invoice.getVehicle() == null) {
            invoice.setVehicle(order.getVehicle());
            vehicleFilled = true;
        } else if (!invoice.getVehicle().getId().equals(order.getVehicle().getId())) {
            throw new BusinessException(
                    "El vehículo de la factura no coincide con el vehículo de la orden de trabajo");
        }

        // Rule 5: the order must be open — the D1 guard is reused, never reimplemented
        repairOrderService.validateNotClosedByStatus(order);

        // Rule 6: a paid or partially paid invoice is allowed — that is the whole point
        // of this endpoint (pay at the counter, record the order afterwards). The payment
        // sum is carried in the audit trail, never used to refuse the attachment.
        BigDecimal paidAmount = paymentRepository.sumAmountByInvoiceId(id);

        invoice.setRepairOrder(order);
        Invoice saved = invoiceRepository.save(invoice);
        recordAssociationAudit(saved.getId(), repairOrderId,
                vehicleFilled ? order.getVehicle().getId() : null, paidAmount);
        log.info("Attached invoice {} to repair order {}", id, repairOrderId);
        return getById(saved.getId());
    }

    /**
     * Records an audit row for the association of an invoice to a repair order (T7b),
     * mirroring the estimate association shape with AuditEntityType.INVOICE. The
     * completed vehicleId is carried on both sides when the D14 fill happened, and the
     * payment sum is carried (when present) so the audit shows the invoice was already
     * paid at attach time.
     */
    private void recordAssociationAudit(Long invoiceId, Long repairOrderId,
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
        auditService.record(AuditEntityType.INVOICE, invoiceId, AuditAction.MODIFIED, oldValues, newValues);
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
