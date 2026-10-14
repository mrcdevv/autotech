package com.autotech.invoice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record InvoiceRequest(
        @NotNull(message = "El cliente es obligatorio")
        Long clientId,

        Long vehicleId,

        Long repairOrderId,

        Long estimateId,

        @DecimalMin(value = "0.00", message = "El descuento no puede ser negativo")
        @DecimalMax(value = "100.00", message = "El descuento no puede superar el 100%")
        @Digits(integer = 3, fraction = 2)
        BigDecimal discountPercentage,

        @DecimalMin(value = "0.00", message = "El impuesto no puede ser negativo")
        @DecimalMax(value = "100.00", message = "El impuesto no puede superar el 100%")
        @Digits(integer = 3, fraction = 2)
        BigDecimal taxPercentage,

        @Valid
        List<InvoiceServiceItemRequest> services,

        @Valid
        List<InvoiceProductRequest> products
) {

    /**
     * Request body for attaching an existing invoice to a repair order (T6a).
     * A deliberate, one-way and one-time association: there is no unlink and
     * re-attaching is refused, so the endpoint lives apart from any update path.
     */
    public record AttachRepairOrderRequest(
            @NotNull(message = "La orden de trabajo es obligatoria")
            Long repairOrderId
    ) {}
}
