package com.autotech.estimate.service;

import com.autotech.client.model.Client;
import com.autotech.client.repository.ClientRepository;
import com.autotech.common.audit.AuditAction;
import com.autotech.common.audit.AuditEntityType;
import com.autotech.common.audit.AuditService;
import com.autotech.common.exception.BusinessException;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.estimate.dto.EstimateDetailResponse;
import com.autotech.estimate.dto.EstimateInvoiceDataResponse;
import com.autotech.estimate.dto.EstimateMapper;
import com.autotech.estimate.dto.EstimateProductRequest;
import com.autotech.estimate.dto.EstimateRequest;
import com.autotech.estimate.dto.EstimateResponse;
import com.autotech.estimate.dto.EstimateServiceItemRequest;
import com.autotech.estimate.dto.InspectionIssueResponse;
import com.autotech.email.service.EmailNotificationService;
import com.autotech.estimate.model.Estimate;
import com.autotech.estimate.model.EstimateProduct;
import com.autotech.estimate.model.EstimateServiceItem;
import com.autotech.estimate.model.EstimateStatus;
import com.autotech.estimate.repository.EstimateRepository;
import com.autotech.inspection.model.Inspection;
import com.autotech.inspection.model.InspectionItem;
import com.autotech.inspection.model.InspectionItemStatus;
import com.autotech.inspection.repository.InspectionRepository;
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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EstimateServiceImpl implements EstimateService {

    private final EstimateRepository estimateRepository;
    private final EstimateMapper estimateMapper;
    private final ClientRepository clientRepository;
    private final VehicleRepository vehicleRepository;
    private final RepairOrderRepository repairOrderRepository;
    private final RepairOrderService repairOrderService;
    private final InspectionRepository inspectionRepository;
    private final EmailNotificationService emailNotificationService;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public Page<EstimateResponse> getAll(Pageable pageable) {
        log.debug("Fetching all estimates");
        return estimateRepository.findAll(pageable)
                .map(estimateMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EstimateResponse> search(String clientName, String plate, EstimateStatus status, Pageable pageable) {
        log.debug("Searching estimates - clientName: '{}', plate: '{}', status: '{}'", clientName, plate, status);
        return estimateRepository.search(clientName, plate, status, pageable)
                .map(estimateMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public EstimateDetailResponse getById(Long id) {
        log.debug("Fetching estimate with id {}", id);
        Estimate entity = estimateRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Estimate", id));
        EstimateDetailResponse response = estimateMapper.toDetailResponse(entity);
        if (entity.getRepairOrder() != null) {
            List<InspectionIssueResponse> issues = getInspectionIssues(entity.getRepairOrder().getId());
            response = buildDetailResponseWithIssues(response, issues);
        }
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public EstimateDetailResponse getByRepairOrderId(Long repairOrderId) {
        log.debug("Fetching active estimate for repair order {}", repairOrderId);
        List<Estimate> estimates = estimateRepository.findAllByRepairOrderId(repairOrderId);

        Estimate active = estimates.stream()
                .filter(e -> e.getStatus() == EstimateStatus.ACEPTADO)
                .findFirst()
                .or(() -> estimates.stream()
                        .filter(e -> e.getStatus() == EstimateStatus.PENDIENTE)
                        .findFirst())
                .orElseThrow(() -> new ResourceNotFoundException("Estimate for RepairOrder", repairOrderId));

        EstimateDetailResponse response = estimateMapper.toDetailResponse(active);
        List<InspectionIssueResponse> issues = getInspectionIssues(repairOrderId);
        return buildDetailResponseWithIssues(response, issues);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EstimateResponse> getAllByRepairOrderId(Long repairOrderId) {
        log.debug("Fetching all estimates for repair order {}", repairOrderId);
        return estimateRepository.findAllByRepairOrderId(repairOrderId).stream()
                .map(estimateMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public EstimateDetailResponse create(EstimateRequest request) {
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", request.clientId()));
        Vehicle vehicle = vehicleRepository.findById(request.vehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", request.vehicleId()));

        RepairOrder repairOrder = null;
        if (request.repairOrderId() != null) {
            repairOrder = repairOrderRepository.findById(request.repairOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("RepairOrder", request.repairOrderId()));

            // The OT must be open: not closed by status and without an invoice (D1)
            repairOrderService.validateOpenForNewDocuments(repairOrder);

            boolean hasActiveEstimate = estimateRepository.findAllByRepairOrderId(request.repairOrderId()).stream()
                    .anyMatch(e -> e.getStatus() == EstimateStatus.PENDIENTE || e.getStatus() == EstimateStatus.ACEPTADO);
            if (hasActiveEstimate) {
                throw new BusinessException("Ya existe un presupuesto pendiente o aceptado para esta orden de trabajo");
            }
        }

        Estimate entity = estimateMapper.toEntity(request);
        entity.setClient(client);
        entity.setVehicle(vehicle);
        entity.setRepairOrder(repairOrder);
        entity.setStatus(EstimateStatus.PENDIENTE);

        addChildEntities(entity, request);

        BigDecimal total = calculateTotal(request.services(), request.products(),
                request.discountPercentage(), request.taxPercentage());
        entity.setTotal(total);

        Estimate saved = estimateRepository.save(entity);
        log.info("Created estimate with id {}", saved.getId());
        EstimateDetailResponse response = getById(saved.getId());
        emailNotificationService.notifyEstimateCreated(response);
        return response;
    }

    @Override
    @Transactional
    public EstimateDetailResponse update(Long id, EstimateRequest request) {
        Estimate entity = estimateRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Estimate", id));

        if (entity.getStatus() != EstimateStatus.PENDIENTE) {
            throw new BusinessException("Solo se pueden editar presupuestos en estado PENDIENTE");
        }

        EstimateStatus previousStatus = entity.getStatus();
        BigDecimal previousTotal = entity.getTotal();

        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", request.clientId()));
        Vehicle vehicle = vehicleRepository.findById(request.vehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", request.vehicleId()));

        entity.setClient(client);
        entity.setVehicle(vehicle);
        entity.setDiscountPercentage(request.discountPercentage() != null ? request.discountPercentage() : BigDecimal.ZERO);
        entity.setTaxPercentage(request.taxPercentage() != null ? request.taxPercentage() : BigDecimal.ZERO);

        entity.getServices().clear();
        entity.getProducts().clear();
        addChildEntities(entity, request);

        BigDecimal total = calculateTotal(request.services(), request.products(),
                request.discountPercentage(), request.taxPercentage());
        entity.setTotal(total);

        Estimate saved = estimateRepository.save(entity);
        recordEstimateAudit(saved.getId(), previousStatus, previousTotal, saved.getStatus(), saved.getTotal());
        log.info("Updated estimate with id {}", saved.getId());
        return getById(saved.getId());
    }

    @Override
    @Transactional
    public EstimateDetailResponse approve(Long id) {
        Estimate entity = estimateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Estimate", id));
        if (entity.getStatus() != EstimateStatus.PENDIENTE) {
            throw new BusinessException("Solo se pueden aprobar presupuestos en estado PENDIENTE");
        }
        entity.setStatus(EstimateStatus.ACEPTADO);
        estimateRepository.save(entity);
        log.info("Approved estimate with id {}", id);
        EstimateDetailResponse response = getById(id);
        emailNotificationService.notifyEstimateStatusChanged(response);
        return response;
    }

    @Override
    @Transactional
    public EstimateDetailResponse reject(Long id) {
        Estimate entity = estimateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Estimate", id));
        if (entity.getStatus() != EstimateStatus.PENDIENTE) {
            throw new BusinessException("Solo se pueden rechazar presupuestos en estado PENDIENTE");
        }
        entity.setStatus(EstimateStatus.RECHAZADO);
        estimateRepository.save(entity);
        log.info("Rejected estimate with id {}", id);
        EstimateDetailResponse response = getById(id);
        emailNotificationService.notifyEstimateStatusChanged(response);
        return response;
    }

    @Override
    @Transactional
    public EstimateDetailResponse reopen(Long id) {
        Estimate entity = estimateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Estimate", id));
        if (entity.getStatus() != EstimateStatus.ACEPTADO) {
            throw new BusinessException("Solo se pueden reabrir presupuestos en estado ACEPTADO");
        }
        if (entity.getRepairOrder() != null) {
            // The OT must be open: not closed by status and without an invoice (D1)
            repairOrderService.validateOpenForNewDocuments(entity.getRepairOrder());
        }
        entity.setStatus(EstimateStatus.PENDIENTE);
        estimateRepository.save(entity);
        recordEstimateAudit(id, EstimateStatus.ACEPTADO, null, EstimateStatus.PENDIENTE, null);
        log.info("Reopened estimate with id {}", id);
        return getById(id);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!estimateRepository.existsById(id)) {
            throw new ResourceNotFoundException("Estimate", id);
        }
        estimateRepository.deleteById(id);
        log.info("Deleted estimate with id {}", id);
    }

    @Override
    public BigDecimal calculateTotal(List<EstimateServiceItemRequest> services,
                                     List<EstimateProductRequest> products,
                                     BigDecimal discountPercentage,
                                     BigDecimal taxPercentage) {
        BigDecimal servicesTotal = BigDecimal.ZERO;
        if (services != null) {
            for (EstimateServiceItemRequest svc : services) {
                servicesTotal = servicesTotal.add(svc.price());
            }
        }

        BigDecimal productsTotal = BigDecimal.ZERO;
        if (products != null) {
            for (EstimateProductRequest prod : products) {
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
    @Transactional(readOnly = true)
    public EstimateInvoiceDataResponse convertToInvoiceData(Long estimateId) {
        Estimate entity = estimateRepository.findWithDetailsById(estimateId)
                .orElseThrow(() -> new ResourceNotFoundException("Estimate", estimateId));
        if (entity.getStatus() != EstimateStatus.ACEPTADO) {
            throw new BusinessException("Solo se pueden facturar presupuestos en estado ACEPTADO");
        }
        return estimateMapper.toInvoiceDataResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InspectionIssueResponse> getInspectionIssues(Long repairOrderId) {
        List<Inspection> inspections = inspectionRepository.findByRepairOrderId(repairOrderId);
        List<InspectionIssueResponse> issues = new ArrayList<>();
        for (Inspection inspection : inspections) {
            for (InspectionItem item : inspection.getItems()) {
                if (item.getStatus() == InspectionItemStatus.PROBLEMA
                        || item.getStatus() == InspectionItemStatus.REVISAR) {
                    issues.add(new InspectionIssueResponse(
                            item.getId(),
                            item.getTemplateItem().getName(),
                            item.getStatus().name(),
                            item.getComment()
                    ));
                }
            }
        }
        return issues;
    }

    /**
     * Records an audit row for an estimate status/amount change. Totals are
     * omitted when null (e.g. a status-only reopen), so the whitelist stays
     * minimal and no entity is ever serialized.
     */
    private void recordEstimateAudit(Long estimateId, EstimateStatus oldStatus, BigDecimal oldTotal,
                                     EstimateStatus newStatus, BigDecimal newTotal) {
        Map<String, Object> oldValues = new LinkedHashMap<>();
        oldValues.put("status", oldStatus.name());
        if (oldTotal != null) {
            oldValues.put("total", oldTotal);
        }
        Map<String, Object> newValues = new LinkedHashMap<>();
        newValues.put("status", newStatus.name());
        if (newTotal != null) {
            newValues.put("total", newTotal);
        }
        auditService.record(AuditEntityType.ESTIMATE, estimateId, AuditAction.MODIFIED, oldValues, newValues);
    }

    private void addChildEntities(Estimate entity, EstimateRequest request) {
        if (request.services() != null) {
            for (EstimateServiceItemRequest svcReq : request.services()) {
                EstimateServiceItem svc = EstimateServiceItem.builder()
                        .estimate(entity)
                        .serviceName(svcReq.serviceName())
                        .price(svcReq.price())
                        .build();
                entity.getServices().add(svc);
            }
        }
        if (request.products() != null) {
            for (EstimateProductRequest prodReq : request.products()) {
                EstimateProduct prod = EstimateProduct.builder()
                        .estimate(entity)
                        .productName(prodReq.productName())
                        .quantity(prodReq.quantity())
                        .unitPrice(prodReq.unitPrice())
                        .totalPrice(prodReq.unitPrice().multiply(BigDecimal.valueOf(prodReq.quantity())))
                        .build();
                entity.getProducts().add(prod);
            }
        }
    }

    private EstimateDetailResponse buildDetailResponseWithIssues(
            EstimateDetailResponse response, List<InspectionIssueResponse> issues) {
        return new EstimateDetailResponse(
                response.id(), response.clientId(), response.clientFullName(),
                response.clientDni(), response.clientPhone(), response.clientEmail(),
                response.vehicleId(), response.vehiclePlate(), response.vehicleBrand(),
                response.vehicleModel(), response.vehicleYear(), response.repairOrderId(),
                response.mechanicNotes(), issues, response.status(),
                response.discountPercentage(), response.taxPercentage(), response.total(),
                response.services(), response.products(),
                response.createdAt(), response.updatedAt()
        );
    }
}
