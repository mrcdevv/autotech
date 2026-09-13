package com.autotech.tag.dto;

import com.autotech.tag.model.Tag;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TagMapper {

    public TagResponse toResponse(Tag entity) {
        if (entity == null) return null;
        return new TagResponse(
                entity.getId(),
                entity.getName(),
                entity.getColor(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public Tag toEntity(TagRequest request) {
        if (request == null) return null;
        return Tag.builder()
                .name(request.name())
                .color(request.color())
                .build();
    }

    public List<TagResponse> toResponseList(List<Tag> entities) {
        if (entities == null) return null;
        return entities.stream().map(this::toResponse).toList();
    }
}
