package com.autotech.tag.service;

import com.autotech.common.exception.DuplicateResourceException;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.tag.dto.TagMapper;
import com.autotech.tag.dto.TagRequest;
import com.autotech.tag.dto.TagResponse;
import com.autotech.tag.model.Tag;
import com.autotech.tag.repository.TagRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TagServiceImplTest {

    @Mock
    private TagRepository tagRepository;

    @Mock
    private TagMapper tagMapper;

    @InjectMocks
    private TagServiceImpl tagService;

    @Test
    void givenTagsExist_whenGetAll_thenReturnOrderedList() {
        Tag tag = buildTag(1L, "Urgente", "#FF0000");
        TagResponse response = buildTagResponse(1L, "Urgente", "#FF0000");
        when(tagRepository.findAllByOrderByNameAsc()).thenReturn(List.of(tag));
        when(tagMapper.toResponseList(List.of(tag))).thenReturn(List.of(response));

        List<TagResponse> result = tagService.getAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("Urgente");
    }

    @Test
    void givenValidId_whenGetById_thenReturnTagResponse() {
        Tag tag = buildTag(1L, "Urgente", "#FF0000");
        TagResponse response = buildTagResponse(1L, "Urgente", "#FF0000");
        when(tagRepository.findById(1L)).thenReturn(Optional.of(tag));
        when(tagMapper.toResponse(tag)).thenReturn(response);

        TagResponse result = tagService.getById(1L);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("Urgente");
    }

    @Test
    void givenNonExistentId_whenGetById_thenThrowResourceNotFoundException() {
        when(tagRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tagService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenValidRequest_whenCreate_thenReturnTagResponse() {
        TagRequest request = new TagRequest("Urgente", "#FF0000");
        Tag entity = buildTag(null, "Urgente", "#FF0000");
        Tag saved = buildTag(1L, "Urgente", "#FF0000");
        TagResponse response = buildTagResponse(1L, "Urgente", "#FF0000");

        when(tagRepository.existsByName("Urgente")).thenReturn(false);
        when(tagMapper.toEntity(request)).thenReturn(entity);
        when(tagRepository.save(entity)).thenReturn(saved);
        when(tagMapper.toResponse(saved)).thenReturn(response);

        TagResponse result = tagService.create(request);

        assertThat(result.id()).isEqualTo(1L);
        verify(tagRepository).save(entity);
    }

    @Test
    void givenDuplicateName_whenCreate_thenThrowDuplicateResourceException() {
        TagRequest request = new TagRequest("Urgente", "#FF0000");
        when(tagRepository.existsByName("Urgente")).thenReturn(true);

        assertThatThrownBy(() -> tagService.create(request))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void givenValidRequest_whenUpdate_thenReturnUpdatedResponse() {
        TagRequest request = new TagRequest("Importante", "#00FF00");
        Tag entity = buildTag(1L, "Urgente", "#FF0000");
        TagResponse response = buildTagResponse(1L, "Importante", "#00FF00");

        when(tagRepository.findById(1L)).thenReturn(Optional.of(entity));
        when(tagRepository.existsByNameAndIdNot("Importante", 1L)).thenReturn(false);
        when(tagRepository.save(entity)).thenReturn(entity);
        when(tagMapper.toResponse(entity)).thenReturn(response);

        TagResponse result = tagService.update(1L, request);

        assertThat(result.name()).isEqualTo("Importante");
        verify(tagRepository).save(entity);
    }

    @Test
    void givenNonExistentId_whenUpdate_thenThrowResourceNotFoundException() {
        when(tagRepository.findById(99L)).thenReturn(Optional.empty());
        TagRequest request = new TagRequest("Urgente", "#FF0000");

        assertThatThrownBy(() -> tagService.update(99L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenDuplicateName_whenUpdate_thenThrowDuplicateResourceException() {
        TagRequest request = new TagRequest("Existente", "#FF0000");
        Tag entity = buildTag(1L, "Urgente", "#FF0000");

        when(tagRepository.findById(1L)).thenReturn(Optional.of(entity));
        when(tagRepository.existsByNameAndIdNot("Existente", 1L)).thenReturn(true);

        assertThatThrownBy(() -> tagService.update(1L, request))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void givenExistingId_whenDelete_thenDeletesSuccessfully() {
        when(tagRepository.existsById(1L)).thenReturn(true);

        tagService.delete(1L);

        verify(tagRepository).deleteById(1L);
    }

    @Test
    void givenNonExistentId_whenDelete_thenThrowResourceNotFoundException() {
        when(tagRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> tagService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // --- Helpers ---

    private Tag buildTag(Long id, String name, String color) {
        Tag tag = Tag.builder().name(name).color(color).build();
        if (id != null) tag.setId(id);
        return tag;
    }

    private TagResponse buildTagResponse(Long id, String name, String color) {
        return new TagResponse(id, name, color, LocalDateTime.now(), LocalDateTime.now());
    }
}
