package com.autotech.catalog.dto;

import com.autotech.catalog.model.CannedJob;
import com.autotech.catalog.model.CannedJobProduct;
import com.autotech.catalog.model.CannedJobService;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CannedJobMapper {

    public CannedJobResponse toResponse(CannedJob entity) {
        if (entity == null) return null;
        return new CannedJobResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public CannedJobDetailResponse toDetailResponse(CannedJob entity) {
        if (entity == null) return null;

        List<CannedJobServiceResponse> services = entity.getServices().stream()
                .map(this::toServiceResponse)
                .toList();

        List<CannedJobProductResponse> products = entity.getProducts().stream()
                .map(this::toProductResponse)
                .toList();

        return new CannedJobDetailResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getDescription(),
                services,
                products,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public CannedJobServiceResponse toServiceResponse(CannedJobService entity) {
        if (entity == null) return null;
        return new CannedJobServiceResponse(
                entity.getId(),
                entity.getServiceName(),
                entity.getPrice()
        );
    }

    public CannedJobProductResponse toProductResponse(CannedJobProduct entity) {
        if (entity == null) return null;
        return new CannedJobProductResponse(
                entity.getId(),
                entity.getProductName(),
                entity.getQuantity(),
                entity.getUnitPrice()
        );
    }

    public CannedJob toEntity(CannedJobRequest request) {
        if (request == null) return null;
        return CannedJob.builder()
                .title(request.title())
                .description(request.description())
                .build();
    }
}
