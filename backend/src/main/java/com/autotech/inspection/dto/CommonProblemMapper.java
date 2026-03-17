package com.autotech.inspection.dto;

import com.autotech.inspection.model.CommonProblem;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CommonProblemMapper {

    public CommonProblemResponse toResponse(CommonProblem entity) {
        if (entity == null) return null;
        return new CommonProblemResponse(
                entity.getId(),
                entity.getDescription(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public CommonProblem toEntity(CommonProblemRequest request) {
        if (request == null) return null;
        return CommonProblem.builder()
                .description(request.description())
                .build();
    }

    public List<CommonProblemResponse> toResponseList(List<CommonProblem> entities) {
        if (entities == null) return null;
        return entities.stream().map(this::toResponse).toList();
    }
}
