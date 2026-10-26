package com.autotech.deliverynote.service;

import com.autotech.stock.service.StockService;
import com.autotech.client.model.Client;
import com.autotech.client.model.ClientType;
import com.autotech.client.repository.ClientRepository;
import com.autotech.common.audit.AuditAction;
import com.autotech.common.audit.AuditEntityType;
import com.autotech.common.audit.AuditService;
import com.autotech.common.exception.BusinessException;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.email.service.EmailNotificationService;
import com.autotech.estimate.dto.EstimateDeliveryNoteDataResponse;
import com.autotech.estimate.dto.EstimateProductResponse;
import com.autotech.estimate.dto.EstimateServiceItemResponse;
import com.autotech.estimate.service.EstimateService;
import com.autotech.deliverynote.dto.DeliveryNoteDetailResponse;
import com.autotech.deliverynote.dto.DeliveryNoteMapper;
import com.autotech.deliverynote.dto.DeliveryNoteProductRequest;
import com.autotech.deliverynote.dto.DeliveryNoteRequest;
import com.autotech.deliverynote.dto.DeliveryNoteResponse;
import com.autotech.deliverynote.dto.DeliveryNoteServiceItemRequest;
import com.autotech.deliverynote.model.DeliveryNote;
import com.autotech.deliverynote.model.DeliveryNoteStatus;
import com.autotech.deliverynote.repository.DeliveryNoteRepository;
import com.autotech.payment.repository.PaymentRepository;
import com.autotech.repairorder.model.RepairOrder;
import com.autotech.repairorder.model.RepairOrderStatus;
import com.autotech.repairorder.repository.RepairOrderRepository;
import com.autotech.repairorder.service.RepairOrderService;
import com.autotech.tax.model.TaxConfig;
import com.autotech.tax.service.TaxConfigService;
import com.autotech.vehicle.model.Vehicle;
import com.autotech.vehicle.repository.VehicleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DeliveryNoteServiceImplTest {

    @Mock
    private DeliveryNoteRepository deliveryNoteRepository;

    @Mock
    private DeliveryNoteMapper deliveryNoteMapper;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private RepairOrderRepository repairOrderRepository;

    @Mock
    private EstimateService estimateService;

    @Mock
    private EmailNotificationService emailNotificationService;

    @Mock
    private TaxConfigService taxConfigService;

    @Mock
    private StockService stockService;

    @Mock
    private RepairOrderService repairOrderService;

    @Mock
    private AuditService auditService;

    @Mock
    private PaymentRepository paymentRepository;


    @InjectMocks
    private DeliveryNoteServiceImpl deliveryNoteService;

    @Test
    void givenDeliveryNotesExist_whenGetAll_thenReturnPage() {
        Pageable pageable = PageRequest.of(0, 12);
        DeliveryNote deliveryNote = buildDeliveryNote(1L);
        DeliveryNoteResponse response = buildDeliveryNoteResponse(1L);
        Page<DeliveryNote> page = new PageImpl<>(List.of(deliveryNote), pageable, 1);
        when(deliveryNoteRepository.findAll(pageable)).thenReturn(page);
        when(deliveryNoteMapper.toResponse(deliveryNote)).thenReturn(response);

        Page<DeliveryNoteResponse> result = deliveryNoteService.getAll(pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).id()).isEqualTo(1L);
    }

    @Test
    void givenFilters_whenSearch_thenReturnFilteredPage() {
        Pageable pageable = PageRequest.of(0, 12);
        DeliveryNote deliveryNote = buildDeliveryNote(1L);
        DeliveryNoteResponse response = buildDeliveryNoteResponse(1L);
        Page<DeliveryNote> page = new PageImpl<>(List.of(deliveryNote), pageable, 1);
        when(deliveryNoteRepository.search("Juan", null, null, null, null, pageable)).thenReturn(page);
        when(deliveryNoteMapper.toResponse(deliveryNote)).thenReturn(response);

        Page<DeliveryNoteResponse> result = deliveryNoteService.search("Juan", null, null, null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void givenFilterByPlate_whenSearch_thenReturnFilteredPage() {
        Pageable pageable = PageRequest.of(0, 12);
        DeliveryNote deliveryNote = buildDeliveryNote(1L);
        DeliveryNoteResponse response = buildDeliveryNoteResponse(1L);
        Page<DeliveryNote> page = new PageImpl<>(List.of(deliveryNote), pageable, 1);
        when(deliveryNoteRepository.search(null, "ABC", null, null, null, pageable)).thenReturn(page);
        when(deliveryNoteMapper.toResponse(deliveryNote)).thenReturn(response);

        Page<DeliveryNoteResponse> result = deliveryNoteService.search(null, "ABC", null, null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void givenFilterByStatus_whenSearch_thenReturnFilteredPage() {
        Pageable pageable = PageRequest.of(0, 12);
        DeliveryNote deliveryNote = buildDeliveryNote(1L);
        DeliveryNoteResponse response = buildDeliveryNoteResponse(1L);
        Page<DeliveryNote> page = new PageImpl<>(List.of(deliveryNote), pageable, 1);
        when(deliveryNoteRepository.search(null, null, DeliveryNoteStatus.PENDIENTE, null, null, pageable)).thenReturn(page);
        when(deliveryNoteMapper.toResponse(deliveryNote)).thenReturn(response);

        Page<DeliveryNoteResponse> result = deliveryNoteService.search(null, null, DeliveryNoteStatus.PENDIENTE, null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void givenFilterByClientId_whenSearch_thenPassesClientIdToRepository() {
        Pageable pageable = PageRequest.of(0, 12);
        DeliveryNote deliveryNote = buildDeliveryNote(1L);
        DeliveryNoteResponse response = buildDeliveryNoteResponse(1L);
        Page<DeliveryNote> page = new PageImpl<>(List.of(deliveryNote), pageable, 1);
        when(deliveryNoteRepository.search(null, null, null, 7L, null, pageable)).thenReturn(page);
        when(deliveryNoteMapper.toResponse(deliveryNote)).thenReturn(response);

        Page<DeliveryNoteResponse> result = deliveryNoteService.search(null, null, null, 7L, null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void givenFilterByVehicleId_whenSearch_thenPassesVehicleIdToRepository() {
        Pageable pageable = PageRequest.of(0, 12);
        DeliveryNote deliveryNote = buildDeliveryNote(1L);
        DeliveryNoteResponse response = buildDeliveryNoteResponse(1L);
        Page<DeliveryNote> page = new PageImpl<>(List.of(deliveryNote), pageable, 1);
        when(deliveryNoteRepository.search(null, null, null, null, 3L, pageable)).thenReturn(page);
        when(deliveryNoteMapper.toResponse(deliveryNote)).thenReturn(response);

        Page<DeliveryNoteResponse> result = deliveryNoteService.search(null, null, null, null, 3L, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void givenClientIdAndStatusFilters_whenSearch_thenBothPassedToRepository() {
        Pageable pageable = PageRequest.of(0, 12);
        DeliveryNote deliveryNote = buildDeliveryNote(1L);
        DeliveryNoteResponse response = buildDeliveryNoteResponse(1L);
        Page<DeliveryNote> page = new PageImpl<>(List.of(deliveryNote), pageable, 1);
        when(deliveryNoteRepository.search(null, null, DeliveryNoteStatus.PENDIENTE, 7L, null, pageable)).thenReturn(page);
        when(deliveryNoteMapper.toResponse(deliveryNote)).thenReturn(response);

        Page<DeliveryNoteResponse> result =
                deliveryNoteService.search(null, null, DeliveryNoteStatus.PENDIENTE, 7L, null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void givenValidId_whenGetById_thenReturnDetailResponse() {
        DeliveryNote deliveryNote = buildDeliveryNote(1L);
        DeliveryNoteDetailResponse detailResponse = buildDetailResponse(1L);
        when(deliveryNoteRepository.findWithDetailsById(1L)).thenReturn(Optional.of(deliveryNote));
        when(deliveryNoteMapper.toDetailResponse(deliveryNote)).thenReturn(detailResponse);

        DeliveryNoteDetailResponse result = deliveryNoteService.getById(1L);

        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void givenNonExistentId_whenGetById_thenThrowResourceNotFoundException() {
        when(deliveryNoteRepository.findWithDetailsById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> deliveryNoteService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenValidRepairOrderId_whenGetByRepairOrderId_thenReturnDetailResponse() {
        DeliveryNote deliveryNote = buildDeliveryNote(1L);
        DeliveryNoteDetailResponse detailResponse = buildDetailResponse(1L);
        when(deliveryNoteRepository.findByRepairOrderId(10L)).thenReturn(Optional.of(deliveryNote));
        when(deliveryNoteRepository.findWithDetailsById(1L)).thenReturn(Optional.of(deliveryNote));
        when(deliveryNoteMapper.toDetailResponse(deliveryNote)).thenReturn(detailResponse);

        DeliveryNoteDetailResponse result = deliveryNoteService.getByRepairOrderId(10L);

        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void givenNoDeliveryNoteForRepairOrder_whenGetByRepairOrderId_thenThrowResourceNotFoundException() {
        when(deliveryNoteRepository.findByRepairOrderId(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> deliveryNoteService.getByRepairOrderId(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenValidRequest_whenCreate_thenReturnDetailResponse() {
        Client client = buildClient(1L, ClientType.PERSONAL);
        Vehicle vehicle = buildVehicle(2L, client);
        DeliveryNoteRequest request = new DeliveryNoteRequest(1L, 2L, null, null,
                BigDecimal.ZERO, BigDecimal.ZERO,
                List.of(new DeliveryNoteServiceItemRequest("Service A", BigDecimal.valueOf(100))),
                List.of(new DeliveryNoteProductRequest("Product A", 2, BigDecimal.valueOf(50), null)));

        DeliveryNote mappedEntity = DeliveryNote.builder()
                .discountPercentage(BigDecimal.ZERO)
                .build();
        DeliveryNote savedEntity = buildDeliveryNote(1L);
        DeliveryNoteDetailResponse detailResponse = buildDetailResponse(1L);

        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(vehicleRepository.findById(2L)).thenReturn(Optional.of(vehicle));
        when(deliveryNoteMapper.toEntity(request)).thenReturn(mappedEntity);
        when(deliveryNoteRepository.nextNumber()).thenReturn(1L);
        when(deliveryNoteRepository.save(any(DeliveryNote.class))).thenReturn(savedEntity);
        when(deliveryNoteRepository.findWithDetailsById(1L)).thenReturn(Optional.of(savedEntity));
        when(deliveryNoteMapper.toDetailResponse(savedEntity)).thenReturn(detailResponse);

        DeliveryNoteDetailResponse result = deliveryNoteService.create(request);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(mappedEntity.getNumber()).isEqualTo(1L);
        verify(deliveryNoteRepository).save(any(DeliveryNote.class));
        verify(deliveryNoteRepository).nextNumber();
    }

    @Test
    void givenClientNotFound_whenCreate_thenThrowResourceNotFoundException() {
        DeliveryNoteRequest request = new DeliveryNoteRequest(99L, null, null, null,
                BigDecimal.ZERO, BigDecimal.ZERO, Collections.emptyList(), Collections.emptyList());
        when(clientRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> deliveryNoteService.create(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenRepairOrderWithExistingDeliveryNote_whenCreate_thenThrowBusinessException() {
        Client client = buildClient(1L, ClientType.PERSONAL);
        RepairOrder repairOrder = buildRepairOrder(10L);
        DeliveryNoteRequest request = new DeliveryNoteRequest(1L, null, 10L, null,
                BigDecimal.ZERO, BigDecimal.ZERO, Collections.emptyList(), Collections.emptyList());

        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(repairOrderRepository.findById(10L)).thenReturn(Optional.of(repairOrder));
        when(deliveryNoteRepository.findByRepairOrderId(10L))
                .thenReturn(Optional.of(buildDeliveryNote(99L)));

        assertThatThrownBy(() -> deliveryNoteService.create(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ya tiene un remito");
    }

    @Test
    void givenEstimateAlreadyRemitted_whenCreate_thenThrowBusinessException() {
        Client client = buildClient(1L, ClientType.PERSONAL);
        DeliveryNoteRequest request = new DeliveryNoteRequest(1L, null, null, 5L,
                BigDecimal.ZERO, BigDecimal.ZERO, Collections.emptyList(), Collections.emptyList());

        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(deliveryNoteRepository.findByEstimateId(5L))
                .thenReturn(Optional.of(buildDeliveryNote(99L)));

        assertThatThrownBy(() -> deliveryNoteService.create(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("El presupuesto ya tiene un remito");
    }

    @Test
    void givenTemporalClientWithServices_whenCreate_thenThrowBusinessException() {
        Client client = buildClient(1L, ClientType.TEMPORAL);
        DeliveryNoteRequest request = new DeliveryNoteRequest(1L, null, null, null,
                BigDecimal.ZERO, BigDecimal.ZERO,
                List.of(new DeliveryNoteServiceItemRequest("Service A", BigDecimal.valueOf(100))),
                Collections.emptyList());
        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));

        assertThatThrownBy(() -> deliveryNoteService.create(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("temporales");
    }

    @Test
    void givenTemporalClientWithProductsOnly_whenCreate_thenSuccess() {
        Client client = buildClient(1L, ClientType.TEMPORAL);
        DeliveryNoteRequest request = new DeliveryNoteRequest(1L, null, null, null,
                BigDecimal.ZERO, BigDecimal.ZERO,
                Collections.emptyList(),
                List.of(new DeliveryNoteProductRequest("Product A", 2, BigDecimal.valueOf(50), null)));

        DeliveryNote mappedEntity = DeliveryNote.builder()
                .discountPercentage(BigDecimal.ZERO)
                .build();
        DeliveryNote savedEntity = buildDeliveryNote(1L);
        DeliveryNoteDetailResponse detailResponse = buildDetailResponse(1L);

        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(deliveryNoteMapper.toEntity(request)).thenReturn(mappedEntity);
        when(deliveryNoteRepository.save(any(DeliveryNote.class))).thenReturn(savedEntity);
        when(deliveryNoteRepository.findWithDetailsById(1L)).thenReturn(Optional.of(savedEntity));
        when(deliveryNoteMapper.toDetailResponse(savedEntity)).thenReturn(detailResponse);

        DeliveryNoteDetailResponse result = deliveryNoteService.create(request);

        assertThat(result).isNotNull();
    }

    @Test
    void givenTemporalClientWithNullVehicle_whenCreate_thenSuccess() {
        Client client = buildClient(1L, ClientType.TEMPORAL);
        DeliveryNoteRequest request = new DeliveryNoteRequest(1L, null, null, null,
                BigDecimal.ZERO, BigDecimal.ZERO,
                null,
                List.of(new DeliveryNoteProductRequest("Product A", 1, BigDecimal.valueOf(100), null)));

        DeliveryNote mappedEntity = DeliveryNote.builder()
                .discountPercentage(BigDecimal.ZERO)
                .build();
        DeliveryNote savedEntity = buildDeliveryNote(1L);
        DeliveryNoteDetailResponse detailResponse = buildDetailResponse(1L);

        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(deliveryNoteMapper.toEntity(request)).thenReturn(mappedEntity);
        when(deliveryNoteRepository.save(any(DeliveryNote.class))).thenReturn(savedEntity);
        when(deliveryNoteRepository.findWithDetailsById(1L)).thenReturn(Optional.of(savedEntity));
        when(deliveryNoteMapper.toDetailResponse(savedEntity)).thenReturn(detailResponse);

        DeliveryNoteDetailResponse result = deliveryNoteService.create(request);

        assertThat(result).isNotNull();
    }

    @Test
    void givenRequestWithEstimateId_whenCreate_thenLinksEstimate() {
        Client client = buildClient(1L, ClientType.PERSONAL);
        Vehicle vehicle = buildVehicle(2L, client);
        DeliveryNoteRequest request = new DeliveryNoteRequest(1L, 2L, null, 5L,
                BigDecimal.ZERO, BigDecimal.ZERO, Collections.emptyList(), Collections.emptyList());

        DeliveryNote mappedEntity = DeliveryNote.builder()
                .discountPercentage(BigDecimal.ZERO)
                .build();
        DeliveryNote savedEntity = buildDeliveryNote(1L);
        DeliveryNoteDetailResponse detailResponse = buildDetailResponse(1L);

        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(vehicleRepository.findById(2L)).thenReturn(Optional.of(vehicle));
        when(deliveryNoteRepository.findByEstimateId(5L)).thenReturn(Optional.empty());
        when(estimateService.getById(5L)).thenReturn(new com.autotech.estimate.dto.EstimateDetailResponse(
                5L, 1L, "Juan Perez", null, null, null,
                2L, "ABC123", null, "Corolla", 2020, null,
                null, Collections.emptyList(), com.autotech.estimate.model.EstimateStatus.ACEPTADO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                Collections.emptyList(), Collections.emptyList(),
                LocalDateTime.now(), LocalDateTime.now(), null, null, null));
        when(deliveryNoteMapper.toEntity(request)).thenReturn(mappedEntity);
        when(deliveryNoteRepository.save(any(DeliveryNote.class))).thenReturn(savedEntity);
        when(deliveryNoteRepository.findWithDetailsById(1L)).thenReturn(Optional.of(savedEntity));
        when(deliveryNoteMapper.toDetailResponse(savedEntity)).thenReturn(detailResponse);

        DeliveryNoteDetailResponse result = deliveryNoteService.create(request);

        assertThat(result).isNotNull();
        verify(estimateService).getById(5L);
    }

    @Test
    void givenAcceptedEstimate_whenCreateFromEstimate_thenReturnDetailResponse() {
        Client client = buildClient(1L, ClientType.PERSONAL);
        Vehicle vehicle = buildVehicle(2L, client);

        EstimateDeliveryNoteDataResponse estimateData = new EstimateDeliveryNoteDataResponse(
                5L, 1L, 2L, null,
                List.of(new EstimateServiceItemResponse(1L, "Service A", BigDecimal.valueOf(100))),
                List.of(new EstimateProductResponse(1L, "Product A", 2, BigDecimal.valueOf(50), BigDecimal.valueOf(100), null)),
                BigDecimal.valueOf(10), BigDecimal.valueOf(21), BigDecimal.valueOf(300));

        DeliveryNote mappedEntity = DeliveryNote.builder()
                .discountPercentage(BigDecimal.valueOf(10))
                .build();
        DeliveryNote savedEntity = buildDeliveryNote(1L);
        DeliveryNoteDetailResponse detailResponse = buildDetailResponse(1L);

        when(estimateService.convertToDeliveryNoteData(5L)).thenReturn(estimateData);
        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(vehicleRepository.findById(2L)).thenReturn(Optional.of(vehicle));
        when(deliveryNoteRepository.findByEstimateId(5L)).thenReturn(Optional.empty());
        when(estimateService.getById(5L)).thenReturn(new com.autotech.estimate.dto.EstimateDetailResponse(
                5L, 1L, "Juan Perez", null, null, null,
                2L, "ABC123", null, "Corolla", 2020, null,
                null, Collections.emptyList(), com.autotech.estimate.model.EstimateStatus.ACEPTADO,
                BigDecimal.valueOf(10), BigDecimal.valueOf(21), BigDecimal.valueOf(300),
                Collections.emptyList(), Collections.emptyList(),
                LocalDateTime.now(), LocalDateTime.now(), null, null, null));
        when(deliveryNoteMapper.toEntity(any(DeliveryNoteRequest.class))).thenReturn(mappedEntity);
        when(deliveryNoteRepository.save(any(DeliveryNote.class))).thenReturn(savedEntity);
        when(deliveryNoteRepository.findWithDetailsById(1L)).thenReturn(Optional.of(savedEntity));
        when(deliveryNoteMapper.toDetailResponse(savedEntity)).thenReturn(detailResponse);

        DeliveryNoteDetailResponse result = deliveryNoteService.createFromEstimate(5L);

        assertThat(result).isNotNull();
        verify(estimateService).convertToDeliveryNoteData(5L);
    }

    @Test
    void givenEstimateWithTax_whenCreateFromEstimate_thenCopiesTaxAndTotalIncludesIt() {
        Client client = buildClient(1L, ClientType.PERSONAL);
        Vehicle vehicle = buildVehicle(2L, client);

        EstimateDeliveryNoteDataResponse estimateData = new EstimateDeliveryNoteDataResponse(
                5L, 1L, 2L, null,
                List.of(new EstimateServiceItemResponse(1L, "Service A", BigDecimal.valueOf(100))),
                List.of(new EstimateProductResponse(1L, "Product A", 2, BigDecimal.valueOf(50), BigDecimal.valueOf(100), null)),
                BigDecimal.valueOf(10), BigDecimal.valueOf(21), new BigDecimal("217.80"));

        DeliveryNote mappedEntity = DeliveryNote.builder()
                .discountPercentage(BigDecimal.valueOf(10))
                .build();
        DeliveryNote savedEntity = buildDeliveryNote(1L);

        when(estimateService.convertToDeliveryNoteData(5L)).thenReturn(estimateData);
        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(vehicleRepository.findById(2L)).thenReturn(Optional.of(vehicle));
        when(deliveryNoteRepository.findByEstimateId(5L)).thenReturn(Optional.empty());
        when(deliveryNoteMapper.toEntity(any(DeliveryNoteRequest.class))).thenReturn(mappedEntity);
        when(deliveryNoteRepository.save(any(DeliveryNote.class))).thenReturn(savedEntity);
        when(deliveryNoteRepository.findWithDetailsById(1L)).thenReturn(Optional.of(savedEntity));
        when(deliveryNoteMapper.toDetailResponse(savedEntity)).thenReturn(buildDetailResponse(1L));

        deliveryNoteService.createFromEstimate(5L);

        // subtotal=200, discount(10%)=20, after discount=180, IVA(21%)=37.80, total=217.80
        assertThat(mappedEntity.getTaxPercentage()).isEqualByComparingTo(BigDecimal.valueOf(21));
        assertThat(mappedEntity.getTotal()).isEqualByComparingTo(new BigDecimal("217.80"));
        verify(taxConfigService, never()).getConfig();
    }

    @Test
    void givenRequestWithoutTax_whenCreate_thenUsesGlobalTax() {
        Client client = buildClient(1L, ClientType.PERSONAL);
        DeliveryNoteRequest request = new DeliveryNoteRequest(1L, null, null, null,
                BigDecimal.ZERO, null,
                List.of(new DeliveryNoteServiceItemRequest("Service A", BigDecimal.valueOf(100))),
                Collections.emptyList());

        DeliveryNote mappedEntity = DeliveryNote.builder().build();
        DeliveryNote savedEntity = buildDeliveryNote(1L);
        TaxConfig taxConfig = TaxConfig.builder().taxPercentage(BigDecimal.valueOf(21)).build();

        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(taxConfigService.getConfig()).thenReturn(taxConfig);
        when(deliveryNoteMapper.toEntity(request)).thenReturn(mappedEntity);
        when(deliveryNoteRepository.save(any(DeliveryNote.class))).thenReturn(savedEntity);
        when(deliveryNoteRepository.findWithDetailsById(1L)).thenReturn(Optional.of(savedEntity));
        when(deliveryNoteMapper.toDetailResponse(savedEntity)).thenReturn(buildDetailResponse(1L));

        deliveryNoteService.create(request);

        assertThat(mappedEntity.getTaxPercentage()).isEqualByComparingTo(BigDecimal.valueOf(21));
        assertThat(mappedEntity.getTotal()).isEqualByComparingTo(BigDecimal.valueOf(121));
    }

    @Test
    void givenDiscountAndTax_whenCalculateTotal_thenAppliesTaxAfterDiscount() {
        List<DeliveryNoteServiceItemRequest> services = List.of(
                new DeliveryNoteServiceItemRequest("Service A", BigDecimal.valueOf(1000)));

        BigDecimal total = deliveryNoteService.calculateTotal(services, Collections.emptyList(),
                BigDecimal.valueOf(10), BigDecimal.valueOf(21));

        // subtotal=1000, discount=100, after discount=900, IVA=189, total=1089
        assertThat(total).isEqualByComparingTo(BigDecimal.valueOf(1089));
    }

    @Test
    void givenNonAcceptedEstimate_whenCreateFromEstimate_thenThrowBusinessException() {
        when(estimateService.convertToDeliveryNoteData(5L))
                .thenThrow(new BusinessException("Solo se pueden emitir remitos desde presupuestos en estado ACEPTADO"));

        assertThatThrownBy(() -> deliveryNoteService.createFromEstimate(5L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ACEPTADO");
    }

    @Test
    void givenStandaloneDeliveryNote_whenDelete_thenDeletesSuccessfully() {
        DeliveryNote deliveryNote = buildDeliveryNote(1L);
        deliveryNote.setRepairOrder(null);
        deliveryNote.setStatus(DeliveryNoteStatus.PENDIENTE);
        when(deliveryNoteRepository.findById(1L)).thenReturn(Optional.of(deliveryNote));

        deliveryNoteService.delete(1L);

        verify(stockService).revertDeliveryNote(1L);
        verify(deliveryNoteRepository).deleteById(1L);
    }

    @Test
    void givenRepairOrderDeliveryNote_whenDelete_thenThrowBusinessException() {
        DeliveryNote deliveryNote = buildDeliveryNote(1L);
        RepairOrder repairOrder = buildRepairOrder(10L);
        deliveryNote.setRepairOrder(repairOrder);
        when(deliveryNoteRepository.findById(1L)).thenReturn(Optional.of(deliveryNote));

        assertThatThrownBy(() -> deliveryNoteService.delete(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("orden de trabajo");
    }

    @Test
    void givenPaidDeliveryNote_whenDelete_thenThrowBusinessException() {
        DeliveryNote deliveryNote = buildDeliveryNote(1L);
        deliveryNote.setRepairOrder(null);
        deliveryNote.setStatus(DeliveryNoteStatus.PAGADA);
        when(deliveryNoteRepository.findById(1L)).thenReturn(Optional.of(deliveryNote));

        assertThatThrownBy(() -> deliveryNoteService.delete(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("pagado");
    }

    @Test
    void givenNonExistentId_whenDelete_thenThrowResourceNotFoundException() {
        when(deliveryNoteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> deliveryNoteService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenServicesAndProducts_whenCalculateTotal_thenReturnCorrectTotal() {
        List<DeliveryNoteServiceItemRequest> services = List.of(
                new DeliveryNoteServiceItemRequest("Service A", BigDecimal.valueOf(100)),
                new DeliveryNoteServiceItemRequest("Service B", BigDecimal.valueOf(200)));
        List<DeliveryNoteProductRequest> products = List.of(
                new DeliveryNoteProductRequest("Product A", 2, BigDecimal.valueOf(50), null));

        BigDecimal total = deliveryNoteService.calculateTotal(services, products, BigDecimal.ZERO, BigDecimal.ZERO);

        assertThat(total).isEqualByComparingTo(BigDecimal.valueOf(400));
    }

    @Test
    void givenZeroDiscountAndTax_whenCalculateTotal_thenReturnSubtotal() {
        List<DeliveryNoteServiceItemRequest> services = List.of(
                new DeliveryNoteServiceItemRequest("Service A", BigDecimal.valueOf(200)));

        BigDecimal total = deliveryNoteService.calculateTotal(services, Collections.emptyList(),
                BigDecimal.ZERO, BigDecimal.ZERO);

        assertThat(total).isEqualByComparingTo(BigDecimal.valueOf(200));
    }

    @Test
    void givenEmptyServices_whenCalculateTotal_thenReturnProductsTotal() {
        List<DeliveryNoteProductRequest> products = List.of(
                new DeliveryNoteProductRequest("Product A", 3, BigDecimal.valueOf(100), null));

        BigDecimal total = deliveryNoteService.calculateTotal(Collections.emptyList(), products,
                BigDecimal.ZERO, BigDecimal.ZERO);

        assertThat(total).isEqualByComparingTo(BigDecimal.valueOf(300));
    }

    @Test
    void givenEmptyProducts_whenCalculateTotal_thenReturnServicesTotal() {
        List<DeliveryNoteServiceItemRequest> services = List.of(
                new DeliveryNoteServiceItemRequest("Service A", BigDecimal.valueOf(150)));

        BigDecimal total = deliveryNoteService.calculateTotal(services, Collections.emptyList(),
                BigDecimal.ZERO, BigDecimal.ZERO);

        assertThat(total).isEqualByComparingTo(BigDecimal.valueOf(150));
    }

    @Test
    void givenDiscount_whenCalculateTotal_thenAppliesDiscount() {
        List<DeliveryNoteServiceItemRequest> services = List.of(
                new DeliveryNoteServiceItemRequest("Service A", BigDecimal.valueOf(1000)));

        BigDecimal total = deliveryNoteService.calculateTotal(services, Collections.emptyList(),
                BigDecimal.valueOf(10), BigDecimal.ZERO);

        // subtotal=1000, discount=100, total=900
        assertThat(total).isEqualByComparingTo(BigDecimal.valueOf(900));
    }

    @Test
    void givenExistingDeliveryNote_whenMarkAsPaid_thenStatusIsPagada() {
        DeliveryNote deliveryNote = buildDeliveryNote(1L);
        deliveryNote.setStatus(DeliveryNoteStatus.PENDIENTE);
        when(deliveryNoteRepository.findById(1L)).thenReturn(Optional.of(deliveryNote));
        when(deliveryNoteRepository.save(deliveryNote)).thenReturn(deliveryNote);

        deliveryNoteService.markAsPaid(1L);

        assertThat(deliveryNote.getStatus()).isEqualTo(DeliveryNoteStatus.PAGADA);
        verify(deliveryNoteRepository).save(deliveryNote);
    }

    @Test
    void givenNonExistentId_whenMarkAsPaid_thenThrowResourceNotFoundException() {
        when(deliveryNoteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> deliveryNoteService.markAsPaid(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // --- attachToRepairOrder ---

    @Test
    void givenStandaloneDeliveryNoteForSameClientAndVehicle_whenAttachToRepairOrder_thenDeliveryNoteIsLinkedToOrder() {
        Client client = buildClient(1L, ClientType.PERSONAL);
        Vehicle vehicle = buildVehicle(2L, client);
        DeliveryNote deliveryNote = buildDeliveryNote(1L);
        RepairOrder order = buildAttachableOrder(10L, client, vehicle);

        when(deliveryNoteRepository.findById(1L)).thenReturn(Optional.of(deliveryNote));
        when(repairOrderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(deliveryNoteRepository.findByRepairOrderId(10L)).thenReturn(Optional.empty());
        when(deliveryNoteRepository.save(deliveryNote)).thenReturn(deliveryNote);
        when(deliveryNoteRepository.findWithDetailsById(1L)).thenReturn(Optional.of(deliveryNote));
        when(deliveryNoteMapper.toDetailResponse(deliveryNote)).thenReturn(buildDetailResponse(1L));

        DeliveryNoteDetailResponse result = deliveryNoteService.attachToRepairOrder(1L, 10L);

        assertThat(result.id()).isEqualTo(1L);
        // The link must be persisted on the delivery note, not merely returned
        assertThat(deliveryNote.getRepairOrder()).isSameAs(order);
        verify(deliveryNoteRepository).save(deliveryNote);
        verify(repairOrderService).validateNotClosedByStatus(order);
    }

    @Test
    void givenAttachSucceeds_whenInvoked_thenRecordsAssociationAuditRow() {
        Client client = buildClient(1L, ClientType.PERSONAL);
        Vehicle vehicle = buildVehicle(2L, client);
        DeliveryNote deliveryNote = buildDeliveryNote(1L);
        RepairOrder order = buildAttachableOrder(10L, client, vehicle);

        when(deliveryNoteRepository.findById(1L)).thenReturn(Optional.of(deliveryNote));
        when(repairOrderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(deliveryNoteRepository.findByRepairOrderId(10L)).thenReturn(Optional.empty());
        when(deliveryNoteRepository.save(deliveryNote)).thenReturn(deliveryNote);
        when(deliveryNoteRepository.findWithDetailsById(1L)).thenReturn(Optional.of(deliveryNote));
        when(deliveryNoteMapper.toDetailResponse(deliveryNote)).thenReturn(buildDetailResponse(1L));

        deliveryNoteService.attachToRepairOrder(1L, 10L);

        ArgumentCaptor<Map<String, Object>> oldCaptor = mapCaptor();
        ArgumentCaptor<Map<String, Object>> newCaptor = mapCaptor();
        verify(auditService).record(eq(AuditEntityType.DELIVERY_NOTE), eq(1L), eq(AuditAction.MODIFIED),
                oldCaptor.capture(), newCaptor.capture());
        assertThat(oldCaptor.getValue()).containsEntry("repairOrderId", null);
        assertThat(newCaptor.getValue()).containsEntry("repairOrderId", 10L);
    }

    @Test
    void givenDeliveryNoteAlreadyAttached_whenAttach_thenThrowBusinessException() {
        DeliveryNote deliveryNote = buildDeliveryNote(1L);
        deliveryNote.setRepairOrder(buildRepairOrder(11L));
        when(deliveryNoteRepository.findById(1L)).thenReturn(Optional.of(deliveryNote));

        assertThatThrownBy(() -> deliveryNoteService.attachToRepairOrder(1L, 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ya está asociado");
        verify(deliveryNoteRepository, never()).save(any(DeliveryNote.class));
    }

    @Test
    void givenRepairOrderAlreadyHasDeliveryNote_whenAttach_thenThrowBusinessException() {
        Client client = buildClient(1L, ClientType.PERSONAL);
        Vehicle vehicle = buildVehicle(2L, client);
        DeliveryNote deliveryNote = buildDeliveryNote(1L);
        RepairOrder order = buildAttachableOrder(10L, client, vehicle);

        when(deliveryNoteRepository.findById(1L)).thenReturn(Optional.of(deliveryNote));
        when(repairOrderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(deliveryNoteRepository.findByRepairOrderId(10L)).thenReturn(Optional.of(buildDeliveryNote(99L)));

        assertThatThrownBy(() -> deliveryNoteService.attachToRepairOrder(1L, 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ya tiene un remito");
        verify(deliveryNoteRepository, never()).save(any(DeliveryNote.class));
    }

    @Test
    void givenDifferentClient_whenAttach_thenThrowBusinessException() {
        Client deliveryNoteClient = buildClient(1L, ClientType.PERSONAL);
        Client otherClient = buildClient(5L, ClientType.PERSONAL);
        Vehicle vehicle = buildVehicle(9L, otherClient);
        DeliveryNote deliveryNote = buildDeliveryNote(1L);
        RepairOrder order = buildAttachableOrder(10L, otherClient, vehicle);

        when(deliveryNoteRepository.findById(1L)).thenReturn(Optional.of(deliveryNote));
        when(repairOrderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(deliveryNoteRepository.findByRepairOrderId(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> deliveryNoteService.attachToRepairOrder(1L, 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("cliente");
        verify(deliveryNoteRepository, never()).save(any(DeliveryNote.class));
    }

    @Test
    void givenDifferentVehicle_whenAttach_thenThrowBusinessException() {
        Client client = buildClient(1L, ClientType.PERSONAL);
        Vehicle deliveryNoteVehicle = buildVehicle(2L, client);
        Vehicle orderVehicle = buildVehicle(9L, client);
        DeliveryNote deliveryNote = buildDeliveryNote(1L);
        deliveryNote.setVehicle(deliveryNoteVehicle);
        RepairOrder order = buildAttachableOrder(10L, client, orderVehicle);

        when(deliveryNoteRepository.findById(1L)).thenReturn(Optional.of(deliveryNote));
        when(repairOrderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(deliveryNoteRepository.findByRepairOrderId(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> deliveryNoteService.attachToRepairOrder(1L, 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("vehículo");
        verify(deliveryNoteRepository, never()).save(any(DeliveryNote.class));
    }

    @Test
    void givenClosedRepairOrder_whenAttach_thenThrowsAndDoesNotSave() {
        Client client = buildClient(1L, ClientType.PERSONAL);
        Vehicle vehicle = buildVehicle(2L, client);
        DeliveryNote deliveryNote = buildDeliveryNote(1L);
        RepairOrder order = buildAttachableOrder(10L, client, vehicle);
        order.setStatus(RepairOrderStatus.ENTREGADO);

        when(deliveryNoteRepository.findById(1L)).thenReturn(Optional.of(deliveryNote));
        when(repairOrderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(deliveryNoteRepository.findByRepairOrderId(10L)).thenReturn(Optional.empty());
        doThrow(new BusinessException("La orden de trabajo está cerrada"))
                .when(repairOrderService).validateNotClosedByStatus(order);

        assertThatThrownBy(() -> deliveryNoteService.attachToRepairOrder(1L, 10L))
                .isInstanceOf(BusinessException.class);
        verify(deliveryNoteRepository, never()).save(any(DeliveryNote.class));
        // The D1 guard is reused, not reimplemented
        verify(repairOrderService).validateNotClosedByStatus(order);
    }

    @Test
    void givenPaidDeliveryNote_whenAttach_thenStillSucceedsAndAuditCarriesPaidAmount() {
        Client client = buildClient(1L, ClientType.PERSONAL);
        Vehicle vehicle = buildVehicle(2L, client);
        DeliveryNote deliveryNote = buildDeliveryNote(1L);
        deliveryNote.setStatus(DeliveryNoteStatus.PAGADA);
        RepairOrder order = buildAttachableOrder(10L, client, vehicle);

        when(deliveryNoteRepository.findById(1L)).thenReturn(Optional.of(deliveryNote));
        when(repairOrderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(deliveryNoteRepository.findByRepairOrderId(10L)).thenReturn(Optional.empty());
        when(paymentRepository.sumAmountByDeliveryNoteId(1L)).thenReturn(BigDecimal.valueOf(400));
        when(deliveryNoteRepository.save(deliveryNote)).thenReturn(deliveryNote);
        when(deliveryNoteRepository.findWithDetailsById(1L)).thenReturn(Optional.of(deliveryNote));
        when(deliveryNoteMapper.toDetailResponse(deliveryNote)).thenReturn(buildDetailResponse(1L));

        DeliveryNoteDetailResponse result = deliveryNoteService.attachToRepairOrder(1L, 10L);

        // A paid delivery note is allowed: paying at the counter and recording the order
        // afterwards is exactly the use case this endpoint exists for
        assertThat(result.id()).isEqualTo(1L);
        assertThat(deliveryNote.getRepairOrder()).isSameAs(order);
        ArgumentCaptor<Map<String, Object>> newCaptor = mapCaptor();
        verify(auditService).record(eq(AuditEntityType.DELIVERY_NOTE), eq(1L), eq(AuditAction.MODIFIED),
                any(), newCaptor.capture());
        assertThat(newCaptor.getValue()).containsEntry("paidAmount", BigDecimal.valueOf(400));
    }

    @Test
    void givenDeliveryNoteWithNullVehicle_whenAttach_thenVehicleIsFilledFromOrderAndAudited() {
        Client client = buildClient(1L, ClientType.PERSONAL);
        Vehicle vehicle = buildVehicle(2L, client);
        DeliveryNote deliveryNote = buildDeliveryNote(1L);
        deliveryNote.setVehicle(null);
        RepairOrder order = buildAttachableOrder(10L, client, vehicle);

        when(deliveryNoteRepository.findById(1L)).thenReturn(Optional.of(deliveryNote));
        when(repairOrderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(deliveryNoteRepository.findByRepairOrderId(10L)).thenReturn(Optional.empty());
        when(deliveryNoteRepository.save(deliveryNote)).thenReturn(deliveryNote);
        when(deliveryNoteRepository.findWithDetailsById(1L)).thenReturn(Optional.of(deliveryNote));
        when(deliveryNoteMapper.toDetailResponse(deliveryNote)).thenReturn(buildDetailResponse(1L));

        deliveryNoteService.attachToRepairOrder(1L, 10L);

        // D14: a null vehicle on the delivery note is filled from the order, a persisted mutation
        assertThat(deliveryNote.getVehicle()).isSameAs(vehicle);
        ArgumentCaptor<Map<String, Object>> newCaptor = mapCaptor();
        verify(auditService).record(eq(AuditEntityType.DELIVERY_NOTE), eq(1L), eq(AuditAction.MODIFIED),
                any(), newCaptor.capture());
        assertThat(newCaptor.getValue()).containsEntry("vehicleId", 2L);
    }

    @SuppressWarnings("unchecked")
    private ArgumentCaptor<Map<String, Object>> mapCaptor() {
        return ArgumentCaptor.forClass(Map.class);
    }

    // --- Builder helpers ---

    private RepairOrder buildAttachableOrder(Long id, Client client, Vehicle vehicle) {
        RepairOrder order = RepairOrder.builder()
                .title("Test Order")
                .status(RepairOrderStatus.INGRESO_VEHICULO)
                .build();
        order.setId(id);
        order.setClient(client);
        order.setVehicle(vehicle);
        return order;
    }

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

    private DeliveryNote buildDeliveryNote(Long id) {
        Client client = buildClient(1L, ClientType.PERSONAL);
        Vehicle vehicle = buildVehicle(2L, client);
        DeliveryNote deliveryNote = DeliveryNote.builder()
                .client(client)
                .vehicle(vehicle)
                .status(DeliveryNoteStatus.PENDIENTE)
                .discountPercentage(BigDecimal.ZERO)
                .total(BigDecimal.valueOf(400))
                .build();
        deliveryNote.setId(id);
        deliveryNote.setCreatedAt(LocalDateTime.now());
        deliveryNote.setUpdatedAt(LocalDateTime.now());
        return deliveryNote;
    }

    private DeliveryNoteResponse buildDeliveryNoteResponse(Long id) {
        return new DeliveryNoteResponse(
                id, 1L, 1L, "Juan Perez", 2L, "ABC123", "Corolla", null, null,
                DeliveryNoteStatus.PENDIENTE, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.valueOf(400), LocalDateTime.now(), LocalDateTime.now());
    }

    private DeliveryNoteDetailResponse buildDetailResponse(Long id) {
        return new DeliveryNoteDetailResponse(
                id, 1L, 1L, "Juan Perez", "12345678", "1234567890", null, "PERSONAL",
                2L, "ABC123", null, "Corolla", 2020, null, null,
                DeliveryNoteStatus.PENDIENTE, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.valueOf(400), Collections.emptyList(), Collections.emptyList(),
                LocalDateTime.now(), LocalDateTime.now());
    }
}
