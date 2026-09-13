package com.autotech.invoice.dto;

import com.autotech.invoice.model.Invoice;
import com.autotech.invoice.model.InvoiceProduct;
import com.autotech.invoice.model.InvoiceServiceItem;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Collections;

@Component
public class InvoiceMapper {

    public InvoiceResponse toResponse(Invoice entity) {
        if (entity == null) return null;
        return new InvoiceResponse(
                entity.getId(),
                entity.getClient().getId(),
                entity.getClient().getFirstName() + " " + entity.getClient().getLastName(),
                entity.getVehicle() != null ? entity.getVehicle().getId() : null,
                entity.getVehicle() != null ? entity.getVehicle().getPlate() : null,
                entity.getVehicle() != null ? entity.getVehicle().getModel() : null,
                entity.getRepairOrder() != null ? entity.getRepairOrder().getId() : null,
                entity.getEstimate() != null ? entity.getEstimate().getId() : null,
                entity.getStatus(),
                entity.getDiscountPercentage(),
                entity.getTaxPercentage(),
                entity.getTotal(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public InvoiceDetailResponse toDetailResponse(Invoice entity) {
        if (entity == null) return null;
        return new InvoiceDetailResponse(
                entity.getId(),
                entity.getClient().getId(),
                entity.getClient().getFirstName() + " " + entity.getClient().getLastName(),
                entity.getClient().getDni(),
                entity.getClient().getPhone(),
                entity.getClient().getEmail(),
                entity.getClient().getClientType().name(),
                entity.getVehicle() != null ? entity.getVehicle().getId() : null,
                entity.getVehicle() != null ? entity.getVehicle().getPlate() : null,
                entity.getVehicle() != null && entity.getVehicle().getBrand() != null
                        ? entity.getVehicle().getBrand().getName() : null,
                entity.getVehicle() != null ? entity.getVehicle().getModel() : null,
                entity.getVehicle() != null ? entity.getVehicle().getYear() : null,
                entity.getRepairOrder() != null ? entity.getRepairOrder().getId() : null,
                entity.getEstimate() != null ? entity.getEstimate().getId() : null,
                entity.getStatus(),
                entity.getDiscountPercentage(),
                entity.getTaxPercentage(),
                entity.getTotal(),
                entity.getServices() != null
                        ? entity.getServices().stream().map(this::toServiceItemResponse).toList()
                        : Collections.emptyList(),
                entity.getProducts() != null
                        ? entity.getProducts().stream().map(this::toProductResponse).toList()
                        : Collections.emptyList(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public InvoiceServiceItemResponse toServiceItemResponse(InvoiceServiceItem entity) {
        if (entity == null) return null;
        return new InvoiceServiceItemResponse(
                entity.getId(),
                entity.getServiceName(),
                entity.getPrice()
        );
    }

    public InvoiceProductResponse toProductResponse(InvoiceProduct entity) {
        if (entity == null) return null;
        return new InvoiceProductResponse(
                entity.getId(),
                entity.getProductName(),
                entity.getQuantity(),
                entity.getUnitPrice(),
                entity.getTotalPrice()
        );
    }

    public Invoice toEntity(InvoiceRequest request) {
        if (request == null) return null;
        return Invoice.builder()
                .discountPercentage(request.discountPercentage() != null ? request.discountPercentage() : BigDecimal.ZERO)
                .taxPercentage(request.taxPercentage() != null ? request.taxPercentage() : BigDecimal.ZERO)
                .build();
    }
}
