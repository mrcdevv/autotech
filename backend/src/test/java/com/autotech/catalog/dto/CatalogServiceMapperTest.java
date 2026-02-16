package com.autotech.catalog.dto;

import com.autotech.catalog.model.CatalogService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class CatalogServiceMapperTest {

    private final CatalogServiceMapper mapper = new CatalogServiceMapper();

    @Test
    void givenEntity_whenToResponse_thenMapsAllFields() {
        // Arrange
        CatalogService entity = CatalogService.builder()
                .name("Oil Change")
                .description("Full synthetic oil change")
                .price(new BigDecimal("50.00"))
                .build();
        entity.setId(1L);
        entity.setCreatedAt(LocalDateTime.of(2025, 1, 1, 10, 0));
        entity.setUpdatedAt(LocalDateTime.of(2025, 1, 1, 10, 0));

        // Act
        CatalogServiceResponse response = mapper.toResponse(entity);

        // Assert
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.name()).isEqualTo("Oil Change");
        assertThat(response.description()).isEqualTo("Full synthetic oil change");
        assertThat(response.price()).isEqualByComparingTo(new BigDecimal("50.00"));
        assertThat(response.createdAt()).isNotNull();
        assertThat(response.updatedAt()).isNotNull();
    }

    @Test
    void givenRequest_whenToEntity_thenMapsAllFields() {
        // Arrange
        CatalogServiceRequest request = new CatalogServiceRequest("Oil Change", "Full synthetic", new BigDecimal("50.00"));

        // Act
        CatalogService entity = mapper.toEntity(request);

        // Assert
        assertThat(entity.getName()).isEqualTo("Oil Change");
        assertThat(entity.getDescription()).isEqualTo("Full synthetic");
        assertThat(entity.getPrice()).isEqualByComparingTo(new BigDecimal("50.00"));
        assertThat(entity.getId()).isNull();
    }

    @Test
    void givenRequest_whenUpdateEntity_thenUpdatesAllFields() {
        // Arrange
        CatalogService entity = CatalogService.builder()
                .name("Old Name")
                .description("Old desc")
                .price(new BigDecimal("10.00"))
                .build();
        CatalogServiceRequest request = new CatalogServiceRequest("New Name", "New desc", new BigDecimal("99.00"));

        // Act
        mapper.updateEntity(request, entity);

        // Assert
        assertThat(entity.getName()).isEqualTo("New Name");
        assertThat(entity.getDescription()).isEqualTo("New desc");
        assertThat(entity.getPrice()).isEqualByComparingTo(new BigDecimal("99.00"));
    }
}
