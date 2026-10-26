package com.autotech.stock.service;

import com.autotech.catalog.dto.ProductMapper;
import com.autotech.catalog.dto.ProductResponse;
import com.autotech.catalog.model.Product;
import com.autotech.catalog.repository.ProductRepository;
import com.autotech.common.exception.BusinessException;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.deliverynote.model.DeliveryNote;
import com.autotech.deliverynote.model.DeliveryNoteProduct;
import com.autotech.deliverynote.repository.DeliveryNoteRepository;
import com.autotech.employee.model.Employee;
import com.autotech.employee.repository.EmployeeRepository;
import com.autotech.estimate.model.Estimate;
import com.autotech.estimate.model.EstimateProduct;
import com.autotech.estimate.model.EstimateStatus;
import com.autotech.estimate.repository.EstimateRepository;
import com.autotech.repairorder.model.RepairOrder;
import com.autotech.repairorder.model.RepairOrderStatus;
import com.autotech.repairorder.repository.RepairOrderRepository;
import com.autotech.stock.dto.StockAdjustmentRequest;
import com.autotech.stock.dto.StockMovementMapper;
import com.autotech.stock.dto.StockMovementResponse;
import com.autotech.stock.model.StockMovement;
import com.autotech.stock.model.StockMovementType;
import com.autotech.stock.model.StockSourceType;
import com.autotech.stock.repository.StockMovementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockServiceImpl implements StockService {

    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;
    private final RepairOrderRepository repairOrderRepository;
    private final EstimateRepository estimateRepository;
    private final DeliveryNoteRepository deliveryNoteRepository;
    private final EmployeeRepository employeeRepository;
    private final ProductMapper productMapper;
    private final StockMovementMapper stockMovementMapper;

    @Override
    @Transactional
    public void syncRepairOrder(Long repairOrderId) {
        RepairOrder order = lockRepairOrder(repairOrderId);

        Map<Long, Integer> lines = new HashMap<>();
        for (Estimate estimate : estimateRepository.findAllByRepairOrderId(repairOrderId)) {
            if (estimate.getStatus() != EstimateStatus.ACEPTADO) continue;
            for (EstimateProduct line : estimate.getProducts()) {
                addLine(lines, line.getProduct(), line.getQuantity());
            }
        }

        Map<Long, Integer> reserved = Map.of();
        Map<Long, Integer> consumed = Map.of();
        if (order.getStatus() == RepairOrderStatus.ENTREGADO) {
            consumed = lines;
        } else if (order.getStatus() != RepairOrderStatus.CANCELADO) {
            reserved = lines;
        }
        applyTarget(StockSourceType.REPAIR_ORDER, repairOrderId, reserved, consumed);
    }

    @Override
    @Transactional
    public void releaseRepairOrder(Long repairOrderId) {
        lockRepairOrder(repairOrderId);
        List<StockMovement> applied = stockMovementRepository
                .findBySourceTypeAndSourceIdOrderByIdAsc(StockSourceType.REPAIR_ORDER, repairOrderId);
        Map<Long, Integer> consumed = net(applied, StockMovementType.CONSUME, StockMovementType.RETURN);
        applyTarget(StockSourceType.REPAIR_ORDER, repairOrderId, Map.of(), consumed);
    }

    @Override
    @Transactional
    public void syncDeliveryNote(Long deliveryNoteId) {
        DeliveryNote note = lockDeliveryNote(deliveryNoteId);

        Map<Long, Integer> consumed = new HashMap<>();
        // With a repair order the order owns the stock; the note itself stays neutral
        if (note.getRepairOrder() == null) {
            for (DeliveryNoteProduct line : note.getProducts()) {
                addLine(consumed, line.getProduct(), line.getQuantity());
            }
        }
        applyTarget(StockSourceType.DELIVERY_NOTE, deliveryNoteId, Map.of(), consumed);
    }

    @Override
    @Transactional
    public void revertDeliveryNote(Long deliveryNoteId) {
        lockDeliveryNote(deliveryNoteId);
        applyTarget(StockSourceType.DELIVERY_NOTE, deliveryNoteId, Map.of(), Map.of());
    }

    @Override
    @Transactional
    public void recordInitial(Product product) {
        if (product.getQuantity() == null || product.getQuantity() == 0) {
            return;
        }
        stockMovementRepository.save(StockMovement.builder()
                .product(product)
                .type(StockMovementType.INITIAL)
                .quantity(product.getQuantity())
                .sourceType(StockSourceType.MANUAL)
                .reason("Stock inicial")
                .createdBy(currentEmployee())
                .build());
    }

    @Override
    @Transactional
    public ProductResponse adjust(Long productId, StockAdjustmentRequest request) {
        Product product = productRepository.findAllByIdInForUpdate(List.of(productId)).stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        int delta = switch (request.mode()) {
            case INCREASE -> request.quantity();
            case DECREASE -> -request.quantity();
            case SET -> request.quantity() - product.getQuantity();
        };
        if (delta == 0) {
            throw new BusinessException("El ajuste no modifica el stock actual");
        }

        product.setQuantity(product.getQuantity() + delta);
        stockMovementRepository.save(StockMovement.builder()
                .product(product)
                .type(StockMovementType.ADJUSTMENT)
                .quantity(delta)
                .sourceType(StockSourceType.MANUAL)
                .reason(request.reason().trim())
                .createdBy(currentEmployee())
                .build());
        log.info("Adjusted stock of product {} by {} ({})", productId, delta, request.mode());
        return productMapper.toResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StockMovementResponse> getMovements(Long productId, Pageable pageable) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product", productId);
        }
        return stockMovementRepository.findByProductId(productId, pageable)
                .map(stockMovementMapper::toResponse);
    }

    /**
     * Brings the stock held by one source to the desired reserved / consumed quantities per product,
     * writing only the delta against the movements that source already recorded.
     */
    void applyTarget(StockSourceType sourceType, Long sourceId,
                     Map<Long, Integer> desiredReserved, Map<Long, Integer> desiredConsumed) {
        List<StockMovement> applied = stockMovementRepository.findBySourceTypeAndSourceIdOrderByIdAsc(sourceType, sourceId);
        Map<Long, Integer> appliedReserved = net(applied, StockMovementType.RESERVE, StockMovementType.RELEASE);
        Map<Long, Integer> appliedConsumed = net(applied, StockMovementType.CONSUME, StockMovementType.RETURN);

        TreeSet<Long> productIds = new TreeSet<>();
        productIds.addAll(desiredReserved.keySet());
        productIds.addAll(desiredConsumed.keySet());
        productIds.addAll(appliedReserved.keySet());
        productIds.addAll(appliedConsumed.keySet());
        productIds.removeIf(id -> delta(desiredReserved, appliedReserved, id) == 0
                && delta(desiredConsumed, appliedConsumed, id) == 0);
        if (productIds.isEmpty()) {
            return;
        }

        Employee actor = currentEmployee();
        List<StockMovement> movements = new ArrayList<>();
        for (Product product : productRepository.findAllByIdInForUpdate(productIds)) {
            Long id = product.getId();
            int reserveDelta = delta(desiredReserved, appliedReserved, id);
            int consumeDelta = delta(desiredConsumed, appliedConsumed, id);

            // Release before consuming so the history reads in the order things happen
            if (reserveDelta != 0) {
                product.setReservedQuantity(product.getReservedQuantity() + reserveDelta);
                movements.add(movement(product,
                        reserveDelta > 0 ? StockMovementType.RESERVE : StockMovementType.RELEASE,
                        Math.abs(reserveDelta), sourceType, sourceId, actor));
            }
            if (consumeDelta != 0) {
                // On hand may go negative: delivering a car is never blocked by stock
                product.setQuantity(product.getQuantity() - consumeDelta);
                movements.add(movement(product,
                        consumeDelta > 0 ? StockMovementType.CONSUME : StockMovementType.RETURN,
                        Math.abs(consumeDelta), sourceType, sourceId, actor));
            }
        }
        stockMovementRepository.saveAll(movements);
        log.info("Stock synced for {} {}: {} movement(s)", sourceType, sourceId, movements.size());
    }

    private RepairOrder lockRepairOrder(Long repairOrderId) {
        return repairOrderRepository.findForUpdateById(repairOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("RepairOrder", repairOrderId));
    }

    private DeliveryNote lockDeliveryNote(Long deliveryNoteId) {
        return deliveryNoteRepository.findForUpdateById(deliveryNoteId)
                .orElseThrow(() -> new ResourceNotFoundException("DeliveryNote", deliveryNoteId));
    }

    private static void addLine(Map<Long, Integer> lines, Product product, Integer quantity) {
        if (product == null || quantity == null) return;
        lines.merge(product.getId(), quantity, Integer::sum);
    }

    private static Map<Long, Integer> net(List<StockMovement> movements,
                                          StockMovementType plus, StockMovementType minus) {
        Map<Long, Integer> result = new HashMap<>();
        for (StockMovement m : movements) {
            if (m.getType() == plus) {
                result.merge(m.getProduct().getId(), m.getQuantity(), Integer::sum);
            } else if (m.getType() == minus) {
                result.merge(m.getProduct().getId(), -m.getQuantity(), Integer::sum);
            }
        }
        return result;
    }

    private static int delta(Map<Long, Integer> desired, Map<Long, Integer> applied, Long productId) {
        return desired.getOrDefault(productId, 0) - applied.getOrDefault(productId, 0);
    }

    private static StockMovement movement(Product product, StockMovementType type, int quantity,
                                          StockSourceType sourceType, Long sourceId, Employee actor) {
        return StockMovement.builder()
                .product(product)
                .type(type)
                .quantity(quantity)
                .sourceType(sourceType)
                .sourceId(sourceId)
                .createdBy(actor)
                .build();
    }

    /** The logged-in employee, or null for system / public actions (e.g. client approval by email link). */
    private Employee currentEmployee() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return null;
        }
        return employeeRepository.findByEmail(auth.getName()).orElse(null);
    }
}
