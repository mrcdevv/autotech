package com.autotech.catalog.service;

import com.autotech.catalog.dto.CannedJobDetailResponse;
import com.autotech.catalog.dto.CannedJobMapper;
import com.autotech.catalog.dto.CannedJobProductRequest;
import com.autotech.catalog.dto.CannedJobProductResponse;
import com.autotech.catalog.dto.CannedJobRequest;
import com.autotech.catalog.dto.CannedJobResponse;
import com.autotech.catalog.dto.CannedJobServiceRequest;
import com.autotech.catalog.dto.CannedJobServiceResponse;
import com.autotech.catalog.model.CannedJob;
import com.autotech.catalog.repository.CannedJobRepository;
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
class CannedJobServiceImplTest {

    @Mock
    private CannedJobRepository cannedJobRepository;

    @Mock
    private CannedJobMapper cannedJobMapper;

    @InjectMocks
    private CannedJobServiceImpl cannedJobService;

    private final Pageable pageable = PageRequest.of(0, 12);

    @Test
    void givenQuery_whenSearch_thenReturnFilteredPage() {
        // Arrange
        CannedJob entity = buildEntity(1L, "Full Service");
        CannedJobResponse response = buildResponse(1L, "Full Service");
        Page<CannedJob> entityPage = new PageImpl<>(List.of(entity));

        when(cannedJobRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
                eq("full"), eq("full"), eq(pageable))).thenReturn(entityPage);
        when(cannedJobMapper.toResponse(entity)).thenReturn(response);

        // Act
        Page<CannedJobResponse> result = cannedJobService.search("full", pageable);

        // Assert
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().title()).isEqualTo("Full Service");
    }

    @Test
    void givenBlankQuery_whenSearch_thenReturnAll() {
        // Arrange
        CannedJob entity = buildEntity(1L, "Full Service");
        CannedJobResponse response = buildResponse(1L, "Full Service");
        Page<CannedJob> entityPage = new PageImpl<>(List.of(entity));

        when(cannedJobRepository.findAll(pageable)).thenReturn(entityPage);
        when(cannedJobMapper.toResponse(entity)).thenReturn(response);

        // Act
        Page<CannedJobResponse> result = cannedJobService.search(null, pageable);

        // Assert
        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void givenExistingId_whenGetById_thenReturnDetailResponse() {
        // Arrange
        CannedJob entity = buildEntity(1L, "Full Service");
        CannedJobDetailResponse response = buildDetailResponse(1L, "Full Service");

        when(cannedJobRepository.findWithDetailsById(1L)).thenReturn(Optional.of(entity));
        when(cannedJobMapper.toDetailResponse(entity)).thenReturn(response);

        // Act
        CannedJobDetailResponse result = cannedJobService.getById(1L);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.title()).isEqualTo("Full Service");
    }

    @Test
    void givenNonExistingId_whenGetById_thenThrowResourceNotFoundException() {
        // Arrange
        when(cannedJobRepository.findWithDetailsById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> cannedJobService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenValidRequest_whenCreate_thenReturnDetailResponse() {
        // Arrange
        CannedJobRequest request = new CannedJobRequest("Full Service", "Complete service", List.of(), List.of());
        CannedJob entity = buildEntity(null, "Full Service");
        CannedJob saved = buildEntity(1L, "Full Service");
        CannedJobDetailResponse response = buildDetailResponse(1L, "Full Service");

        when(cannedJobMapper.toEntity(request)).thenReturn(entity);
        when(cannedJobRepository.save(entity)).thenReturn(saved);
        when(cannedJobMapper.toDetailResponse(saved)).thenReturn(response);

        // Act
        CannedJobDetailResponse result = cannedJobService.create(request);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void givenRequestWithChildren_whenCreate_thenSavesChildren() {
        // Arrange
        List<CannedJobServiceRequest> svcRequests = List.of(
                new CannedJobServiceRequest("Oil Change", new BigDecimal("50.00"))
        );
        List<CannedJobProductRequest> prodRequests = List.of(
                new CannedJobProductRequest("Oil Filter", 1, new BigDecimal("15.00"))
        );
        CannedJobRequest request = new CannedJobRequest("Full Service", "Complete", svcRequests, prodRequests);
        CannedJob entity = buildEntity(null, "Full Service");
        CannedJob saved = buildEntity(1L, "Full Service");
        CannedJobDetailResponse response = buildDetailResponse(1L, "Full Service");

        when(cannedJobMapper.toEntity(request)).thenReturn(entity);
        when(cannedJobRepository.save(entity)).thenReturn(saved);
        when(cannedJobMapper.toDetailResponse(saved)).thenReturn(response);

        // Act
        CannedJobDetailResponse result = cannedJobService.create(request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(entity.getServices()).hasSize(1);
        assertThat(entity.getProducts()).hasSize(1);
    }

    @Test
    void givenExistingId_whenUpdate_thenReplacesChildren() {
        // Arrange
        CannedJob entity = buildEntity(1L, "Old Title");
        entity.setServices(new java.util.LinkedHashSet<>());
        entity.setProducts(new java.util.LinkedHashSet<>());

        List<CannedJobServiceRequest> svcRequests = List.of(
                new CannedJobServiceRequest("New Service", new BigDecimal("100.00"))
        );
        CannedJobRequest request = new CannedJobRequest("New Title", "New desc", svcRequests, List.of());
        CannedJob saved = buildEntity(1L, "New Title");
        CannedJobDetailResponse response = buildDetailResponse(1L, "New Title");

        when(cannedJobRepository.findWithDetailsById(1L)).thenReturn(Optional.of(entity));
        when(cannedJobRepository.save(entity)).thenReturn(saved);
        when(cannedJobMapper.toDetailResponse(saved)).thenReturn(response);

        // Act
        CannedJobDetailResponse result = cannedJobService.update(1L, request);

        // Assert
        assertThat(result.title()).isEqualTo("New Title");
        assertThat(entity.getTitle()).isEqualTo("New Title");
        assertThat(entity.getServices()).hasSize(1);
    }

    @Test
    void givenNonExistingId_whenUpdate_thenThrowResourceNotFoundException() {
        // Arrange
        CannedJobRequest request = new CannedJobRequest("X", null, List.of(), List.of());
        when(cannedJobRepository.findWithDetailsById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> cannedJobService.update(99L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenExistingId_whenDelete_thenDeleteSuccessfully() {
        // Arrange
        when(cannedJobRepository.existsById(1L)).thenReturn(true);

        // Act
        cannedJobService.delete(1L);

        // Assert
        verify(cannedJobRepository).deleteById(1L);
    }

    @Test
    void givenNonExistingId_whenDelete_thenThrowResourceNotFoundException() {
        // Arrange
        when(cannedJobRepository.existsById(99L)).thenReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> cannedJobService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private CannedJob buildEntity(Long id, String title) {
        CannedJob entity = CannedJob.builder()
                .title(title)
                .description("Test description")
                .build();
        if (id != null) entity.setId(id);
        return entity;
    }

    private CannedJobResponse buildResponse(Long id, String title) {
        return new CannedJobResponse(id, title, "Test description",
                LocalDateTime.now(), LocalDateTime.now());
    }

    private CannedJobDetailResponse buildDetailResponse(Long id, String title) {
        return new CannedJobDetailResponse(id, title, "Test description",
                List.of(new CannedJobServiceResponse(1L, "Oil Change", new BigDecimal("50.00"))),
                List.of(new CannedJobProductResponse(1L, "Oil Filter", 1, new BigDecimal("15.00"))),
                LocalDateTime.now(), LocalDateTime.now());
    }
}
