package com.autotech.catalog.service;

import com.autotech.catalog.dto.ProductMapper;
import com.autotech.catalog.dto.ProductRequest;
import com.autotech.catalog.dto.ProductResponse;
import com.autotech.catalog.model.Product;
import com.autotech.catalog.repository.ProductRepository;
import com.autotech.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductMapper productMapper;

    @InjectMocks
    private ProductServiceImpl productService;

    private final Pageable pageable = PageRequest.of(0, 12);

    @Test
    void givenQuery_whenSearch_thenReturnFilteredPage() {
        // Arrange
        Product entity = buildEntity(1L, "Brake Pad");
        ProductResponse response = buildResponse(1L, "Brake Pad");
        Page<Product> entityPage = new PageImpl<>(List.of(entity));

        when(productRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
                eq("brake"), eq("brake"), eq(pageable))).thenReturn(entityPage);
        when(productMapper.toResponse(entity)).thenReturn(response);

        // Act
        Page<ProductResponse> result = productService.search("brake", pageable);

        // Assert
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().name()).isEqualTo("Brake Pad");
    }

    @Test
    void givenBlankQuery_whenSearch_thenReturnAll() {
        // Arrange
        Product entity = buildEntity(1L, "Brake Pad");
        ProductResponse response = buildResponse(1L, "Brake Pad");
        Page<Product> entityPage = new PageImpl<>(List.of(entity));

        when(productRepository.findAll(pageable)).thenReturn(entityPage);
        when(productMapper.toResponse(entity)).thenReturn(response);

        // Act
        Page<ProductResponse> result = productService.search("", pageable);

        // Assert
        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void givenExistingId_whenGetById_thenReturnResponse() {
        // Arrange
        Product entity = buildEntity(1L, "Brake Pad");
        ProductResponse response = buildResponse(1L, "Brake Pad");

        when(productRepository.findById(1L)).thenReturn(Optional.of(entity));
        when(productMapper.toResponse(entity)).thenReturn(response);

        // Act
        ProductResponse result = productService.getById(1L);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void givenNonExistingId_whenGetById_thenThrowResourceNotFoundException() {
        // Arrange
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> productService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenValidRequest_whenCreate_thenReturnResponse() {
        // Arrange
        ProductRequest request = new ProductRequest("Brake Pad", "Ceramic brake pad", 10, new BigDecimal("25.00"));
        Product entity = buildEntity(null, "Brake Pad");
        Product saved = buildEntity(1L, "Brake Pad");
        ProductResponse response = buildResponse(1L, "Brake Pad");

        when(productMapper.toEntity(request)).thenReturn(entity);
        when(productRepository.save(entity)).thenReturn(saved);
        when(productMapper.toResponse(saved)).thenReturn(response);

        // Act
        ProductResponse result = productService.create(request);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void givenExistingId_whenUpdate_thenReturnUpdatedResponse() {
        // Arrange
        ProductRequest request = new ProductRequest("Updated Pad", "Updated desc", 20, new BigDecimal("30.00"));
        Product entity = buildEntity(1L, "Brake Pad");
        Product saved = buildEntity(1L, "Updated Pad");
        ProductResponse response = buildResponse(1L, "Updated Pad");

        when(productRepository.findById(1L)).thenReturn(Optional.of(entity));
        when(productRepository.save(entity)).thenReturn(saved);
        when(productMapper.toResponse(saved)).thenReturn(response);

        // Act
        ProductResponse result = productService.update(1L, request);

        // Assert
        assertThat(result.name()).isEqualTo("Updated Pad");
        verify(productMapper).updateEntity(request, entity);
    }

    @Test
    void givenNonExistingId_whenUpdate_thenThrowResourceNotFoundException() {
        // Arrange
        ProductRequest request = new ProductRequest("X", null, 0, null);
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> productService.update(99L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenExistingId_whenDelete_thenDeleteSuccessfully() {
        // Arrange
        when(productRepository.existsById(1L)).thenReturn(true);

        // Act
        productService.delete(1L);

        // Assert
        verify(productRepository).deleteById(1L);
    }

    @Test
    void givenNonExistingId_whenDelete_thenThrowResourceNotFoundException() {
        // Arrange
        when(productRepository.existsById(99L)).thenReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> productService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private Product buildEntity(Long id, String name) {
        Product entity = Product.builder()
                .name(name)
                .description("Test description")
                .quantity(10)
                .unitPrice(new BigDecimal("25.00"))
                .build();
        if (id != null) entity.setId(id);
        return entity;
    }

    private ProductResponse buildResponse(Long id, String name) {
        return new ProductResponse(id, name, "Test description", 10, new BigDecimal("25.00"),
                LocalDateTime.now(), LocalDateTime.now());
    }
}
