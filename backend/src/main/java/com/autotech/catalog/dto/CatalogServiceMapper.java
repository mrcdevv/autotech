package com.autotech.catalog.dto;

import com.autotech.catalog.model.CatalogService;
import org.springframework.stereotype.Component;

@Component
public class CatalogServiceMapper {

    public CatalogServiceResponse toResponse(CatalogService entity) {
        if (entity == null) return null;
        return new CatalogServiceResponse(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getPrice(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public CatalogService toEntity(CatalogServiceRequest request) {
        if (request == null) return null;
        return CatalogService.builder()
                .name(request.name())
                .description(request.description())
                .price(request.price())
                .build();
    }

    public void updateEntity(CatalogServiceRequest request, CatalogService entity) {
        entity.setName(request.name());
        entity.setDescription(request.description());
        entity.setPrice(request.price());
    }
}
