package com.autotech.deliverynote.dto;

import com.autotech.client.model.Client;
import com.autotech.client.model.ClientType;
import com.autotech.deliverynote.model.DeliveryNote;
import com.autotech.deliverynote.model.DeliveryNoteProduct;
import com.autotech.deliverynote.model.DeliveryNoteServiceItem;
import com.autotech.deliverynote.model.DeliveryNoteStatus;
import com.autotech.vehicle.model.Brand;
import com.autotech.vehicle.model.Vehicle;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class DeliveryNoteMapperTest {

    private final DeliveryNoteMapper mapper = new DeliveryNoteMapper();

    @Test
    void givenDeliveryNote_whenToResponse_thenMapsAllFields() {
        DeliveryNote deliveryNote = buildFullDeliveryNote();

        DeliveryNoteResponse result = mapper.toResponse(deliveryNote);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.clientId()).isEqualTo(10L);
        assertThat(result.clientFullName()).isEqualTo("Juan Perez");
        assertThat(result.vehicleId()).isEqualTo(20L);
        assertThat(result.vehiclePlate()).isEqualTo("ABC123");
        assertThat(result.vehicleModel()).isEqualTo("Corolla");
        assertThat(result.repairOrderId()).isNull();
        assertThat(result.estimateId()).isNull();
        assertThat(result.status()).isEqualTo(DeliveryNoteStatus.PENDIENTE);
        assertThat(result.discountPercentage()).isEqualByComparingTo(BigDecimal.valueOf(10));
        assertThat(result.taxPercentage()).isEqualByComparingTo(BigDecimal.valueOf(21));
        assertThat(result.total()).isEqualByComparingTo(BigDecimal.valueOf(500));
    }

    @Test
    void givenDeliveryNote_whenToDetailResponse_thenMapsAllFields() {
        DeliveryNote deliveryNote = buildFullDeliveryNote();

        DeliveryNoteDetailResponse result = mapper.toDetailResponse(deliveryNote);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.clientId()).isEqualTo(10L);
        assertThat(result.clientFullName()).isEqualTo("Juan Perez");
        assertThat(result.clientDni()).isEqualTo("12345678");
        assertThat(result.clientPhone()).isEqualTo("1234567890");
        assertThat(result.clientType()).isEqualTo("PERSONAL");
        assertThat(result.vehicleId()).isEqualTo(20L);
        assertThat(result.vehiclePlate()).isEqualTo("ABC123");
        assertThat(result.vehicleBrand()).isEqualTo("Toyota");
        assertThat(result.vehicleModel()).isEqualTo("Corolla");
        assertThat(result.vehicleYear()).isEqualTo(2020);
        assertThat(result.services()).hasSize(1);
        assertThat(result.products()).hasSize(1);
    }

    @Test
    void givenDeliveryNoteWithNullVehicle_whenToResponse_thenVehicleFieldsAreNull() {
        DeliveryNote deliveryNote = buildFullDeliveryNote();
        deliveryNote.setVehicle(null);

        DeliveryNoteResponse result = mapper.toResponse(deliveryNote);

        assertThat(result.vehicleId()).isNull();
        assertThat(result.vehiclePlate()).isNull();
        assertThat(result.vehicleModel()).isNull();
    }

    @Test
    void givenDeliveryNoteServiceItem_whenToServiceItemResponse_thenMapsAllFields() {
        DeliveryNoteServiceItem item = DeliveryNoteServiceItem.builder()
                .serviceName("Oil change")
                .price(BigDecimal.valueOf(100))
                .build();
        item.setId(1L);

        DeliveryNoteServiceItemResponse result = mapper.toServiceItemResponse(item);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.serviceName()).isEqualTo("Oil change");
        assertThat(result.price()).isEqualByComparingTo(BigDecimal.valueOf(100));
    }

    @Test
    void givenDeliveryNoteProduct_whenToProductResponse_thenMapsAllFields() {
        DeliveryNoteProduct product = DeliveryNoteProduct.builder()
                .productName("Brake pad")
                .quantity(4)
                .unitPrice(BigDecimal.valueOf(25))
                .totalPrice(BigDecimal.valueOf(100))
                .build();
        product.setId(1L);

        DeliveryNoteProductResponse result = mapper.toProductResponse(product);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.productName()).isEqualTo("Brake pad");
        assertThat(result.quantity()).isEqualTo(4);
        assertThat(result.unitPrice()).isEqualByComparingTo(BigDecimal.valueOf(25));
        assertThat(result.totalPrice()).isEqualByComparingTo(BigDecimal.valueOf(100));
    }

    @Test
    void givenDeliveryNoteRequest_whenToEntity_thenIgnoresChildCollections() {
        DeliveryNoteRequest request = new DeliveryNoteRequest(
                10L, 20L, null, null, BigDecimal.valueOf(5), BigDecimal.valueOf(21),
                null, null);

        DeliveryNote result = mapper.toEntity(request);

        assertThat(result).isNotNull();
        assertThat(result.getDiscountPercentage()).isEqualByComparingTo(BigDecimal.valueOf(5));
        assertThat(result.getTaxPercentage()).isEqualByComparingTo(BigDecimal.valueOf(21));
        assertThat(result.getServices()).isEmpty();
        assertThat(result.getProducts()).isEmpty();
        assertThat(result.getClient()).isNull();
        assertThat(result.getVehicle()).isNull();
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

    private DeliveryNote buildFullDeliveryNote() {
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

        DeliveryNote deliveryNote = DeliveryNote.builder()
                .client(client)
                .vehicle(vehicle)
                .status(DeliveryNoteStatus.PENDIENTE)
                .discountPercentage(BigDecimal.valueOf(10))
                .taxPercentage(BigDecimal.valueOf(21))
                .total(BigDecimal.valueOf(500))
                .build();
        deliveryNote.setId(1L);
        deliveryNote.setCreatedAt(LocalDateTime.now());
        deliveryNote.setUpdatedAt(LocalDateTime.now());

        DeliveryNoteServiceItem serviceItem = DeliveryNoteServiceItem.builder()
                .deliveryNote(deliveryNote)
                .serviceName("Oil change")
                .price(BigDecimal.valueOf(200))
                .build();
        serviceItem.setId(1L);

        DeliveryNoteProduct product = DeliveryNoteProduct.builder()
                .deliveryNote(deliveryNote)
                .productName("Brake pad")
                .quantity(4)
                .unitPrice(BigDecimal.valueOf(25))
                .totalPrice(BigDecimal.valueOf(100))
                .build();
        product.setId(1L);

        deliveryNote.getServices().add(serviceItem);
        deliveryNote.getProducts().add(product);

        return deliveryNote;
    }
}
