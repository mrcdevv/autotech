package com.autotech.vehicle.dto;

import com.autotech.vehicle.model.Brand;
import org.springframework.stereotype.Component;

@Component
public class BrandMapper {

    public BrandResponse toResponse(Brand entity) {
        if (entity == null) return null;
        return new BrandResponse(
                entity.getId(),
                entity.getName(),
                entity.getCreatedAt()
        );
    }

    public Brand toEntity(BrandRequest request) {
        if (request == null) return null;
        return Brand.builder()
                .name(request.name())
                .build();
    }
}
