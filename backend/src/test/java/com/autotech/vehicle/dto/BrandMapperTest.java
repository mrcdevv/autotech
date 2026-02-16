package com.autotech.vehicle.dto;

import com.autotech.vehicle.model.Brand;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class BrandMapperTest {

    private final BrandMapper mapper = new BrandMapper();

    @Test
    void givenBrand_whenToResponse_thenMapAllFields() {
        // Arrange
        Brand brand = Brand.builder().name("Toyota").build();
        brand.setId(1L);

        // Act
        BrandResponse response = mapper.toResponse(brand);

        // Assert
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.name()).isEqualTo("Toyota");
    }

    @Test
    void givenRequest_whenToEntity_thenMapName() {
        // Arrange
        BrandRequest request = new BrandRequest("Ford");

        // Act
        Brand entity = mapper.toEntity(request);

        // Assert
        assertThat(entity.getName()).isEqualTo("Ford");
        assertThat(entity.getId()).isNull();
    }

    @Test
    void givenNull_whenToResponse_thenReturnNull() {
        assertThat(mapper.toResponse(null)).isNull();
    }

    @Test
    void givenNull_whenToEntity_thenReturnNull() {
        assertThat(mapper.toEntity(null)).isNull();
    }
}
