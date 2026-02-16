package com.autotech.vehicle.service;

import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.vehicle.dto.BrandMapper;
import com.autotech.vehicle.dto.BrandRequest;
import com.autotech.vehicle.dto.BrandResponse;
import com.autotech.vehicle.model.Brand;
import com.autotech.vehicle.repository.BrandRepository;
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
class BrandServiceImplTest {

    @Mock
    private BrandRepository brandRepository;

    @Mock
    private BrandMapper brandMapper;

    @InjectMocks
    private BrandServiceImpl brandService;

    @Test
    void givenValidRequest_whenCreate_thenReturnCreatedBrand() {
        // Arrange
        BrandRequest request = new BrandRequest("Toyota");
        Brand entity = Brand.builder().name("Toyota").build();
        Brand saved = Brand.builder().name("Toyota").build();
        saved.setId(1L);
        BrandResponse response = new BrandResponse(1L, "Toyota", LocalDateTime.now());

        when(brandRepository.existsByNameIgnoreCase("Toyota")).thenReturn(false);
        when(brandMapper.toEntity(request)).thenReturn(entity);
        when(brandRepository.save(entity)).thenReturn(saved);
        when(brandMapper.toResponse(saved)).thenReturn(response);

        // Act
        BrandResponse result = brandService.create(request);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("Toyota");
    }

    @Test
    void givenDuplicateName_whenCreate_thenThrowIllegalArgumentException() {
        // Arrange
        BrandRequest request = new BrandRequest("Toyota");
        when(brandRepository.existsByNameIgnoreCase("Toyota")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> brandService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("marca");
    }

    @Test
    void givenValidId_whenGetById_thenReturnBrandResponse() {
        // Arrange
        Brand entity = Brand.builder().name("Toyota").build();
        entity.setId(1L);
        BrandResponse response = new BrandResponse(1L, "Toyota", LocalDateTime.now());

        when(brandRepository.findById(1L)).thenReturn(Optional.of(entity));
        when(brandMapper.toResponse(entity)).thenReturn(response);

        // Act
        BrandResponse result = brandService.getById(1L);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void givenInvalidId_whenGetById_thenThrowResourceNotFoundException() {
        // Arrange
        when(brandRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> brandService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void whenGetAll_thenReturnAllBrands() {
        // Arrange
        Brand entity1 = Brand.builder().name("Toyota").build();
        entity1.setId(1L);
        Brand entity2 = Brand.builder().name("Ford").build();
        entity2.setId(2L);
        BrandResponse response1 = new BrandResponse(1L, "Toyota", LocalDateTime.now());
        BrandResponse response2 = new BrandResponse(2L, "Ford", LocalDateTime.now());

        when(brandRepository.findAll()).thenReturn(List.of(entity1, entity2));
        when(brandMapper.toResponse(entity1)).thenReturn(response1);
        when(brandMapper.toResponse(entity2)).thenReturn(response2);

        // Act
        List<BrandResponse> result = brandService.getAll();

        // Assert
        assertThat(result).hasSize(2);
    }

    @Test
    void givenValidId_whenDelete_thenDeleteSuccessfully() {
        // Arrange
        Brand entity = Brand.builder().name("Toyota").build();
        entity.setId(1L);
        when(brandRepository.findById(1L)).thenReturn(Optional.of(entity));

        // Act
        brandService.delete(1L);

        // Assert
        verify(brandRepository).delete(entity);
    }
}
