package com.autotech.stock.dto;

import com.autotech.stock.model.StockMovement;
import org.springframework.stereotype.Component;

@Component
public class StockMovementMapper {

    public StockMovementResponse toResponse(StockMovement entity) {
        if (entity == null) return null;
        return new StockMovementResponse(
                entity.getId(),
                entity.getProduct().getId(),
                entity.getType(),
                entity.getQuantity(),
                entity.getSourceType(),
                entity.getSourceId(),
                entity.getReason(),
                entity.getCreatedBy() != null
                        ? entity.getCreatedBy().getFirstName() + " " + entity.getCreatedBy().getLastName()
                        : null,
                entity.getCreatedAt()
        );
    }
}
