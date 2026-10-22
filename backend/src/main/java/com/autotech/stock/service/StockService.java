package com.autotech.stock.service;

/**
 * Keeps product stock in line with the documents that move it. Every sync method is idempotent: it
 * computes what the source should have reserved / consumed, compares it with the movements that source
 * already recorded and only writes the difference, so repeated or out-of-order calls never double count.
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
}
