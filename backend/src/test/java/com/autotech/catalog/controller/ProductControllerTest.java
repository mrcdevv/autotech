package com.autotech.catalog.controller;

import com.autotech.catalog.dto.ProductRequest;
import com.autotech.catalog.dto.ProductResponse;
import com.autotech.catalog.service.ProductService;
import com.autotech.common.exception.GlobalExceptionHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductController.class)
@Import(GlobalExceptionHandler.class)
@WithMockUser
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ProductService productService;

    private final ProductResponse sampleResponse = new ProductResponse(
            1L, "Brake Pad", "Ceramic brake pad", 10, new BigDecimal("25.00"),
            LocalDateTime.now(), LocalDateTime.now());

    @Test
    void givenRequest_whenSearch_thenReturn200() throws Exception {
        // Arrange
        when(productService.search(any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleResponse)));

        // Act & Assert
        mockMvc.perform(get("/api/products").param("query", "brake"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].name").value("Brake Pad"));
    }

    @Test
    void givenExistingId_whenGetById_thenReturn200() throws Exception {
        // Arrange
        when(productService.getById(1L)).thenReturn(sampleResponse);

        // Act & Assert
        mockMvc.perform(get("/api/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Brake Pad"));
    }

    @Test
    void givenValidRequest_whenCreate_thenReturn201() throws Exception {
        // Arrange
        ProductRequest request = new ProductRequest("Brake Pad", "Ceramic", 10, new BigDecimal("25.00"));
        when(productService.create(any(ProductRequest.class))).thenReturn(sampleResponse);

        // Act & Assert
        mockMvc.perform(post("/api/products").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Brake Pad"));
    }

    @Test
    void givenInvalidRequest_whenCreate_thenReturn400() throws Exception {
        // Arrange
        ProductRequest request = new ProductRequest("", null, -1, null);

        // Act & Assert
        mockMvc.perform(post("/api/products").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void givenValidRequest_whenUpdate_thenReturn200() throws Exception {
        // Arrange
        ProductRequest request = new ProductRequest("Updated", "Updated desc", 20, new BigDecimal("30.00"));
        when(productService.update(eq(1L), any(ProductRequest.class))).thenReturn(sampleResponse);

        // Act & Assert
        mockMvc.perform(put("/api/products/1").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void givenExistingId_whenDelete_thenReturn200() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/products/1").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Producto eliminado"));
    }
}
