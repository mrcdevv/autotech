package com.autotech.dashboard.dto;

import java.math.BigDecimal;

/**
 * Headline figures of the reports page for a period. "Collected" means delivery notes
 * marked as paid; "pending" is everything else billed in the period.
 */
public record ReportKpisResponse(
        BigDecimal totalBilled,
        BigDecimal totalCollected,
        BigDecimal totalPending,
        long deliveryNoteCount,
        long pendingDeliveryNoteCount,
        BigDecimal averageTicket,
        long estimatesTotal,
        long estimatesAccepted,
        long repairOrderCount
) {}
