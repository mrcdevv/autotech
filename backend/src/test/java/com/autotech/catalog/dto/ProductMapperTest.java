package com.autotech.catalog.dto;

import com.autotech.catalog.model.Product;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class ProductMapperTest {

    private final ProductMapper mapper = new ProductMapper();

    @Test
    void givenEntity_whenToResponse_thenMapsAllFields() {
        // Arrange
        Product entity = Product.builder()
                .name("Brake Pad")
                .description("Ceramic brake pad")
                .quantity(10)
                .unitPrice(new BigDecimal("25.00"))
                .build();
        entity.setId(1L);
        entity.setCreatedAt(LocalDateTime.of(2025, 1, 1, 10, 0));
        entity.setUpdatedAt(LocalDateTime.of(2025, 1, 1, 10, 0));

        // Act
        ProductResponse response = mapper.toResponse(entity);

        // Assert
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.name()).isEqualTo("Brake Pad");
        assertThat(response.description()).isEqualTo("Ceramic brake pad");
        assertThat(response.quantity()).isEqualTo(10);
        assertThat(response.unitPrice()).isEqualByComparingTo(new BigDecimal("25.00"));
    }

    @Test
    void givenRequest_whenToEntity_thenMapsAllFields() {
        // Arrange
        ProductRequest request = new ProductRequest("Brake Pad", "Ceramic", 10, new BigDecimal("25.00"));

        // Act
        Product entity = mapper.toEntity(request);

        // Assert
        assertThat(entity.getName()).isEqualTo("Brake Pad");
        assertThat(entity.getDescription()).isEqualTo("Ceramic");
        assertThat(entity.getQuantity()).isEqualTo(10);
        assertThat(entity.getUnitPrice()).isEqualByComparingTo(new BigDecimal("25.00"));
    }

    @Test
    void givenNullQuantity_whenToEntity_thenDefaultsToZero() {
        // Arrange
        ProductRequest request = new ProductRequest("Brake Pad", null, null, null);

        // Act
        Product entity = mapper.toEntity(request);

        // Assert
        assertThat(entity.getQuantity()).isEqualTo(0);
    }

    @Test
    void givenRequest_whenUpdateEntity_thenUpdatesAllFields() {
        // Arrange
        Product entity = Product.builder()
                .name("Old Name")
                .description("Old desc")
                .quantity(5)
                .unitPrice(new BigDecimal("10.00"))
                .build();
        ProductRequest request = new ProductRequest("New Name", "New desc", 20, new BigDecimal("99.00"));

        // Act
        mapper.updateEntity(request, entity);

        // Assert
        assertThat(entity.getName()).isEqualTo("New Name");
        assertThat(entity.getDescription()).isEqualTo("New desc");
        assertThat(entity.getQuantity()).isEqualTo(20);
        assertThat(entity.getUnitPrice()).isEqualByComparingTo(new BigDecimal("99.00"));
    }
}
