package com.autotech.estimate.service;

import com.autotech.client.model.Client;
import com.autotech.client.model.ClientType;
import com.autotech.client.repository.ClientRepository;
import com.autotech.common.exception.BusinessException;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.estimate.dto.EstimateDetailResponse;
import com.autotech.estimate.dto.EstimateInvoiceDataResponse;
import com.autotech.estimate.dto.EstimateMapper;
import com.autotech.estimate.dto.EstimateProductRequest;
import com.autotech.estimate.dto.EstimateRequest;
import com.autotech.estimate.dto.EstimateResponse;
import com.autotech.estimate.dto.EstimateServiceItemRequest;
import com.autotech.estimate.dto.InspectionIssueResponse;
import com.autotech.estimate.model.Estimate;
import com.autotech.estimate.model.EstimateProduct;
import com.autotech.estimate.model.EstimateServiceItem;
import com.autotech.estimate.model.EstimateStatus;
import com.autotech.estimate.repository.EstimateRepository;
import com.autotech.inspection.model.Inspection;
import com.autotech.inspection.model.InspectionItem;
import com.autotech.inspection.model.InspectionItemStatus;
import com.autotech.inspection.model.InspectionTemplate;
import com.autotech.inspection.model.InspectionTemplateItem;
import com.autotech.inspection.model.InspectionTemplateGroup;
import com.autotech.inspection.repository.InspectionRepository;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EstimateServiceImplTest {

    @Mock
    private EstimateRepository estimateRepository;

    @Mock
    private EstimateMapper estimateMapper;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private RepairOrderRepository repairOrderRepository;

    @Mock
    private InspectionRepository inspectionRepository;

    @InjectMocks
    private EstimateServiceImpl estimateService;

    @Test
    void givenEstimatesExist_whenGetAll_thenReturnPage() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 12);
        Estimate estimate = buildEstimate(1L);
        EstimateResponse response = buildEstimateResponse(1L);
        Page<Estimate> page = new PageImpl<>(List.of(estimate), pageable, 1);
        when(estimateRepository.findAll(pageable)).thenReturn(page);
        when(estimateMapper.toResponse(estimate)).thenReturn(response);

        // Act
        Page<EstimateResponse> result = estimateService.getAll(pageable);

        // Assert
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).id()).isEqualTo(1L);
    }

    @Test
    void givenFilters_whenSearch_thenReturnFilteredPage() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 12);
        Estimate estimate = buildEstimate(1L);
        EstimateResponse response = buildEstimateResponse(1L);
        Page<Estimate> page = new PageImpl<>(List.of(estimate), pageable, 1);
        when(estimateRepository.search("Juan", null, null, pageable)).thenReturn(page);
        when(estimateMapper.toResponse(estimate)).thenReturn(response);

        // Act
        Page<EstimateResponse> result = estimateService.search("Juan", null, null, pageable);

        // Assert
        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void givenValidId_whenGetById_thenReturnDetailResponse() {
        // Arrange
        Estimate estimate = buildEstimate(1L);
        EstimateDetailResponse detailResponse = buildDetailResponse(1L);
        when(estimateRepository.findWithDetailsById(1L)).thenReturn(Optional.of(estimate));
        when(estimateMapper.toDetailResponse(estimate)).thenReturn(detailResponse);

        // Act
        EstimateDetailResponse result = estimateService.getById(1L);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void givenNonExistentId_whenGetById_thenThrowResourceNotFoundException() {
        // Arrange
        when(estimateRepository.findWithDetailsById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> estimateService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenValidRepairOrderId_whenGetByRepairOrderId_thenReturnDetailResponse() {
        // Arrange
        Estimate estimate = buildEstimateWithRepairOrder(1L, 10L);
        EstimateDetailResponse detailResponse = buildDetailResponseWithRepairOrder(1L, 10L);
        when(estimateRepository.findByRepairOrderId(10L)).thenReturn(Optional.of(estimate));
        when(estimateMapper.toDetailResponse(estimate)).thenReturn(detailResponse);
        when(inspectionRepository.findByRepairOrderId(10L)).thenReturn(Collections.emptyList());

        // Act
        EstimateDetailResponse result = estimateService.getByRepairOrderId(10L);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.repairOrderId()).isEqualTo(10L);
    }

    @Test
    void givenNonExistentRepairOrder_whenGetByRepairOrderId_thenThrowResourceNotFoundException() {
        // Arrange
        when(estimateRepository.findByRepairOrderId(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> estimateService.getByRepairOrderId(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenValidRequest_whenCreate_thenReturnDetailResponse() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(2L, client);
        EstimateRequest request = new EstimateRequest(1L, 2L, null, BigDecimal.ZERO, BigDecimal.ZERO,
                List.of(new EstimateServiceItemRequest("Service A", BigDecimal.valueOf(100))),
                List.of(new EstimateProductRequest("Product A", 2, BigDecimal.valueOf(50))));

        Estimate mappedEntity = Estimate.builder()
                .discountPercentage(BigDecimal.ZERO)
                .taxPercentage(BigDecimal.ZERO)
                .build();

        Estimate savedEntity = buildEstimate(1L);
        EstimateDetailResponse detailResponse = buildDetailResponse(1L);

        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(vehicleRepository.findById(2L)).thenReturn(Optional.of(vehicle));
        when(estimateMapper.toEntity(request)).thenReturn(mappedEntity);
        when(estimateRepository.save(any(Estimate.class))).thenReturn(savedEntity);
        when(estimateRepository.findWithDetailsById(1L)).thenReturn(Optional.of(savedEntity));
        when(estimateMapper.toDetailResponse(savedEntity)).thenReturn(detailResponse);

        // Act
        EstimateDetailResponse result = estimateService.create(request);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
        verify(estimateRepository).save(any(Estimate.class));
    }

    @Test
    void givenValidRequestWithRepairOrder_whenCreate_thenSetsRepairOrderRelation() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(2L, client);
        RepairOrder repairOrder = buildRepairOrder(10L, client, vehicle);
        EstimateRequest request = new EstimateRequest(1L, 2L, 10L, BigDecimal.ZERO, BigDecimal.ZERO,
                Collections.emptyList(), Collections.emptyList());

        Estimate mappedEntity = Estimate.builder()
                .discountPercentage(BigDecimal.ZERO)
                .taxPercentage(BigDecimal.ZERO)
                .build();

        Estimate savedEntity = buildEstimateWithRepairOrder(1L, 10L);
        EstimateDetailResponse detailResponse = buildDetailResponseWithRepairOrder(1L, 10L);

        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(vehicleRepository.findById(2L)).thenReturn(Optional.of(vehicle));
        when(repairOrderRepository.findById(10L)).thenReturn(Optional.of(repairOrder));
        when(estimateMapper.toEntity(request)).thenReturn(mappedEntity);
        when(estimateRepository.save(any(Estimate.class))).thenReturn(savedEntity);
        when(estimateRepository.findWithDetailsById(1L)).thenReturn(Optional.of(savedEntity));
        when(estimateMapper.toDetailResponse(savedEntity)).thenReturn(detailResponse);
        when(inspectionRepository.findByRepairOrderId(10L)).thenReturn(Collections.emptyList());

        // Act
        EstimateDetailResponse result = estimateService.create(request);

        // Assert
        assertThat(result.repairOrderId()).isEqualTo(10L);
    }

    @Test
    void givenPendienteEstimate_whenUpdate_thenReturnUpdatedResponse() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(2L, client);
        Estimate existing = buildEstimate(1L);
        existing.setStatus(EstimateStatus.PENDIENTE);

        EstimateRequest request = new EstimateRequest(1L, 2L, null, BigDecimal.valueOf(10), BigDecimal.ZERO,
                Collections.emptyList(), Collections.emptyList());

        EstimateDetailResponse detailResponse = buildDetailResponse(1L);

        when(estimateRepository.findWithDetailsById(1L)).thenReturn(Optional.of(existing));
        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(vehicleRepository.findById(2L)).thenReturn(Optional.of(vehicle));
        when(estimateRepository.save(any(Estimate.class))).thenReturn(existing);
        when(estimateMapper.toDetailResponse(existing)).thenReturn(detailResponse);

        // Act
        EstimateDetailResponse result = estimateService.update(1L, request);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
        verify(estimateRepository).save(any(Estimate.class));
    }

    @Test
    void givenNonPendienteEstimate_whenUpdate_thenThrowBusinessException() {
        // Arrange
        Estimate existing = buildEstimate(1L);
        existing.setStatus(EstimateStatus.ACEPTADO);
        EstimateRequest request = new EstimateRequest(1L, 2L, null, BigDecimal.ZERO, BigDecimal.ZERO,
                Collections.emptyList(), Collections.emptyList());

        when(estimateRepository.findWithDetailsById(1L)).thenReturn(Optional.of(existing));

        // Act & Assert
        assertThatThrownBy(() -> estimateService.update(1L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("PENDIENTE");
    }

    @Test
    void givenNonExistentId_whenUpdate_thenThrowResourceNotFoundException() {
        // Arrange
        EstimateRequest request = new EstimateRequest(1L, 2L, null, BigDecimal.ZERO, BigDecimal.ZERO,
                Collections.emptyList(), Collections.emptyList());
        when(estimateRepository.findWithDetailsById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> estimateService.update(99L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenPendienteEstimate_whenApprove_thenStatusIsAceptado() {
        // Arrange
        Estimate entity = buildEstimate(1L);
        entity.setStatus(EstimateStatus.PENDIENTE);
        EstimateDetailResponse detailResponse = buildDetailResponse(1L);

        when(estimateRepository.findById(1L)).thenReturn(Optional.of(entity));
        when(estimateRepository.save(entity)).thenReturn(entity);
        when(estimateRepository.findWithDetailsById(1L)).thenReturn(Optional.of(entity));
        when(estimateMapper.toDetailResponse(entity)).thenReturn(detailResponse);

        // Act
        EstimateDetailResponse result = estimateService.approve(1L);

        // Assert
        assertThat(entity.getStatus()).isEqualTo(EstimateStatus.ACEPTADO);
        assertThat(result).isNotNull();
    }

    @Test
    void givenNonPendienteEstimate_whenApprove_thenThrowBusinessException() {
        // Arrange
        Estimate entity = buildEstimate(1L);
        entity.setStatus(EstimateStatus.ACEPTADO);
        when(estimateRepository.findById(1L)).thenReturn(Optional.of(entity));

        // Act & Assert
        assertThatThrownBy(() -> estimateService.approve(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("PENDIENTE");
    }

    @Test
    void givenPendienteEstimate_whenReject_thenStatusIsRechazado() {
        // Arrange
        Estimate entity = buildEstimate(1L);
        entity.setStatus(EstimateStatus.PENDIENTE);
        EstimateDetailResponse detailResponse = buildDetailResponse(1L);

        when(estimateRepository.findById(1L)).thenReturn(Optional.of(entity));
        when(estimateRepository.save(entity)).thenReturn(entity);
        when(estimateRepository.findWithDetailsById(1L)).thenReturn(Optional.of(entity));
        when(estimateMapper.toDetailResponse(entity)).thenReturn(detailResponse);

        // Act
        EstimateDetailResponse result = estimateService.reject(1L);

        // Assert
        assertThat(entity.getStatus()).isEqualTo(EstimateStatus.RECHAZADO);
        assertThat(result).isNotNull();
    }

    @Test
    void givenNonPendienteEstimate_whenReject_thenThrowBusinessException() {
        // Arrange
        Estimate entity = buildEstimate(1L);
        entity.setStatus(EstimateStatus.RECHAZADO);
        when(estimateRepository.findById(1L)).thenReturn(Optional.of(entity));

        // Act & Assert
        assertThatThrownBy(() -> estimateService.reject(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("PENDIENTE");
    }

    @Test
    void givenExistingId_whenDelete_thenDeletesSuccessfully() {
        // Arrange
        when(estimateRepository.existsById(1L)).thenReturn(true);

        // Act
        estimateService.delete(1L);

        // Assert
        verify(estimateRepository).deleteById(1L);
    }

    @Test
    void givenNonExistentId_whenDelete_thenThrowResourceNotFoundException() {
        // Arrange
        when(estimateRepository.existsById(99L)).thenReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> estimateService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenServicesAndProducts_whenCalculateTotal_thenReturnCorrectTotal() {
        // Arrange
        List<EstimateServiceItemRequest> services = List.of(
                new EstimateServiceItemRequest("Service A", BigDecimal.valueOf(100)),
                new EstimateServiceItemRequest("Service B", BigDecimal.valueOf(200))
        );
        List<EstimateProductRequest> products = List.of(
                new EstimateProductRequest("Product A", 2, BigDecimal.valueOf(50))
        );

        // Act
        BigDecimal total = estimateService.calculateTotal(services, products, BigDecimal.ZERO, BigDecimal.ZERO);

        // Assert: 100 + 200 + (2*50) = 400
        assertThat(total).isEqualByComparingTo(BigDecimal.valueOf(400));
    }

    @Test
    void givenDiscount_whenCalculateTotal_thenAppliesDiscount() {
        // Arrange
        List<EstimateServiceItemRequest> services = List.of(
                new EstimateServiceItemRequest("Service A", BigDecimal.valueOf(200))
        );

        // Act: subtotal=200, discount=10%=20, afterDiscount=180
        BigDecimal total = estimateService.calculateTotal(services, Collections.emptyList(),
                BigDecimal.valueOf(10), BigDecimal.ZERO);

        // Assert
        assertThat(total).isEqualByComparingTo(BigDecimal.valueOf(180));
    }

    @Test
    void givenTax_whenCalculateTotal_thenAppliesTax() {
        // Arrange
        List<EstimateServiceItemRequest> services = List.of(
                new EstimateServiceItemRequest("Service A", BigDecimal.valueOf(200))
        );

        // Act: subtotal=200, tax=21%=42, total=242
        BigDecimal total = estimateService.calculateTotal(services, Collections.emptyList(),
                BigDecimal.ZERO, BigDecimal.valueOf(21));

        // Assert
        assertThat(total).isEqualByComparingTo(BigDecimal.valueOf(242));
    }

    @Test
    void givenDiscountAndTax_whenCalculateTotal_thenAppliesBoth() {
        // Arrange
        List<EstimateServiceItemRequest> services = List.of(
                new EstimateServiceItemRequest("Service A", BigDecimal.valueOf(1000))
        );

        // Act: subtotal=1000, discount=10%=100, afterDiscount=900, tax=21%=189, total=1089
        BigDecimal total = estimateService.calculateTotal(services, Collections.emptyList(),
                BigDecimal.valueOf(10), BigDecimal.valueOf(21));

        // Assert
        assertThat(total).isEqualByComparingTo(BigDecimal.valueOf(1089));
    }

    @Test
    void givenAceptadoEstimate_whenConvertToInvoiceData_thenReturnData() {
        // Arrange
        Estimate entity = buildEstimate(1L);
        entity.setStatus(EstimateStatus.ACEPTADO);
        EstimateInvoiceDataResponse invoiceData = new EstimateInvoiceDataResponse(
                1L, 1L, 2L, null, Collections.emptyList(), Collections.emptyList(),
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.valueOf(400));

        when(estimateRepository.findWithDetailsById(1L)).thenReturn(Optional.of(entity));
        when(estimateMapper.toInvoiceDataResponse(entity)).thenReturn(invoiceData);

        // Act
        EstimateInvoiceDataResponse result = estimateService.convertToInvoiceData(1L);

        // Assert
        assertThat(result.estimateId()).isEqualTo(1L);
    }

    @Test
    void givenNonAceptadoEstimate_whenConvertToInvoiceData_thenThrowBusinessException() {
        // Arrange
        Estimate entity = buildEstimate(1L);
        entity.setStatus(EstimateStatus.PENDIENTE);
        when(estimateRepository.findWithDetailsById(1L)).thenReturn(Optional.of(entity));

        // Act & Assert
        assertThatThrownBy(() -> estimateService.convertToInvoiceData(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ACEPTADO");
    }

    @Test
    void givenInspectionsWithIssues_whenGetInspectionIssues_thenReturnProblemaAndRevisarItems() {
        // Arrange
        InspectionTemplate template = InspectionTemplate.builder()
                .title("Template A")
                .build();
        template.setId(1L);

        InspectionTemplateGroup group = InspectionTemplateGroup.builder()
                .template(template)
                .title("Group A")
                .sortOrder(0)
                .build();
        group.setId(1L);

        InspectionTemplateItem templateItem1 = InspectionTemplateItem.builder()
                .group(group)
                .name("Brake pads")
                .sortOrder(0)
                .build();
        templateItem1.setId(1L);

        InspectionTemplateItem templateItem2 = InspectionTemplateItem.builder()
                .group(group)
                .name("Oil level")
                .sortOrder(1)
                .build();
        templateItem2.setId(2L);

        InspectionTemplateItem templateItem3 = InspectionTemplateItem.builder()
                .group(group)
                .name("Tires")
                .sortOrder(2)
                .build();
        templateItem3.setId(3L);

        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(2L, client);
        RepairOrder repairOrder = buildRepairOrder(10L, client, vehicle);

        Inspection inspection = Inspection.builder()
                .repairOrder(repairOrder)
                .template(template)
                .build();
        inspection.setId(1L);

        InspectionItem item1 = InspectionItem.builder()
                .inspection(inspection)
                .templateItem(templateItem1)
                .status(InspectionItemStatus.PROBLEMA)
                .comment("Worn out")
                .build();
        item1.setId(1L);

        InspectionItem item2 = InspectionItem.builder()
                .inspection(inspection)
                .templateItem(templateItem2)
                .status(InspectionItemStatus.OK)
                .comment(null)
                .build();
        item2.setId(2L);

        InspectionItem item3 = InspectionItem.builder()
                .inspection(inspection)
                .templateItem(templateItem3)
                .status(InspectionItemStatus.REVISAR)
                .comment("Check soon")
                .build();
        item3.setId(3L);

        Set<InspectionItem> items = new HashSet<>();
        items.add(item1);
        items.add(item2);
        items.add(item3);
        inspection.setItems(items);

        when(inspectionRepository.findByRepairOrderId(10L)).thenReturn(List.of(inspection));

        // Act
        List<InspectionIssueResponse> issues = estimateService.getInspectionIssues(10L);

        // Assert
        assertThat(issues).hasSize(2);
        assertThat(issues).extracting(InspectionIssueResponse::status)
                .containsExactlyInAnyOrder("PROBLEMA", "REVISAR");
    }

    // --- Builder helpers ---

    private Client buildClient(Long id) {
        Client client = Client.builder()
                .firstName("Juan")
                .lastName("Perez")
                .phone("1234567890")
                .clientType(ClientType.PERSONAL)
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

    private RepairOrder buildRepairOrder(Long id, Client client, Vehicle vehicle) {
        RepairOrder order = RepairOrder.builder()
                .title("Test Order")
                .client(client)
                .vehicle(vehicle)
                .status(RepairOrderStatus.INGRESO_VEHICULO)
                .mechanicNotes("Some notes")
                .build();
        order.setId(id);
        return order;
    }

    private Estimate buildEstimate(Long id) {
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(2L, client);
        Estimate estimate = Estimate.builder()
                .client(client)
                .vehicle(vehicle)
                .status(EstimateStatus.PENDIENTE)
                .discountPercentage(BigDecimal.ZERO)
                .taxPercentage(BigDecimal.ZERO)
                .total(BigDecimal.valueOf(400))
                .build();
        estimate.setId(id);
        estimate.setCreatedAt(LocalDateTime.now());
        estimate.setUpdatedAt(LocalDateTime.now());
        return estimate;
    }

    private Estimate buildEstimateWithRepairOrder(Long id, Long repairOrderId) {
        Estimate estimate = buildEstimate(id);
        Client client = estimate.getClient();
        Vehicle vehicle = estimate.getVehicle();
        RepairOrder repairOrder = buildRepairOrder(repairOrderId, client, vehicle);
        estimate.setRepairOrder(repairOrder);
        return estimate;
    }

    private EstimateResponse buildEstimateResponse(Long id) {
        return new EstimateResponse(
                id, 1L, "Juan Perez", 2L, "ABC123", "Corolla", null,
                EstimateStatus.PENDIENTE, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.valueOf(400), LocalDateTime.now(), LocalDateTime.now()
        );
    }

    private EstimateDetailResponse buildDetailResponse(Long id) {
        return new EstimateDetailResponse(
                id, 1L, "Juan Perez", "12345678", "1234567890", null,
                2L, "ABC123", null, "Corolla", 2020, null,
                null, Collections.emptyList(), EstimateStatus.PENDIENTE,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.valueOf(400),
                Collections.emptyList(), Collections.emptyList(),
                LocalDateTime.now(), LocalDateTime.now()
        );
    }

    private EstimateDetailResponse buildDetailResponseWithRepairOrder(Long id, Long repairOrderId) {
        return new EstimateDetailResponse(
                id, 1L, "Juan Perez", "12345678", "1234567890", null,
                2L, "ABC123", null, "Corolla", 2020, repairOrderId,
                "Some notes", Collections.emptyList(), EstimateStatus.PENDIENTE,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.valueOf(400),
                Collections.emptyList(), Collections.emptyList(),
                LocalDateTime.now(), LocalDateTime.now()
        );
    }
}
