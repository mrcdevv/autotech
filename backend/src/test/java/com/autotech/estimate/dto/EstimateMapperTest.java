package com.autotech.estimate.dto;

import com.autotech.client.model.Client;
import com.autotech.client.model.ClientType;
import com.autotech.estimate.model.Estimate;
import com.autotech.estimate.model.EstimateProduct;
import com.autotech.estimate.model.EstimateServiceItem;
import com.autotech.estimate.model.EstimateStatus;
import com.autotech.vehicle.model.Brand;
import com.autotech.vehicle.model.Vehicle;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class EstimateMapperTest {

    private final EstimateMapper mapper = new EstimateMapper();

    @Test
    void givenEstimate_whenToResponse_thenMapsAllFields() {
        // Arrange
        Estimate estimate = buildFullEstimate();

        // Act
        EstimateResponse result = mapper.toResponse(estimate);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.clientId()).isEqualTo(10L);
        assertThat(result.clientFullName()).isEqualTo("Juan Perez");
        assertThat(result.vehicleId()).isEqualTo(20L);
        assertThat(result.vehiclePlate()).isEqualTo("ABC123");
        assertThat(result.vehicleModel()).isEqualTo("Corolla");
        assertThat(result.repairOrderId()).isNull();
        assertThat(result.status()).isEqualTo(EstimateStatus.PENDIENTE);
        assertThat(result.discountPercentage()).isEqualByComparingTo(BigDecimal.valueOf(10));
        assertThat(result.taxPercentage()).isEqualByComparingTo(BigDecimal.valueOf(21));
        assertThat(result.total()).isEqualByComparingTo(BigDecimal.valueOf(500));
    }

    @Test
    void givenEstimate_whenToDetailResponse_thenMapsAllFieldsIncludingClientAndVehicle() {
        // Arrange
        Estimate estimate = buildFullEstimate();

        // Act
        EstimateDetailResponse result = mapper.toDetailResponse(estimate);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.clientId()).isEqualTo(10L);
        assertThat(result.clientFullName()).isEqualTo("Juan Perez");
        assertThat(result.clientDni()).isEqualTo("12345678");
        assertThat(result.clientPhone()).isEqualTo("1234567890");
        assertThat(result.vehiclePlate()).isEqualTo("ABC123");
        assertThat(result.vehicleBrand()).isEqualTo("Toyota");
        assertThat(result.vehicleModel()).isEqualTo("Corolla");
        assertThat(result.vehicleYear()).isEqualTo(2020);
        assertThat(result.services()).hasSize(1);
        assertThat(result.products()).hasSize(1);
    }

    @Test
    void givenEstimateServiceItem_whenToServiceItemResponse_thenMapsAllFields() {
        // Arrange
        EstimateServiceItem item = EstimateServiceItem.builder()
                .serviceName("Oil change")
                .price(BigDecimal.valueOf(100))
                .build();
        item.setId(1L);

        // Act
        EstimateServiceItemResponse result = mapper.toServiceItemResponse(item);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.serviceName()).isEqualTo("Oil change");
        assertThat(result.price()).isEqualByComparingTo(BigDecimal.valueOf(100));
    }

    @Test
    void givenEstimateProduct_whenToProductResponse_thenMapsAllFields() {
        // Arrange
        EstimateProduct product = EstimateProduct.builder()
                .productName("Brake pad")
                .quantity(4)
                .unitPrice(BigDecimal.valueOf(25))
                .totalPrice(BigDecimal.valueOf(100))
                .build();
        product.setId(1L);

        // Act
        EstimateProductResponse result = mapper.toProductResponse(product);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.productName()).isEqualTo("Brake pad");
        assertThat(result.quantity()).isEqualTo(4);
        assertThat(result.unitPrice()).isEqualByComparingTo(BigDecimal.valueOf(25));
        assertThat(result.totalPrice()).isEqualByComparingTo(BigDecimal.valueOf(100));
    }

    @Test
    void givenEstimateRequest_whenToEntity_thenIgnoresChildCollections() {
        // Arrange
        EstimateRequest request = new EstimateRequest(
                10L, 20L, null, BigDecimal.valueOf(5), BigDecimal.valueOf(21),
                null, null
        );

        // Act
        Estimate result = mapper.toEntity(request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getDiscountPercentage()).isEqualByComparingTo(BigDecimal.valueOf(5));
        assertThat(result.getTaxPercentage()).isEqualByComparingTo(BigDecimal.valueOf(21));
        assertThat(result.getServices()).isEmpty();
        assertThat(result.getProducts()).isEmpty();
        assertThat(result.getClient()).isNull();
        assertThat(result.getVehicle()).isNull();
    }

    @Test
    void givenEstimate_whenToInvoiceDataResponse_thenMapsAllFields() {
        // Arrange
        Estimate estimate = buildFullEstimate();

        // Act
        EstimateInvoiceDataResponse result = mapper.toInvoiceDataResponse(estimate);

        // Assert
        assertThat(result.estimateId()).isEqualTo(1L);
        assertThat(result.clientId()).isEqualTo(10L);
        assertThat(result.vehicleId()).isEqualTo(20L);
        assertThat(result.services()).hasSize(1);
        assertThat(result.products()).hasSize(1);
        assertThat(result.discountPercentage()).isEqualByComparingTo(BigDecimal.valueOf(10));
        assertThat(result.taxPercentage()).isEqualByComparingTo(BigDecimal.valueOf(21));
        assertThat(result.total()).isEqualByComparingTo(BigDecimal.valueOf(500));
    }

    @Test
    void givenNull_whenToResponse_thenReturnNull() {
        assertThat(mapper.toResponse(null)).isNull();
    }

    @Test
    void givenNull_whenToDetailResponse_thenReturnNull() {
        assertThat(mapper.toDetailResponse(null)).isNull();
    }

    @Test
    void givenNull_whenToEntity_thenReturnNull() {
        assertThat(mapper.toEntity(null)).isNull();
    }

    private Estimate buildFullEstimate() {
        Client client = Client.builder()
                .firstName("Juan")
                .lastName("Perez")
                .dni("12345678")
                .phone("1234567890")
                .email("juan@email.com")
                .clientType(ClientType.PERSONAL)
                .build();
        client.setId(10L);

        Brand brand = Brand.builder().name("Toyota").build();
        brand.setId(1L);

        Vehicle vehicle = Vehicle.builder()
                .client(client)
                .plate("ABC123")
                .brand(brand)
                .model("Corolla")
                .year(2020)
                .build();
        vehicle.setId(20L);

        Estimate estimate = Estimate.builder()
                .client(client)
                .vehicle(vehicle)
                .status(EstimateStatus.PENDIENTE)
                .discountPercentage(BigDecimal.valueOf(10))
                .taxPercentage(BigDecimal.valueOf(21))
                .total(BigDecimal.valueOf(500))
                .build();
        estimate.setId(1L);
        estimate.setCreatedAt(LocalDateTime.now());
        estimate.setUpdatedAt(LocalDateTime.now());

        EstimateServiceItem serviceItem = EstimateServiceItem.builder()
                .estimate(estimate)
                .serviceName("Oil change")
                .price(BigDecimal.valueOf(200))
                .build();
        serviceItem.setId(1L);

        EstimateProduct product = EstimateProduct.builder()
                .estimate(estimate)
                .productName("Brake pad")
                .quantity(4)
                .unitPrice(BigDecimal.valueOf(25))
                .totalPrice(BigDecimal.valueOf(100))
                .build();
        product.setId(1L);

        estimate.getServices().add(serviceItem);
        estimate.getProducts().add(product);

        return estimate;
    }
}
