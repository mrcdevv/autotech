package com.autotech.invoice.service;

import com.autotech.client.model.Client;
import com.autotech.client.model.ClientType;
import com.autotech.client.repository.ClientRepository;
import com.autotech.common.exception.BusinessException;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.estimate.dto.EstimateInvoiceDataResponse;
import com.autotech.estimate.dto.EstimateProductResponse;
import com.autotech.estimate.dto.EstimateServiceItemResponse;
import com.autotech.estimate.service.EstimateService;
import com.autotech.invoice.dto.InvoiceDetailResponse;
import com.autotech.invoice.dto.InvoiceMapper;
import com.autotech.invoice.dto.InvoiceProductRequest;
import com.autotech.invoice.dto.InvoiceRequest;
import com.autotech.invoice.dto.InvoiceResponse;
import com.autotech.invoice.dto.InvoiceServiceItemRequest;
import com.autotech.invoice.model.Invoice;
import com.autotech.invoice.model.InvoiceStatus;
import com.autotech.invoice.repository.InvoiceRepository;
import com.autotech.repairorder.model.RepairOrder;
import com.autotech.repairorder.model.RepairOrderStatus;
import com.autotech.repairorder.repository.RepairOrderRepository;
import com.autotech.vehicle.model.Vehicle;
import com.autotech.vehicle.repository.VehicleRepository;
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
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceImplTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private InvoiceMapper invoiceMapper;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private RepairOrderRepository repairOrderRepository;

    @Mock
    private EstimateService estimateService;

    @InjectMocks
    private InvoiceServiceImpl invoiceService;

    @Test
    void givenInvoicesExist_whenGetAll_thenReturnPage() {
        Pageable pageable = PageRequest.of(0, 12);
        Invoice invoice = buildInvoice(1L);
        InvoiceResponse response = buildInvoiceResponse(1L);
        Page<Invoice> page = new PageImpl<>(List.of(invoice), pageable, 1);
        when(invoiceRepository.findAll(pageable)).thenReturn(page);
        when(invoiceMapper.toResponse(invoice)).thenReturn(response);

        Page<InvoiceResponse> result = invoiceService.getAll(pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).id()).isEqualTo(1L);
    }

    @Test
    void givenFilters_whenSearch_thenReturnFilteredPage() {
        Pageable pageable = PageRequest.of(0, 12);
        Invoice invoice = buildInvoice(1L);
        InvoiceResponse response = buildInvoiceResponse(1L);
        Page<Invoice> page = new PageImpl<>(List.of(invoice), pageable, 1);
        when(invoiceRepository.search("Juan", null, null, pageable)).thenReturn(page);
        when(invoiceMapper.toResponse(invoice)).thenReturn(response);

        Page<InvoiceResponse> result = invoiceService.search("Juan", null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void givenFilterByPlate_whenSearch_thenReturnFilteredPage() {
        Pageable pageable = PageRequest.of(0, 12);
        Invoice invoice = buildInvoice(1L);
        InvoiceResponse response = buildInvoiceResponse(1L);
        Page<Invoice> page = new PageImpl<>(List.of(invoice), pageable, 1);
        when(invoiceRepository.search(null, "ABC", null, pageable)).thenReturn(page);
        when(invoiceMapper.toResponse(invoice)).thenReturn(response);

        Page<InvoiceResponse> result = invoiceService.search(null, "ABC", null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void givenFilterByStatus_whenSearch_thenReturnFilteredPage() {
        Pageable pageable = PageRequest.of(0, 12);
        Invoice invoice = buildInvoice(1L);
        InvoiceResponse response = buildInvoiceResponse(1L);
        Page<Invoice> page = new PageImpl<>(List.of(invoice), pageable, 1);
        when(invoiceRepository.search(null, null, InvoiceStatus.PENDIENTE, pageable)).thenReturn(page);
        when(invoiceMapper.toResponse(invoice)).thenReturn(response);

        Page<InvoiceResponse> result = invoiceService.search(null, null, InvoiceStatus.PENDIENTE, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void givenValidId_whenGetById_thenReturnDetailResponse() {
        Invoice invoice = buildInvoice(1L);
        InvoiceDetailResponse detailResponse = buildDetailResponse(1L);
        when(invoiceRepository.findWithDetailsById(1L)).thenReturn(Optional.of(invoice));
        when(invoiceMapper.toDetailResponse(invoice)).thenReturn(detailResponse);

        InvoiceDetailResponse result = invoiceService.getById(1L);

        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void givenNonExistentId_whenGetById_thenThrowResourceNotFoundException() {
        when(invoiceRepository.findWithDetailsById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> invoiceService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenValidRepairOrderId_whenGetByRepairOrderId_thenReturnDetailResponse() {
        Invoice invoice = buildInvoice(1L);
        InvoiceDetailResponse detailResponse = buildDetailResponse(1L);
        when(invoiceRepository.findByRepairOrderId(10L)).thenReturn(Optional.of(invoice));
        when(invoiceRepository.findWithDetailsById(1L)).thenReturn(Optional.of(invoice));
        when(invoiceMapper.toDetailResponse(invoice)).thenReturn(detailResponse);

        InvoiceDetailResponse result = invoiceService.getByRepairOrderId(10L);

        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void givenNoInvoiceForRepairOrder_whenGetByRepairOrderId_thenThrowResourceNotFoundException() {
        when(invoiceRepository.findByRepairOrderId(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> invoiceService.getByRepairOrderId(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenValidRequest_whenCreate_thenReturnDetailResponse() {
        Client client = buildClient(1L, ClientType.PERSONAL);
        Vehicle vehicle = buildVehicle(2L, client);
        InvoiceRequest request = new InvoiceRequest(1L, 2L, null, null,
                BigDecimal.ZERO, BigDecimal.ZERO,
                List.of(new InvoiceServiceItemRequest("Service A", BigDecimal.valueOf(100))),
                List.of(new InvoiceProductRequest("Product A", 2, BigDecimal.valueOf(50))));

        Invoice mappedEntity = Invoice.builder()
                .discountPercentage(BigDecimal.ZERO)
                .taxPercentage(BigDecimal.ZERO)
                .build();
        Invoice savedEntity = buildInvoice(1L);
        InvoiceDetailResponse detailResponse = buildDetailResponse(1L);

        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(vehicleRepository.findById(2L)).thenReturn(Optional.of(vehicle));
        when(invoiceMapper.toEntity(request)).thenReturn(mappedEntity);
        when(invoiceRepository.save(any(Invoice.class))).thenReturn(savedEntity);
        when(invoiceRepository.findWithDetailsById(1L)).thenReturn(Optional.of(savedEntity));
        when(invoiceMapper.toDetailResponse(savedEntity)).thenReturn(detailResponse);

        InvoiceDetailResponse result = invoiceService.create(request);

        assertThat(result.id()).isEqualTo(1L);
        verify(invoiceRepository).save(any(Invoice.class));
    }

    @Test
    void givenClientNotFound_whenCreate_thenThrowResourceNotFoundException() {
        InvoiceRequest request = new InvoiceRequest(99L, null, null, null,
                BigDecimal.ZERO, BigDecimal.ZERO, Collections.emptyList(), Collections.emptyList());
        when(clientRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> invoiceService.create(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenTemporalClientWithServices_whenCreate_thenThrowBusinessException() {
        Client client = buildClient(1L, ClientType.TEMPORAL);
        InvoiceRequest request = new InvoiceRequest(1L, null, null, null,
                BigDecimal.ZERO, BigDecimal.ZERO,
                List.of(new InvoiceServiceItemRequest("Service A", BigDecimal.valueOf(100))),
                Collections.emptyList());
        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));

        assertThatThrownBy(() -> invoiceService.create(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("temporales");
    }

    @Test
    void givenTemporalClientWithProductsOnly_whenCreate_thenSuccess() {
        Client client = buildClient(1L, ClientType.TEMPORAL);
        InvoiceRequest request = new InvoiceRequest(1L, null, null, null,
                BigDecimal.ZERO, BigDecimal.ZERO,
                Collections.emptyList(),
                List.of(new InvoiceProductRequest("Product A", 2, BigDecimal.valueOf(50))));

        Invoice mappedEntity = Invoice.builder()
                .discountPercentage(BigDecimal.ZERO)
                .taxPercentage(BigDecimal.ZERO)
                .build();
        Invoice savedEntity = buildInvoice(1L);
        InvoiceDetailResponse detailResponse = buildDetailResponse(1L);

        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(invoiceMapper.toEntity(request)).thenReturn(mappedEntity);
        when(invoiceRepository.save(any(Invoice.class))).thenReturn(savedEntity);
        when(invoiceRepository.findWithDetailsById(1L)).thenReturn(Optional.of(savedEntity));
        when(invoiceMapper.toDetailResponse(savedEntity)).thenReturn(detailResponse);

        InvoiceDetailResponse result = invoiceService.create(request);

        assertThat(result).isNotNull();
    }

    @Test
    void givenTemporalClientWithNullVehicle_whenCreate_thenSuccess() {
        Client client = buildClient(1L, ClientType.TEMPORAL);
        InvoiceRequest request = new InvoiceRequest(1L, null, null, null,
                BigDecimal.ZERO, BigDecimal.ZERO,
                null,
                List.of(new InvoiceProductRequest("Product A", 1, BigDecimal.valueOf(100))));

        Invoice mappedEntity = Invoice.builder()
                .discountPercentage(BigDecimal.ZERO)
                .taxPercentage(BigDecimal.ZERO)
                .build();
        Invoice savedEntity = buildInvoice(1L);
        InvoiceDetailResponse detailResponse = buildDetailResponse(1L);

        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(invoiceMapper.toEntity(request)).thenReturn(mappedEntity);
        when(invoiceRepository.save(any(Invoice.class))).thenReturn(savedEntity);
        when(invoiceRepository.findWithDetailsById(1L)).thenReturn(Optional.of(savedEntity));
        when(invoiceMapper.toDetailResponse(savedEntity)).thenReturn(detailResponse);

        InvoiceDetailResponse result = invoiceService.create(request);

        assertThat(result).isNotNull();
    }

    @Test
    void givenRequestWithEstimateId_whenCreate_thenLinksEstimate() {
        Client client = buildClient(1L, ClientType.PERSONAL);
        Vehicle vehicle = buildVehicle(2L, client);
        InvoiceRequest request = new InvoiceRequest(1L, 2L, null, 5L,
                BigDecimal.ZERO, BigDecimal.ZERO, Collections.emptyList(), Collections.emptyList());

        Invoice mappedEntity = Invoice.builder()
                .discountPercentage(BigDecimal.ZERO)
                .taxPercentage(BigDecimal.ZERO)
                .build();
        Invoice savedEntity = buildInvoice(1L);
        InvoiceDetailResponse detailResponse = buildDetailResponse(1L);

        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(vehicleRepository.findById(2L)).thenReturn(Optional.of(vehicle));
        when(estimateService.getById(5L)).thenReturn(new com.autotech.estimate.dto.EstimateDetailResponse(
                5L, 1L, "Juan Perez", null, null, null,
                2L, "ABC123", null, "Corolla", 2020, null,
                null, Collections.emptyList(), com.autotech.estimate.model.EstimateStatus.ACEPTADO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                Collections.emptyList(), Collections.emptyList(),
                LocalDateTime.now(), LocalDateTime.now()));
        when(invoiceMapper.toEntity(request)).thenReturn(mappedEntity);
        when(invoiceRepository.save(any(Invoice.class))).thenReturn(savedEntity);
        when(invoiceRepository.findWithDetailsById(1L)).thenReturn(Optional.of(savedEntity));
        when(invoiceMapper.toDetailResponse(savedEntity)).thenReturn(detailResponse);

        InvoiceDetailResponse result = invoiceService.create(request);

        assertThat(result).isNotNull();
        verify(estimateService).getById(5L);
    }

    @Test
    void givenAcceptedEstimate_whenCreateFromEstimate_thenReturnDetailResponse() {
        Client client = buildClient(1L, ClientType.PERSONAL);
        Vehicle vehicle = buildVehicle(2L, client);

        EstimateInvoiceDataResponse estimateData = new EstimateInvoiceDataResponse(
                5L, 1L, 2L, null,
                List.of(new EstimateServiceItemResponse(1L, "Service A", BigDecimal.valueOf(100))),
                List.of(new EstimateProductResponse(1L, "Product A", 2, BigDecimal.valueOf(50), BigDecimal.valueOf(100))),
                BigDecimal.valueOf(10), BigDecimal.valueOf(21), BigDecimal.valueOf(300));

        Invoice mappedEntity = Invoice.builder()
                .discountPercentage(BigDecimal.valueOf(10))
                .taxPercentage(BigDecimal.valueOf(21))
                .build();
        Invoice savedEntity = buildInvoice(1L);
        InvoiceDetailResponse detailResponse = buildDetailResponse(1L);

        when(estimateService.convertToInvoiceData(5L)).thenReturn(estimateData);
        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(vehicleRepository.findById(2L)).thenReturn(Optional.of(vehicle));
        when(estimateService.getById(5L)).thenReturn(new com.autotech.estimate.dto.EstimateDetailResponse(
                5L, 1L, "Juan Perez", null, null, null,
                2L, "ABC123", null, "Corolla", 2020, null,
                null, Collections.emptyList(), com.autotech.estimate.model.EstimateStatus.ACEPTADO,
                BigDecimal.valueOf(10), BigDecimal.valueOf(21), BigDecimal.valueOf(300),
                Collections.emptyList(), Collections.emptyList(),
                LocalDateTime.now(), LocalDateTime.now()));
        when(invoiceMapper.toEntity(any(InvoiceRequest.class))).thenReturn(mappedEntity);
        when(invoiceRepository.save(any(Invoice.class))).thenReturn(savedEntity);
        when(invoiceRepository.findWithDetailsById(1L)).thenReturn(Optional.of(savedEntity));
        when(invoiceMapper.toDetailResponse(savedEntity)).thenReturn(detailResponse);

        InvoiceDetailResponse result = invoiceService.createFromEstimate(5L);

        assertThat(result).isNotNull();
        verify(estimateService).convertToInvoiceData(5L);
    }

    @Test
    void givenNonAcceptedEstimate_whenCreateFromEstimate_thenThrowBusinessException() {
        when(estimateService.convertToInvoiceData(5L))
                .thenThrow(new BusinessException("Solo se pueden facturar presupuestos en estado ACEPTADO"));

        assertThatThrownBy(() -> invoiceService.createFromEstimate(5L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ACEPTADO");
    }

    @Test
    void givenStandaloneInvoice_whenDelete_thenDeletesSuccessfully() {
        Invoice invoice = buildInvoice(1L);
        invoice.setRepairOrder(null);
        invoice.setStatus(InvoiceStatus.PENDIENTE);
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));

        invoiceService.delete(1L);

        verify(invoiceRepository).deleteById(1L);
    }

    @Test
    void givenRepairOrderInvoice_whenDelete_thenThrowBusinessException() {
        Invoice invoice = buildInvoice(1L);
        RepairOrder repairOrder = buildRepairOrder(10L);
        invoice.setRepairOrder(repairOrder);
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));

        assertThatThrownBy(() -> invoiceService.delete(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("orden de trabajo");
    }

    @Test
    void givenPaidInvoice_whenDelete_thenThrowBusinessException() {
        Invoice invoice = buildInvoice(1L);
        invoice.setRepairOrder(null);
        invoice.setStatus(InvoiceStatus.PAGADA);
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));

        assertThatThrownBy(() -> invoiceService.delete(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("pagada");
    }

    @Test
    void givenNonExistentId_whenDelete_thenThrowResourceNotFoundException() {
        when(invoiceRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> invoiceService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenServicesAndProducts_whenCalculateTotal_thenReturnCorrectTotal() {
        List<InvoiceServiceItemRequest> services = List.of(
                new InvoiceServiceItemRequest("Service A", BigDecimal.valueOf(100)),
                new InvoiceServiceItemRequest("Service B", BigDecimal.valueOf(200)));
        List<InvoiceProductRequest> products = List.of(
                new InvoiceProductRequest("Product A", 2, BigDecimal.valueOf(50)));

        BigDecimal total = invoiceService.calculateTotal(services, products, BigDecimal.ZERO, BigDecimal.ZERO);

        assertThat(total).isEqualByComparingTo(BigDecimal.valueOf(400));
    }

    @Test
    void givenZeroDiscountAndTax_whenCalculateTotal_thenReturnSubtotal() {
        List<InvoiceServiceItemRequest> services = List.of(
                new InvoiceServiceItemRequest("Service A", BigDecimal.valueOf(200)));

        BigDecimal total = invoiceService.calculateTotal(services, Collections.emptyList(),
                BigDecimal.ZERO, BigDecimal.ZERO);

        assertThat(total).isEqualByComparingTo(BigDecimal.valueOf(200));
    }

    @Test
    void givenEmptyServices_whenCalculateTotal_thenReturnProductsTotal() {
        List<InvoiceProductRequest> products = List.of(
                new InvoiceProductRequest("Product A", 3, BigDecimal.valueOf(100)));

        BigDecimal total = invoiceService.calculateTotal(Collections.emptyList(), products,
                BigDecimal.ZERO, BigDecimal.ZERO);

        assertThat(total).isEqualByComparingTo(BigDecimal.valueOf(300));
    }

    @Test
    void givenEmptyProducts_whenCalculateTotal_thenReturnServicesTotal() {
        List<InvoiceServiceItemRequest> services = List.of(
                new InvoiceServiceItemRequest("Service A", BigDecimal.valueOf(150)));

        BigDecimal total = invoiceService.calculateTotal(services, Collections.emptyList(),
                BigDecimal.ZERO, BigDecimal.ZERO);

        assertThat(total).isEqualByComparingTo(BigDecimal.valueOf(150));
    }

    @Test
    void givenDiscountAndTax_whenCalculateTotal_thenAppliesBoth() {
        List<InvoiceServiceItemRequest> services = List.of(
                new InvoiceServiceItemRequest("Service A", BigDecimal.valueOf(1000)));

        BigDecimal total = invoiceService.calculateTotal(services, Collections.emptyList(),
                BigDecimal.valueOf(10), BigDecimal.valueOf(21));

        // subtotal=1000, discount=100, after=900, tax=189, total=1089
        assertThat(total).isEqualByComparingTo(BigDecimal.valueOf(1089));
    }

    @Test
    void givenExistingInvoice_whenMarkAsPaid_thenStatusIsPagada() {
        Invoice invoice = buildInvoice(1L);
        invoice.setStatus(InvoiceStatus.PENDIENTE);
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        when(invoiceRepository.save(invoice)).thenReturn(invoice);

        invoiceService.markAsPaid(1L);

        assertThat(invoice.getStatus()).isEqualTo(InvoiceStatus.PAGADA);
        verify(invoiceRepository).save(invoice);
    }

    @Test
    void givenNonExistentId_whenMarkAsPaid_thenThrowResourceNotFoundException() {
        when(invoiceRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> invoiceService.markAsPaid(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // --- Builder helpers ---

    private Client buildClient(Long id, ClientType clientType) {
        Client client = Client.builder()
                .firstName("Juan")
                .lastName("Perez")
                .phone("1234567890")
                .clientType(clientType)
                .build();
        client.setId(id);
        return client;
    }

    private Vehicle buildVehicle(Long id, Client client) {
        Vehicle vehicle = Vehicle.builder()
                .client(client)
                .plate("ABC123")
                .model("Corolla")
                .year(2020)
                .build();
        vehicle.setId(id);
        return vehicle;
    }

    private RepairOrder buildRepairOrder(Long id) {
        RepairOrder order = RepairOrder.builder()
                .title("Test Order")
                .status(RepairOrderStatus.INGRESO_VEHICULO)
                .build();
        order.setId(id);
        return order;
    }

    private Invoice buildInvoice(Long id) {
        Client client = buildClient(1L, ClientType.PERSONAL);
        Vehicle vehicle = buildVehicle(2L, client);
        Invoice invoice = Invoice.builder()
                .client(client)
                .vehicle(vehicle)
                .status(InvoiceStatus.PENDIENTE)
                .discountPercentage(BigDecimal.ZERO)
                .taxPercentage(BigDecimal.ZERO)
                .total(BigDecimal.valueOf(400))
                .build();
        invoice.setId(id);
        invoice.setCreatedAt(LocalDateTime.now());
        invoice.setUpdatedAt(LocalDateTime.now());
        return invoice;
    }

    private InvoiceResponse buildInvoiceResponse(Long id) {
        return new InvoiceResponse(
                id, 1L, "Juan Perez", 2L, "ABC123", "Corolla", null, null,
                InvoiceStatus.PENDIENTE, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.valueOf(400), LocalDateTime.now(), LocalDateTime.now());
    }

    private InvoiceDetailResponse buildDetailResponse(Long id) {
        return new InvoiceDetailResponse(
                id, 1L, "Juan Perez", "12345678", "1234567890", null, "PERSONAL",
                2L, "ABC123", null, "Corolla", 2020, null, null,
                InvoiceStatus.PENDIENTE, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.valueOf(400), Collections.emptyList(), Collections.emptyList(),
                LocalDateTime.now(), LocalDateTime.now());
    }
}
