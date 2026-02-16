package com.autotech.catalog.dto;

import com.autotech.catalog.model.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public ProductResponse toResponse(Product entity) {
        if (entity == null) return null;
        return new ProductResponse(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getQuantity(),
                entity.getUnitPrice(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public Product toEntity(ProductRequest request) {
        if (request == null) return null;
        return Product.builder()
                .name(request.name())
                .description(request.description())
                .quantity(request.quantity() != null ? request.quantity() : 0)
                .unitPrice(request.unitPrice())
                .build();
    }

    public void updateEntity(ProductRequest request, Product entity) {
        entity.setName(request.name());
        entity.setDescription(request.description());
        entity.setQuantity(request.quantity() != null ? request.quantity() : 0);
        entity.setUnitPrice(request.unitPrice());
    }
}
