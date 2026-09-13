package com.autotech.estimate.dto;

import com.autotech.estimate.model.Estimate;
import com.autotech.estimate.model.EstimateProduct;
import com.autotech.estimate.model.EstimateServiceItem;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
public class EstimateMapper {

    public EstimateResponse toResponse(Estimate entity) {
        if (entity == null) return null;
        return new EstimateResponse(
                entity.getId(),
                entity.getClient().getId(),
                entity.getClient().getFirstName() + " " + entity.getClient().getLastName(),
                entity.getVehicle().getId(),
                entity.getVehicle().getPlate(),
                entity.getVehicle().getModel(),
                entity.getRepairOrder() != null ? entity.getRepairOrder().getId() : null,
                entity.getStatus(),
                entity.getDiscountPercentage(),
                entity.getTaxPercentage(),
                entity.getTotal(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public EstimateDetailResponse toDetailResponse(Estimate entity) {
        if (entity == null) return null;
        return new EstimateDetailResponse(
                entity.getId(),
                entity.getClient().getId(),
                entity.getClient().getFirstName() + " " + entity.getClient().getLastName(),
                entity.getClient().getDni(),
                entity.getClient().getPhone(),
                entity.getClient().getEmail(),
                entity.getVehicle().getId(),
                entity.getVehicle().getPlate(),
                entity.getVehicle().getBrand() != null ? entity.getVehicle().getBrand().getName() : null,
                entity.getVehicle().getModel(),
                entity.getVehicle().getYear(),
                entity.getRepairOrder() != null ? entity.getRepairOrder().getId() : null,
                entity.getRepairOrder() != null ? entity.getRepairOrder().getMechanicNotes() : null,
                Collections.emptyList(),
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

    public EstimateServiceItemResponse toServiceItemResponse(EstimateServiceItem entity) {
        if (entity == null) return null;
        return new EstimateServiceItemResponse(
                entity.getId(),
                entity.getServiceName(),
                entity.getPrice()
        );
    }

    public EstimateProductResponse toProductResponse(EstimateProduct entity) {
        if (entity == null) return null;
        return new EstimateProductResponse(
                entity.getId(),
                entity.getProductName(),
                entity.getQuantity(),
                entity.getUnitPrice(),
                entity.getTotalPrice()
        );
    }

    public Estimate toEntity(EstimateRequest request) {
        if (request == null) return null;
        return Estimate.builder()
                .discountPercentage(request.discountPercentage() != null ? request.discountPercentage() : java.math.BigDecimal.ZERO)
                .taxPercentage(request.taxPercentage() != null ? request.taxPercentage() : java.math.BigDecimal.ZERO)
                .build();
    }

    public EstimateInvoiceDataResponse toInvoiceDataResponse(Estimate entity) {
        if (entity == null) return null;
        return new EstimateInvoiceDataResponse(
                entity.getId(),
                entity.getClient().getId(),
                entity.getVehicle().getId(),
                entity.getRepairOrder() != null ? entity.getRepairOrder().getId() : null,
                entity.getServices() != null
                        ? entity.getServices().stream().map(this::toServiceItemResponse).toList()
                        : Collections.emptyList(),
                entity.getProducts() != null
                        ? entity.getProducts().stream().map(this::toProductResponse).toList()
                        : Collections.emptyList(),
                entity.getDiscountPercentage(),
                entity.getTaxPercentage(),
                entity.getTotal()
        );
    }
}
