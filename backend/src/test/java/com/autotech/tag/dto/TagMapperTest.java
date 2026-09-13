package com.autotech.tag.dto;

import com.autotech.tag.model.Tag;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TagMapperTest {

    private final TagMapper mapper = new TagMapper();

    @Test
    void givenTag_whenToResponse_thenMapsAllFields() {
        Tag tag = Tag.builder().name("Urgente").color("#FF0000").build();
        tag.setId(1L);
        tag.setCreatedAt(LocalDateTime.now());
        tag.setUpdatedAt(LocalDateTime.now());

        TagResponse result = mapper.toResponse(tag);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("Urgente");
        assertThat(result.color()).isEqualTo("#FF0000");
        assertThat(result.createdAt()).isNotNull();
        assertThat(result.updatedAt()).isNotNull();
    }

    @Test
    void givenNullTag_whenToResponse_thenReturnNull() {
        assertThat(mapper.toResponse(null)).isNull();
    }

    @Test
    void givenTagRequest_whenToEntity_thenMapsFieldsAndIgnoresId() {
        TagRequest request = new TagRequest("Urgente", "#FF0000");

        Tag result = mapper.toEntity(request);

        assertThat(result.getName()).isEqualTo("Urgente");
        assertThat(result.getColor()).isEqualTo("#FF0000");
        assertThat(result.getId()).isNull();
    }

    @Test
    void givenNullRequest_whenToEntity_thenReturnNull() {
        assertThat(mapper.toEntity(null)).isNull();
    }

    @Test
    void givenTagList_whenToResponseList_thenMapsList() {
        Tag tag1 = Tag.builder().name("A").color("#000").build();
        tag1.setId(1L);
        tag1.setCreatedAt(LocalDateTime.now());
        tag1.setUpdatedAt(LocalDateTime.now());

        Tag tag2 = Tag.builder().name("B").color("#FFF").build();
        tag2.setId(2L);
        tag2.setCreatedAt(LocalDateTime.now());
        tag2.setUpdatedAt(LocalDateTime.now());

        List<TagResponse> result = mapper.toResponseList(List.of(tag1, tag2));

        assertThat(result).hasSize(2);
        assertThat(result.get(0).name()).isEqualTo("A");
        assertThat(result.get(1).name()).isEqualTo("B");
    }

    @Test
    void givenNullList_whenToResponseList_thenReturnNull() {
        assertThat(mapper.toResponseList(null)).isNull();
    }

    @Test
    void givenTagWithNullColor_whenToResponse_thenColorIsNull() {
        Tag tag = Tag.builder().name("Sin color").build();
        tag.setId(1L);
        tag.setCreatedAt(LocalDateTime.now());
        tag.setUpdatedAt(LocalDateTime.now());

        TagResponse result = mapper.toResponse(tag);

        assertThat(result.color()).isNull();
    }
}
