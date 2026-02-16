package com.autotech.catalog.dto;

import com.autotech.catalog.model.CannedJob;
import com.autotech.catalog.model.CannedJobProduct;
import com.autotech.catalog.model.CannedJobService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class CannedJobMapperTest {

    private final CannedJobMapper mapper = new CannedJobMapper();

    @Test
    void givenEntity_whenToResponse_thenMapsAllFields() {
        // Arrange
        CannedJob entity = CannedJob.builder()
                .title("Full Service")
                .description("Complete vehicle service")
                .build();
        entity.setId(1L);
        entity.setCreatedAt(LocalDateTime.of(2025, 1, 1, 10, 0));
        entity.setUpdatedAt(LocalDateTime.of(2025, 1, 1, 10, 0));

        // Act
        CannedJobResponse response = mapper.toResponse(entity);

        // Assert
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.title()).isEqualTo("Full Service");
        assertThat(response.description()).isEqualTo("Complete vehicle service");
        assertThat(response.createdAt()).isNotNull();
    }

    @Test
    void givenEntityWithChildren_whenToDetailResponse_thenMapsWithChildren() {
        // Arrange
        CannedJob entity = CannedJob.builder()
                .title("Full Service")
                .description("Complete vehicle service")
                .build();
        entity.setId(1L);
        entity.setCreatedAt(LocalDateTime.of(2025, 1, 1, 10, 0));
        entity.setUpdatedAt(LocalDateTime.of(2025, 1, 1, 10, 0));

        CannedJobService svc = CannedJobService.builder()
                .cannedJob(entity)
                .serviceName("Oil Change")
                .price(new BigDecimal("50.00"))
                .build();
        svc.setId(10L);
        entity.getServices().add(svc);

        CannedJobProduct prod = CannedJobProduct.builder()
                .cannedJob(entity)
                .productName("Oil Filter")
                .quantity(1)
                .unitPrice(new BigDecimal("15.00"))
                .build();
        prod.setId(20L);
        entity.getProducts().add(prod);

        // Act
        CannedJobDetailResponse response = mapper.toDetailResponse(entity);

        // Assert
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.services()).hasSize(1);
        assertThat(response.services().getFirst().serviceName()).isEqualTo("Oil Change");
        assertThat(response.products()).hasSize(1);
        assertThat(response.products().getFirst().productName()).isEqualTo("Oil Filter");
    }

    @Test
    void givenRequest_whenToEntity_thenIgnoresChildCollections() {
        // Arrange
        CannedJobRequest request = new CannedJobRequest("Full Service", "Desc",
                java.util.List.of(new CannedJobServiceRequest("Oil Change", new BigDecimal("50.00"))),
                java.util.List.of(new CannedJobProductRequest("Oil Filter", 1, new BigDecimal("15.00"))));

        // Act
        CannedJob entity = mapper.toEntity(request);

        // Assert
        assertThat(entity.getTitle()).isEqualTo("Full Service");
        assertThat(entity.getDescription()).isEqualTo("Desc");
        assertThat(entity.getServices()).isEmpty();
        assertThat(entity.getProducts()).isEmpty();
    }
}
