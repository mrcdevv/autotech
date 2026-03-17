package com.autotech.invoice.dto;

import com.autotech.client.model.Client;
import com.autotech.client.model.ClientType;
import com.autotech.invoice.model.Invoice;
import com.autotech.invoice.model.InvoiceProduct;
import com.autotech.invoice.model.InvoiceServiceItem;
import com.autotech.invoice.model.InvoiceStatus;
import com.autotech.vehicle.model.Brand;
import com.autotech.vehicle.model.Vehicle;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class InvoiceMapperTest {

    private final InvoiceMapper mapper = new InvoiceMapper();

    @Test
    void givenInvoice_whenToResponse_thenMapsAllFields() {
        Invoice invoice = buildFullInvoice();

        InvoiceResponse result = mapper.toResponse(invoice);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.clientId()).isEqualTo(10L);
        assertThat(result.clientFullName()).isEqualTo("Juan Perez");
        assertThat(result.vehicleId()).isEqualTo(20L);
        assertThat(result.vehiclePlate()).isEqualTo("ABC123");
        assertThat(result.vehicleModel()).isEqualTo("Corolla");
        assertThat(result.repairOrderId()).isNull();
        assertThat(result.estimateId()).isNull();
        assertThat(result.status()).isEqualTo(InvoiceStatus.PENDIENTE);
        assertThat(result.discountPercentage()).isEqualByComparingTo(BigDecimal.valueOf(10));
        assertThat(result.taxPercentage()).isEqualByComparingTo(BigDecimal.valueOf(21));
        assertThat(result.total()).isEqualByComparingTo(BigDecimal.valueOf(500));
    }

    @Test
    void givenInvoice_whenToDetailResponse_thenMapsAllFields() {
        Invoice invoice = buildFullInvoice();

        InvoiceDetailResponse result = mapper.toDetailResponse(invoice);

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
    void givenInvoiceWithNullVehicle_whenToResponse_thenVehicleFieldsAreNull() {
        Invoice invoice = buildFullInvoice();
        invoice.setVehicle(null);

        InvoiceResponse result = mapper.toResponse(invoice);

        assertThat(result.vehicleId()).isNull();
        assertThat(result.vehiclePlate()).isNull();
        assertThat(result.vehicleModel()).isNull();
    }

    @Test
    void givenInvoiceServiceItem_whenToServiceItemResponse_thenMapsAllFields() {
        InvoiceServiceItem item = InvoiceServiceItem.builder()
                .serviceName("Oil change")
                .price(BigDecimal.valueOf(100))
                .build();
        item.setId(1L);

        InvoiceServiceItemResponse result = mapper.toServiceItemResponse(item);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.serviceName()).isEqualTo("Oil change");
        assertThat(result.price()).isEqualByComparingTo(BigDecimal.valueOf(100));
    }

    @Test
    void givenInvoiceProduct_whenToProductResponse_thenMapsAllFields() {
        InvoiceProduct product = InvoiceProduct.builder()
                .productName("Brake pad")
                .quantity(4)
                .unitPrice(BigDecimal.valueOf(25))
                .totalPrice(BigDecimal.valueOf(100))
                .build();
        product.setId(1L);

        InvoiceProductResponse result = mapper.toProductResponse(product);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.productName()).isEqualTo("Brake pad");
        assertThat(result.quantity()).isEqualTo(4);
        assertThat(result.unitPrice()).isEqualByComparingTo(BigDecimal.valueOf(25));
        assertThat(result.totalPrice()).isEqualByComparingTo(BigDecimal.valueOf(100));
    }

    @Test
    void givenInvoiceRequest_whenToEntity_thenIgnoresChildCollections() {
        InvoiceRequest request = new InvoiceRequest(
                10L, 20L, null, null, BigDecimal.valueOf(5), BigDecimal.valueOf(21),
                null, null);

        Invoice result = mapper.toEntity(request);

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

    private Invoice buildFullInvoice() {
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

        Invoice invoice = Invoice.builder()
                .client(client)
                .vehicle(vehicle)
                .status(InvoiceStatus.PENDIENTE)
                .discountPercentage(BigDecimal.valueOf(10))
                .taxPercentage(BigDecimal.valueOf(21))
                .total(BigDecimal.valueOf(500))
                .build();
        invoice.setId(1L);
        invoice.setCreatedAt(LocalDateTime.now());
        invoice.setUpdatedAt(LocalDateTime.now());

        InvoiceServiceItem serviceItem = InvoiceServiceItem.builder()
                .invoice(invoice)
                .serviceName("Oil change")
                .price(BigDecimal.valueOf(200))
                .build();
        serviceItem.setId(1L);

        InvoiceProduct product = InvoiceProduct.builder()
                .invoice(invoice)
                .productName("Brake pad")
                .quantity(4)
                .unitPrice(BigDecimal.valueOf(25))
                .totalPrice(BigDecimal.valueOf(100))
                .build();
        product.setId(1L);

        invoice.getServices().add(serviceItem);
        invoice.getProducts().add(product);

        return invoice;
    }
}
