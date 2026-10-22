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
                entity.getUpdatedAt(),
                entity.getMinStock(),
                entity.getReservedQuantity(),
                entity.getAvailableQuantity(),
                entity.isLowStock()
        );
    }

    public Product toEntity(ProductRequest request) {
        if (request == null) return null;
        return Product.builder()
                .name(request.name())
                .description(request.description())
                .quantity(request.quantity() != null ? request.quantity() : 0)
                .unitPrice(request.unitPrice())
                .minStock(request.minStock())
                .build();
    }

    /** On-hand quantity is intentionally not touched: it only changes through stock movements. */
    public void updateEntity(ProductRequest request, Product entity) {
        entity.setName(request.name());
        entity.setDescription(request.description());
        entity.setUnitPrice(request.unitPrice());
        entity.setMinStock(request.minStock());
    }
}
