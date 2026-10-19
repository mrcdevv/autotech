package com.autotech.stock.model;

/**
 * INITIAL and ADJUSTMENT carry a signed on-hand delta. The other types carry a positive quantity and
 * their direction comes from the type: RESERVE/RELEASE move reserved stock, CONSUME/RETURN move on-hand stock.
 */
public enum StockMovementType {
    INITIAL,
    ADJUSTMENT,
    RESERVE,
    RELEASE,
    CONSUME,
    RETURN
}
