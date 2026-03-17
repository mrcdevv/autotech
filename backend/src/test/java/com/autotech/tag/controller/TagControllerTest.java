package com.autotech.tag.controller;

import com.autotech.common.exception.DuplicateResourceException;
import com.autotech.common.exception.GlobalExceptionHandler;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.tag.dto.TagRequest;
import com.autotech.tag.dto.TagResponse;
import com.autotech.tag.service.TagService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TagController.class)
@Import(GlobalExceptionHandler.class)
@WithMockUser
class TagControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TagService tagService;

    private final TagResponse sampleResponse = new TagResponse(
            1L, "Urgente", "#FF0000", LocalDateTime.now(), LocalDateTime.now());

    @Test
    void givenTagsExist_whenGetAll_thenReturn200() throws Exception {
        when(tagService.getAll()).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/tags"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("Urgente"));
    }

    @Test
    void givenValidId_whenGetById_thenReturn200() throws Exception {
        when(tagService.getById(1L)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/tags/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    void givenNonExistentId_whenGetById_thenReturn404() throws Exception {
        when(tagService.getById(99L)).thenThrow(new ResourceNotFoundException("Tag", 99L));

        mockMvc.perform(get("/api/tags/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void givenValidRequest_whenCreate_thenReturn201() throws Exception {
        TagRequest request = new TagRequest("Urgente", "#FF0000");
        when(tagService.create(any(TagRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/tags")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Etiqueta creada"));
    }

    @Test
    void givenBlankName_whenCreate_thenReturn400() throws Exception {
        TagRequest request = new TagRequest("", "#FF0000");

        mockMvc.perform(post("/api/tags")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void givenDuplicateName_whenCreate_thenReturn409() throws Exception {
        TagRequest request = new TagRequest("Urgente", "#FF0000");
        when(tagService.create(any(TagRequest.class)))
                .thenThrow(new DuplicateResourceException("Ya existe una etiqueta con el nombre: Urgente"));

        mockMvc.perform(post("/api/tags")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void givenValidRequest_whenUpdate_thenReturn200() throws Exception {
        TagRequest request = new TagRequest("Importante", "#00FF00");
        when(tagService.update(eq(1L), any(TagRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(put("/api/tags/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Etiqueta actualizada"));
    }

    @Test
    void givenDuplicateName_whenUpdate_thenReturn409() throws Exception {
        TagRequest request = new TagRequest("Existente", "#FF0000");
        when(tagService.update(eq(1L), any(TagRequest.class)))
                .thenThrow(new DuplicateResourceException("Ya existe una etiqueta con el nombre: Existente"));

        mockMvc.perform(put("/api/tags/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void givenExistingId_whenDelete_thenReturn200() throws Exception {
        doNothing().when(tagService).delete(1L);

        mockMvc.perform(delete("/api/tags/1").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Etiqueta eliminada"));
    }

    @Test
    void givenNonExistentId_whenDelete_thenReturn404() throws Exception {
        doThrow(new ResourceNotFoundException("Tag", 99L)).when(tagService).delete(99L);

        mockMvc.perform(delete("/api/tags/99").with(csrf()))
                .andExpect(status().isNotFound());
    }
}
