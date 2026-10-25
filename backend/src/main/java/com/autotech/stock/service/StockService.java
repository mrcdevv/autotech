package com.autotech.stock.service;

import com.autotech.catalog.dto.ProductResponse;
import com.autotech.catalog.model.Product;
import com.autotech.stock.dto.StockAdjustmentRequest;
import com.autotech.stock.dto.StockMovementResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Keeps product stock in line with the documents that move it. Every sync method is idempotent: it
 * computes what the source should have reserved / consumed, compares it with the movements that source
 * already recorded and only writes the difference, so repeated or out-of-order calls never double count.
 * Each sync row-locks its source (repair order / delivery note) before reading that ledger, so concurrent
 * syncs of the same source run one after the other.
 */
public interface StockService {

    /**
     * Repair orders own the stock of their approved estimates: reserved while the order is open,
     * consumed once it is ENTREGADO (with or without a delivery note), nothing once CANCELADO.
     */
    void syncRepairOrder(Long repairOrderId);

    /** Releases what a repair order still reserves before it is deleted. Consumed stock stays consumed. */
    void releaseRepairOrder(Long repairOrderId);

    /** A delivery note without repair order (counter sale) consumes its lines; with one it moves nothing. */
    void syncDeliveryNote(Long deliveryNoteId);

    /** Returns everything a delivery note consumed, before it is deleted. */
    void revertDeliveryNote(Long deliveryNoteId);

    /** Records the opening on-hand quantity of a newly created product as an INITIAL movement. */
    void recordInitial(Product product);

    /** Manual on-hand change (purchase received, breakage, physical count) with a mandatory reason. */
    ProductResponse adjust(Long productId, StockAdjustmentRequest request);

    Page<StockMovementResponse> getMovements(Long productId, Pageable pageable);
}
