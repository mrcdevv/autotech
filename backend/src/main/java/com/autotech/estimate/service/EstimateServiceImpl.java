package com.autotech.estimate.service;

import com.autotech.catalog.repository.ProductRepository;
import com.autotech.catalog.model.Product;
import com.autotech.client.model.Client;
import com.autotech.client.repository.ClientRepository;
import com.autotech.common.exception.BusinessException;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.common.util.SecureTokens;
import com.autotech.config.AppProperties;
import com.autotech.email.service.EmailFormats;
import com.autotech.employee.model.Employee;
import com.autotech.employee.repository.EmployeeRepository;
import com.autotech.estimate.dto.EstimateDetailResponse;
import com.autotech.estimate.dto.EstimateDeliveryNoteDataResponse;
import com.autotech.estimate.dto.EstimateMapper;
import com.autotech.estimate.dto.EstimateProductRequest;
import com.autotech.estimate.dto.EstimateRequest;
import com.autotech.estimate.dto.EstimateResponse;
import com.autotech.estimate.dto.EstimateServiceItemRequest;
import com.autotech.estimate.dto.InspectionIssueResponse;
import com.autotech.estimate.dto.PublicEstimateResponse;
import com.autotech.email.service.EmailNotificationService;
import com.autotech.estimate.model.Estimate;
import com.autotech.estimate.model.EstimateDecisionChannel;
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
import com.autotech.tax.service.TaxConfigService;
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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EstimateServiceImpl implements EstimateService {

    static final int APPROVAL_LINK_DAYS = 7;

    private final EstimateRepository estimateRepository;
    private final ProductRepository productRepository;
    private final EstimateMapper estimateMapper;
    private final ClientRepository clientRepository;
    private final VehicleRepository vehicleRepository;
    private final RepairOrderRepository repairOrderRepository;
    private final InspectionRepository inspectionRepository;
    private final EmailNotificationService emailNotificationService;
    private final TaxConfigService taxConfigService;
    private final EmployeeRepository employeeRepository;
    private final AppProperties appProperties;

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

            boolean hasActiveEstimate = estimateRepository.findAllByRepairOrderId(request.repairOrderId()).stream()
                    .anyMatch(e -> e.getStatus() == EstimateStatus.PENDIENTE || e.getStatus() == EstimateStatus.ACEPTADO);
            if (hasActiveEstimate) {
                throw new BusinessException("Ya existe un presupuesto pendiente o aceptado para esta orden de trabajo");
            }
        }

        BigDecimal taxPercentage = request.taxPercentage() != null
                ? request.taxPercentage()
                : taxConfigService.getConfig().getTaxPercentage();

        Estimate entity = estimateMapper.toEntity(request);
        entity.setClient(client);
        entity.setVehicle(vehicle);
        entity.setRepairOrder(repairOrder);
        entity.setStatus(EstimateStatus.PENDIENTE);
        entity.setTaxPercentage(taxPercentage);
        entity.setApprovalToken(SecureTokens.generate());
        entity.setApprovalTokenExpiresAt(LocalDateTime.now().plusDays(APPROVAL_LINK_DAYS));

        addChildEntities(entity, request);

        BigDecimal total = calculateTotal(request.services(), request.products(),
                request.discountPercentage(), taxPercentage);
        entity.setTotal(total);

        Estimate saved = estimateRepository.save(entity);
        log.info("Created estimate with id {}", saved.getId());
        EstimateDetailResponse response = getById(saved.getId());
        emailNotificationService.notifyEstimateCreated(response,
                appProperties.publicLink("/presupuesto/" + saved.getApprovalToken()), APPROVAL_LINK_DAYS);
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

        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", request.clientId()));
        Vehicle vehicle = vehicleRepository.findById(request.vehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", request.vehicleId()));

        // Keep the stored tax when the request omits it; never re-price with the current global value
        BigDecimal taxPercentage = request.taxPercentage() != null
                ? request.taxPercentage()
                : entity.getTaxPercentage();

        entity.setClient(client);
        entity.setVehicle(vehicle);
        entity.setDiscountPercentage(request.discountPercentage() != null ? request.discountPercentage() : BigDecimal.ZERO);
        entity.setTaxPercentage(taxPercentage);

        entity.getServices().clear();
        entity.getProducts().clear();
        addChildEntities(entity, request);

        BigDecimal total = calculateTotal(request.services(), request.products(),
                request.discountPercentage(), taxPercentage);
        entity.setTotal(total);

        Estimate saved = estimateRepository.save(entity);
        log.info("Updated estimate with id {}", saved.getId());
        return getById(saved.getId());
    }

    @Override
    @Transactional
    public EstimateDetailResponse approve(Long id, EstimateDecisionChannel channel, String decidedByEmail) {
        Estimate entity = estimateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Estimate", id));
        validateStaffChannel(channel);
        return decide(entity, EstimateStatus.ACEPTADO, channel, findEmployee(decidedByEmail));
    }

    @Override
    @Transactional
    public EstimateDetailResponse reject(Long id, EstimateDecisionChannel channel, String decidedByEmail) {
        Estimate entity = estimateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Estimate", id));
        validateStaffChannel(channel);
        return decide(entity, EstimateStatus.RECHAZADO, channel, findEmployee(decidedByEmail));
    }

    @Override
    @Transactional(readOnly = true)
    public PublicEstimateResponse getByApprovalToken(String token) {
        return toPublicResponse(findByApprovalToken(token));
    }

    @Override
    @Transactional
    public PublicEstimateResponse approveByToken(String token) {
        Estimate entity = findByApprovalToken(token);
        ensureLinkUsable(entity);
        decide(entity, EstimateStatus.ACEPTADO, EstimateDecisionChannel.EMAIL_LINK, null);
        return toPublicResponse(entity);
    }

    @Override
    @Transactional
    public PublicEstimateResponse rejectByToken(String token) {
        Estimate entity = findByApprovalToken(token);
        ensureLinkUsable(entity);
        decide(entity, EstimateStatus.RECHAZADO, EstimateDecisionChannel.EMAIL_LINK, null);
        return toPublicResponse(entity);
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
    public EstimateDeliveryNoteDataResponse convertToDeliveryNoteData(Long estimateId) {
        Estimate entity = estimateRepository.findWithDetailsById(estimateId)
                .orElseThrow(() -> new ResourceNotFoundException("Estimate", estimateId));
        if (entity.getStatus() != EstimateStatus.ACEPTADO) {
            throw new BusinessException("Solo se pueden emitir remitos desde presupuestos en estado ACEPTADO");
        }
        return estimateMapper.toDeliveryNoteDataResponse(entity);
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

    private EstimateDetailResponse decide(Estimate entity, EstimateStatus newStatus,
                                          EstimateDecisionChannel channel, Employee decidedBy) {
        if (entity.getStatus() != EstimateStatus.PENDIENTE) {
            throw new BusinessException(newStatus == EstimateStatus.ACEPTADO
                    ? "Solo se pueden aprobar presupuestos en estado PENDIENTE"
                    : "Solo se pueden rechazar presupuestos en estado PENDIENTE");
        }
        entity.setStatus(newStatus);
        entity.setDecisionChannel(channel);
        entity.setDecidedAt(LocalDateTime.now());
        entity.setDecidedByEmployee(decidedBy);
        estimateRepository.save(entity);
        log.info("Estimate {} marked as {} via {}", entity.getId(), newStatus, channel);

        EstimateDetailResponse response = getById(entity.getId());
        emailNotificationService.notifyEstimateStatusChanged(response);
        return response;
    }

    private void validateStaffChannel(EstimateDecisionChannel channel) {
        if (channel == null || channel == EstimateDecisionChannel.EMAIL_LINK) {
            throw new BusinessException("Indicá si el cliente respondió por WhatsApp, por teléfono o en persona");
        }
    }

    private Employee findEmployee(String email) {
        return email == null ? null : employeeRepository.findByEmail(email).orElse(null);
    }

    private Estimate findByApprovalToken(String token) {
        return estimateRepository.findByApprovalToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("El enlace del presupuesto no es válido"));
    }

    private boolean isLinkExpired(Estimate entity) {
        return entity.getApprovalTokenExpiresAt() == null
                || !entity.getApprovalTokenExpiresAt().isAfter(LocalDateTime.now());
    }

    private void ensureLinkUsable(Estimate entity) {
        if (entity.getStatus() == EstimateStatus.ACEPTADO) {
            throw new BusinessException("Este presupuesto ya fue aprobado");
        }
        if (entity.getStatus() == EstimateStatus.RECHAZADO) {
            throw new BusinessException("Este presupuesto ya fue rechazado");
        }
        if (isLinkExpired(entity)) {
            throw new BusinessException("El enlace venció. Comunicate con el taller para recibir uno nuevo");
        }
    }

    private PublicEstimateResponse toPublicResponse(Estimate entity) {
        String vehicle = EmailFormats.vehicleLabel(
                entity.getVehicle().getBrand() != null ? entity.getVehicle().getBrand().getName() : null,
                entity.getVehicle().getModel(), entity.getVehicle().getPlate());
        List<InspectionIssueResponse> issues = entity.getRepairOrder() != null
                ? getInspectionIssues(entity.getRepairOrder().getId())
                : List.of();
        return new PublicEstimateResponse(
                entity.getId(),
                entity.getClient().getFirstName(),
                vehicle,
                entity.getServices().stream().map(estimateMapper::toServiceItemResponse).toList(),
                entity.getProducts().stream().map(estimateMapper::toProductResponse).toList(),
                issues,
                entity.getDiscountPercentage(),
                entity.getTaxPercentage(),
                entity.getTotal(),
                entity.getStatus(),
                entity.getDecisionChannel(),
                entity.getDecidedAt(),
                entity.getApprovalTokenExpiresAt(),
                entity.getStatus() == EstimateStatus.PENDIENTE && !isLinkExpired(entity)
        );
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
                response.createdAt(), response.updatedAt(),
                response.decisionChannel(), response.decidedAt(), response.decidedByEmployeeName()
        );
    }

    private Product resolveProduct(Long productId) {
        if (productId == null) return null;
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));
    }
}
