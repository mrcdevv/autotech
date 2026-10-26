package com.autotech.stock.dto;

/** INCREASE / DECREASE move on-hand stock by the given quantity; SET records a physical count. */
public enum StockAdjustmentMode {
    INCREASE,
    DECREASE,
    SET
}
