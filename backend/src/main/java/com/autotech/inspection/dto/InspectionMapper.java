package com.autotech.inspection.dto;

import com.autotech.inspection.model.InspectionItem;
import org.springframework.stereotype.Component;

@Component
public class InspectionMapper {

    public InspectionItemResponse toItemResponse(InspectionItem entity) {
        if (entity == null) return null;
        return new InspectionItemResponse(
                entity.getId(),
                entity.getTemplateItem().getId(),
                entity.getTemplateItem().getName(),
                entity.getStatus(),
                entity.getComment()
        );
    }
}
