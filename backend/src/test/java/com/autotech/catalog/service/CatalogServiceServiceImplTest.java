package com.autotech.catalog.service;

import com.autotech.catalog.dto.CatalogServiceMapper;
import com.autotech.catalog.dto.CatalogServiceRequest;
import com.autotech.catalog.dto.CatalogServiceResponse;
import com.autotech.catalog.model.CatalogService;
import com.autotech.catalog.repository.CatalogServiceRepository;
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
class CatalogServiceServiceImplTest {

    @Mock
    private CatalogServiceRepository catalogServiceRepository;

    @Mock
    private CatalogServiceMapper catalogServiceMapper;

    @InjectMocks
    private CatalogServiceServiceImpl catalogServiceService;

    private final Pageable pageable = PageRequest.of(0, 12);

    @Test
    void givenQuery_whenSearch_thenReturnFilteredPage() {
        // Arrange
        CatalogService entity = buildEntity(1L, "Oil Change");
        CatalogServiceResponse response = buildResponse(1L, "Oil Change");
        Page<CatalogService> entityPage = new PageImpl<>(List.of(entity));

        when(catalogServiceRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
                eq("oil"), eq("oil"), eq(pageable))).thenReturn(entityPage);
        when(catalogServiceMapper.toResponse(entity)).thenReturn(response);

        // Act
        Page<CatalogServiceResponse> result = catalogServiceService.search("oil", pageable);

        // Assert
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().name()).isEqualTo("Oil Change");
    }

    @Test
    void givenBlankQuery_whenSearch_thenReturnAll() {
        // Arrange
        CatalogService entity = buildEntity(1L, "Oil Change");
        CatalogServiceResponse response = buildResponse(1L, "Oil Change");
        Page<CatalogService> entityPage = new PageImpl<>(List.of(entity));

        when(catalogServiceRepository.findAll(pageable)).thenReturn(entityPage);
        when(catalogServiceMapper.toResponse(entity)).thenReturn(response);

        // Act
        Page<CatalogServiceResponse> result = catalogServiceService.search("", pageable);

        // Assert
        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void givenExistingId_whenGetById_thenReturnResponse() {
        // Arrange
        CatalogService entity = buildEntity(1L, "Oil Change");
        CatalogServiceResponse response = buildResponse(1L, "Oil Change");

        when(catalogServiceRepository.findById(1L)).thenReturn(Optional.of(entity));
        when(catalogServiceMapper.toResponse(entity)).thenReturn(response);

        // Act
        CatalogServiceResponse result = catalogServiceService.getById(1L);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("Oil Change");
    }

    @Test
    void givenNonExistingId_whenGetById_thenThrowResourceNotFoundException() {
        // Arrange
        when(catalogServiceRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> catalogServiceService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void givenValidRequest_whenCreate_thenReturnResponse() {
        // Arrange
        CatalogServiceRequest request = new CatalogServiceRequest("Oil Change", "Full oil change", new BigDecimal("50.00"));
        CatalogService entity = buildEntity(null, "Oil Change");
        CatalogService saved = buildEntity(1L, "Oil Change");
        CatalogServiceResponse response = buildResponse(1L, "Oil Change");

        when(catalogServiceMapper.toEntity(request)).thenReturn(entity);
        when(catalogServiceRepository.save(entity)).thenReturn(saved);
        when(catalogServiceMapper.toResponse(saved)).thenReturn(response);

        // Act
        CatalogServiceResponse result = catalogServiceService.create(request);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void givenExistingId_whenUpdate_thenReturnUpdatedResponse() {
        // Arrange
        CatalogServiceRequest request = new CatalogServiceRequest("Updated Service", "Updated desc", new BigDecimal("75.00"));
        CatalogService entity = buildEntity(1L, "Oil Change");
        CatalogService saved = buildEntity(1L, "Updated Service");
        CatalogServiceResponse response = buildResponse(1L, "Updated Service");

        when(catalogServiceRepository.findById(1L)).thenReturn(Optional.of(entity));
        when(catalogServiceRepository.save(entity)).thenReturn(saved);
        when(catalogServiceMapper.toResponse(saved)).thenReturn(response);

        // Act
        CatalogServiceResponse result = catalogServiceService.update(1L, request);

        // Assert
        assertThat(result.name()).isEqualTo("Updated Service");
        verify(catalogServiceMapper).updateEntity(request, entity);
    }

    @Test
    void givenNonExistingId_whenUpdate_thenThrowResourceNotFoundException() {
        // Arrange
        CatalogServiceRequest request = new CatalogServiceRequest("X", null, null);
        when(catalogServiceRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> catalogServiceService.update(99L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenExistingId_whenDelete_thenDeleteSuccessfully() {
        // Arrange
        when(catalogServiceRepository.existsById(1L)).thenReturn(true);

        // Act
        catalogServiceService.delete(1L);

        // Assert
        verify(catalogServiceRepository).deleteById(1L);
    }

    @Test
    void givenNonExistingId_whenDelete_thenThrowResourceNotFoundException() {
        // Arrange
        when(catalogServiceRepository.existsById(99L)).thenReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> catalogServiceService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private CatalogService buildEntity(Long id, String name) {
        CatalogService entity = CatalogService.builder()
                .name(name)
                .description("Test description")
                .price(new BigDecimal("50.00"))
                .build();
        if (id != null) entity.setId(id);
        return entity;
    }

    private CatalogServiceResponse buildResponse(Long id, String name) {
        return new CatalogServiceResponse(id, name, "Test description", new BigDecimal("50.00"),
                LocalDateTime.now(), LocalDateTime.now());
    }
}
