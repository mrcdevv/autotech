package com.autotech.inspection.dto;

import com.autotech.inspection.model.InspectionTemplate;
import com.autotech.inspection.model.InspectionTemplateGroup;
import com.autotech.inspection.model.InspectionTemplateItem;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class InspectionTemplateMapper {

    public InspectionTemplateResponse toResponse(InspectionTemplate entity) {
        if (entity == null) return null;
        return new InspectionTemplateResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getGroups() != null
                        ? entity.getGroups().stream().map(this::toGroupResponse).toList()
                        : List.of(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public InspectionTemplateGroupResponse toGroupResponse(InspectionTemplateGroup entity) {
        if (entity == null) return null;
        return new InspectionTemplateGroupResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getSortOrder(),
                entity.getItems() != null
                        ? entity.getItems().stream().map(this::toItemResponse).toList()
                        : List.of()
        );
    }

    public InspectionTemplateItemResponse toItemResponse(InspectionTemplateItem entity) {
        if (entity == null) return null;
        return new InspectionTemplateItemResponse(
                entity.getId(),
                entity.getName(),
                entity.getSortOrder()
        );
    }

    public List<InspectionTemplateResponse> toResponseList(List<InspectionTemplate> entities) {
        if (entities == null) return null;
        return entities.stream().map(this::toResponse).toList();
    }
}
