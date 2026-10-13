package com.autotech.deliverynote.dto;

import com.autotech.deliverynote.model.DeliveryNote;
import com.autotech.deliverynote.model.DeliveryNoteProduct;
import com.autotech.deliverynote.model.DeliveryNoteServiceItem;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Collections;

@Component
public class DeliveryNoteMapper {

    public DeliveryNoteResponse toResponse(DeliveryNote entity) {
        if (entity == null) return null;
        return new DeliveryNoteResponse(
                entity.getId(),
                entity.getNumber(),
                entity.getClient().getId(),
                entity.getClient().getFirstName() + " " + entity.getClient().getLastName(),
                entity.getVehicle() != null ? entity.getVehicle().getId() : null,
                entity.getVehicle() != null ? entity.getVehicle().getPlate() : null,
                entity.getVehicle() != null ? entity.getVehicle().getModel() : null,
                entity.getRepairOrder() != null ? entity.getRepairOrder().getId() : null,
                entity.getEstimate() != null ? entity.getEstimate().getId() : null,
                entity.getStatus(),
                entity.getDiscountPercentage(),
                entity.getTotal(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public DeliveryNoteDetailResponse toDetailResponse(DeliveryNote entity) {
        if (entity == null) return null;
        return new DeliveryNoteDetailResponse(
                entity.getId(),
                entity.getNumber(),
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

    public DeliveryNoteServiceItemResponse toServiceItemResponse(DeliveryNoteServiceItem entity) {
        if (entity == null) return null;
        return new DeliveryNoteServiceItemResponse(
                entity.getId(),
                entity.getServiceName(),
                entity.getPrice()
        );
    }

    public DeliveryNoteProductResponse toProductResponse(DeliveryNoteProduct entity) {
        if (entity == null) return null;
        return new DeliveryNoteProductResponse(
                entity.getId(),
                entity.getProductName(),
                entity.getQuantity(),
                entity.getUnitPrice(),
                entity.getTotalPrice()
        );
    }

    public DeliveryNote toEntity(DeliveryNoteRequest request) {
        if (request == null) return null;
        return DeliveryNote.builder()
                .discountPercentage(request.discountPercentage() != null ? request.discountPercentage() : BigDecimal.ZERO)
                .build();
    }
}
