package com.autotech.repairorder.service;

import com.autotech.appointment.repository.AppointmentRepository;
import com.autotech.client.model.Client;
import com.autotech.client.model.ClientType;
import com.autotech.client.repository.ClientRepository;
import com.autotech.common.audit.AuditAction;
import com.autotech.common.audit.AuditEntityType;
import com.autotech.common.audit.AuditService;
import com.autotech.common.exception.BusinessException;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.email.service.EmailNotificationService;
import com.autotech.employee.dto.EmployeeMapper;
import com.autotech.employee.model.Employee;
import com.autotech.employee.model.EmployeeStatus;
import com.autotech.employee.repository.EmployeeRepository;
import com.autotech.employee.service.EmployeeService;
import com.autotech.employee.service.EmployeeServiceImpl;
import com.autotech.invoice.model.Invoice;
import com.autotech.invoice.repository.InvoiceRepository;
import com.autotech.repairorder.dto.RepairOrderDetailResponse;
import com.autotech.repairorder.dto.RepairOrderFilter;
import com.autotech.repairorder.dto.RepairOrderMapper;
import com.autotech.repairorder.dto.RepairOrderRequest;
import com.autotech.repairorder.dto.RepairOrderResponse;
import com.autotech.repairorder.dto.StatusUpdateRequest;
import com.autotech.repairorder.dto.TitleUpdateRequest;
import com.autotech.repairorder.model.RepairOrder;
import com.autotech.repairorder.model.RepairOrderStatus;
import com.autotech.repairorder.repository.RepairOrderRepository;
import com.autotech.role.repository.RoleRepository;
import com.autotech.tag.model.Tag;
import com.autotech.tag.repository.TagRepository;
import com.autotech.vehicle.model.Brand;
import com.autotech.vehicle.model.Vehicle;
import com.autotech.vehicle.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RepairOrderServiceImplTest {

    @Mock
    private RepairOrderRepository repairOrderRepository;

    @Mock
    private RepairOrderMapper repairOrderMapper;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private EmployeeMapper employeeMapper;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailNotificationService emailNotificationService;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private AuditService auditService;

    @Captor
    private ArgumentCaptor<Map<String, Object>> oldValuesCaptor;

    @Captor
    private ArgumentCaptor<Map<String, Object>> newValuesCaptor;

    private RepairOrderServiceImpl repairOrderService;

    @BeforeEach
    void setUp() {
        // Real employee service so the inactive-assignment guard (D12) is exercised for real;
        // only its repositories/collaborators are mocked.
        EmployeeService employeeService = new EmployeeServiceImpl(
                employeeRepository, employeeMapper, roleRepository, passwordEncoder,
                emailNotificationService);
        repairOrderService = new RepairOrderServiceImpl(
                repairOrderRepository, repairOrderMapper, clientRepository, vehicleRepository,
                appointmentRepository, employeeRepository, employeeService, tagRepository,
                invoiceRepository, emailNotificationService, auditService);
    }

    @Test
    void givenValidRequest_whenCreate_thenReturnCreatedOrder() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(1L, client);
        RepairOrderRequest request = new RepairOrderRequest(1L, 1L, null, "Engine noise", null, null, null);
        RepairOrder saved = buildRepairOrder(1L, client, vehicle);
        RepairOrderResponse response = buildResponse(1L);

        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        when(repairOrderRepository.save(any(RepairOrder.class))).thenReturn(saved);
        when(repairOrderMapper.toResponse(saved)).thenReturn(response);

        // Act
        RepairOrderResponse result = repairOrderService.create(request);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
        assertThat(saved.getTitle()).isEqualTo("OT-1 Perez - ABC123");
    }

    @Test
    void givenNonExistentClient_whenCreate_thenThrowResourceNotFoundException() {
        // Arrange
        RepairOrderRequest request = new RepairOrderRequest(99L, 1L, null, null, null, null, null);
        when(clientRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> repairOrderService.create(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void givenNonExistentVehicle_whenCreate_thenThrowResourceNotFoundException() {
        // Arrange
        Client client = buildClient(1L);
        RepairOrderRequest request = new RepairOrderRequest(1L, 99L, null, null, null, null, null);
        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(vehicleRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> repairOrderService.create(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void givenVehicleNotBelongingToClient_whenCreate_thenThrowIllegalArgumentException() {
        // Arrange
        Client client1 = buildClient(1L);
        Client client2 = buildClient(2L);
        Vehicle vehicle = buildVehicle(1L, client2);
        RepairOrderRequest request = new RepairOrderRequest(1L, 1L, null, null, null, null, null);

        when(clientRepository.findById(1L)).thenReturn(Optional.of(client1));
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));

        // Act & Assert
        assertThatThrownBy(() -> repairOrderService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("vehículo no pertenece");
    }

    @Test
    void givenValidId_whenGetById_thenReturnDetailWithWorkHistory() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(1L, client);
        RepairOrder order = buildRepairOrder(1L, client, vehicle);
        RepairOrder otherOrder = buildRepairOrder(2L, client, vehicle);
        otherOrder.setTitle("OT-2 Perez - ABC123");

        RepairOrderDetailResponse detailResponse = buildDetailResponse(1L);

        when(repairOrderRepository.findWithDetailsById(1L)).thenReturn(Optional.of(order));
        when(repairOrderMapper.toDetailResponse(order)).thenReturn(detailResponse);
        when(repairOrderRepository.findByVehicleIdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(order, otherOrder));

        // Act
        RepairOrderDetailResponse result = repairOrderService.getById(1L);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.workHistory()).hasSize(2);
    }

    @Test
    void givenNonExistentId_whenGetById_thenThrowResourceNotFoundException() {
        // Arrange
        when(repairOrderRepository.findWithDetailsById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> repairOrderService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void givenValidRequest_whenUpdate_thenReturnUpdatedOrder() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(1L, client);
        RepairOrder existing = buildRepairOrder(1L, client, vehicle);
        RepairOrderRequest request = new RepairOrderRequest(1L, 1L, null, "Updated reason", null, null, null);
        RepairOrderResponse response = buildResponse(1L);

        when(repairOrderRepository.findWithDetailsById(1L)).thenReturn(Optional.of(existing));
        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        when(repairOrderRepository.save(existing)).thenReturn(existing);
        when(repairOrderMapper.toResponse(existing)).thenReturn(response);

        // Act
        RepairOrderResponse result = repairOrderService.update(1L, request);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
        assertThat(existing.getReason()).isEqualTo("Updated reason");
    }

    @Test
    void givenValidId_whenDelete_thenDeleteSuccessfully() {
        // Arrange
        RepairOrder order = buildRepairOrder(1L, buildClient(1L), buildVehicle(1L, buildClient(1L)));
        when(repairOrderRepository.findById(1L)).thenReturn(Optional.of(order));

        // Act
        repairOrderService.delete(1L);

        // Assert
        verify(repairOrderRepository).delete(order);
    }

    @Test
    void givenNonExistentId_whenDelete_thenThrowResourceNotFoundException() {
        // Arrange
        when(repairOrderRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> repairOrderService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenValidStatus_whenUpdateStatus_thenReturnUpdatedOrder() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(1L, client);
        RepairOrder order = buildRepairOrder(1L, client, vehicle);
        StatusUpdateRequest request = new StatusUpdateRequest(RepairOrderStatus.REPARACION);
        RepairOrderResponse response = buildResponse(1L);

        when(repairOrderRepository.findWithDetailsById(1L)).thenReturn(Optional.of(order));
        when(repairOrderRepository.save(order)).thenReturn(order);
        when(repairOrderMapper.toResponse(order)).thenReturn(response);

        // Act
        RepairOrderResponse result = repairOrderService.updateStatus(1L, request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(order.getStatus()).isEqualTo(RepairOrderStatus.REPARACION);
    }

    @Test
    void givenInitialStatus_whenUpdateStatus_thenThrowIllegalArgumentException() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(1L, client);
        RepairOrder order = buildRepairOrder(1L, client, vehicle);
        StatusUpdateRequest request = new StatusUpdateRequest(RepairOrderStatus.INGRESO_VEHICULO);

        when(repairOrderRepository.findWithDetailsById(1L)).thenReturn(Optional.of(order));

        // Act & Assert
        assertThatThrownBy(() -> repairOrderService.updateStatus(1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("estados iniciales");
    }

    @Test
    void givenInitialStatus_whenUpdateStatusToEsperandoAprobacion_thenThrowIllegalArgumentException() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(1L, client);
        RepairOrder order = buildRepairOrder(1L, client, vehicle);
        StatusUpdateRequest request = new StatusUpdateRequest(RepairOrderStatus.ESPERANDO_APROBACION_PRESUPUESTO);

        when(repairOrderRepository.findWithDetailsById(1L)).thenReturn(Optional.of(order));

        // Act & Assert
        assertThatThrownBy(() -> repairOrderService.updateStatus(1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("estados iniciales");
    }

    @Test
    void givenActiveStatus_whenUpdateStatusToCancelado_thenReturnCancelledOrder() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(1L, client);
        RepairOrder order = buildRepairOrder(1L, client, vehicle);
        order.setStatus(RepairOrderStatus.REPARACION);
        StatusUpdateRequest request = new StatusUpdateRequest(RepairOrderStatus.CANCELADO);
        RepairOrderResponse response = buildResponse(1L);

        when(repairOrderRepository.findWithDetailsById(1L)).thenReturn(Optional.of(order));
        when(repairOrderRepository.save(order)).thenReturn(order);
        when(repairOrderMapper.toResponse(order)).thenReturn(response);

        // Act
        RepairOrderResponse result = repairOrderService.updateStatus(1L, request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(order.getStatus()).isEqualTo(RepairOrderStatus.CANCELADO);
    }

    @Test
    void givenCancelledOrder_whenUpdateStatus_thenThrowIllegalArgumentException() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(1L, client);
        RepairOrder order = buildRepairOrder(1L, client, vehicle);
        order.setStatus(RepairOrderStatus.CANCELADO);
        StatusUpdateRequest request = new StatusUpdateRequest(RepairOrderStatus.REPARACION);

        when(repairOrderRepository.findWithDetailsById(1L)).thenReturn(Optional.of(order));

        // Act & Assert
        assertThatThrownBy(() -> repairOrderService.updateStatus(1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("terminal");
    }

    @Test
    void givenDeliveredOrder_whenUpdateStatusToCancelado_thenThrowIllegalArgumentException() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(1L, client);
        RepairOrder order = buildRepairOrder(1L, client, vehicle);
        order.setStatus(RepairOrderStatus.ENTREGADO);
        StatusUpdateRequest request = new StatusUpdateRequest(RepairOrderStatus.CANCELADO);

        when(repairOrderRepository.findWithDetailsById(1L)).thenReturn(Optional.of(order));

        // Act & Assert
        assertThatThrownBy(() -> repairOrderService.updateStatus(1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("entregada");
    }

    @Test
    void givenValidStatusChange_whenUpdateStatus_thenRecordsAuditWithPreviousAndNewStatus() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(1L, client);
        RepairOrder order = buildRepairOrder(1L, client, vehicle);
        order.setStatus(RepairOrderStatus.REPARACION);
        StatusUpdateRequest request = new StatusUpdateRequest(RepairOrderStatus.ENTREGADO);
        RepairOrderResponse response = buildResponse(1L);

        when(repairOrderRepository.findWithDetailsById(1L)).thenReturn(Optional.of(order));
        when(repairOrderRepository.save(order)).thenReturn(order);
        when(repairOrderMapper.toResponse(order)).thenReturn(response);

        // Act
        repairOrderService.updateStatus(1L, request);

        // Assert
        verify(auditService).record(eq(AuditEntityType.REPAIR_ORDER), eq(1L), eq(AuditAction.MODIFIED),
                oldValuesCaptor.capture(), newValuesCaptor.capture());
        assertThat(oldValuesCaptor.getValue()).containsEntry("status", "REPARACION");
        assertThat(newValuesCaptor.getValue()).containsEntry("status", "ENTREGADO");
    }

    @Test
    void givenRejectedStatusChange_whenUpdateStatus_thenNoAuditRecorded() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(1L, client);
        RepairOrder order = buildRepairOrder(1L, client, vehicle);
        order.setStatus(RepairOrderStatus.CANCELADO);
        StatusUpdateRequest request = new StatusUpdateRequest(RepairOrderStatus.REPARACION);

        when(repairOrderRepository.findWithDetailsById(1L)).thenReturn(Optional.of(order));

        // Act & Assert
        assertThatThrownBy(() -> repairOrderService.updateStatus(1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("terminal");
        verifyNoInteractions(auditService);
    }

    @Test
    void givenValidTitle_whenUpdateTitle_thenReturnUpdatedOrder() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(1L, client);
        RepairOrder order = buildRepairOrder(1L, client, vehicle);
        TitleUpdateRequest request = new TitleUpdateRequest("New Title");
        RepairOrderResponse response = buildResponse(1L);

        when(repairOrderRepository.findWithDetailsById(1L)).thenReturn(Optional.of(order));
        when(repairOrderRepository.save(order)).thenReturn(order);
        when(repairOrderMapper.toResponse(order)).thenReturn(response);

        // Act
        RepairOrderResponse result = repairOrderService.updateTitle(1L, request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(order.getTitle()).isEqualTo("New Title");
    }

    @Test
    void givenEmployeeIds_whenAssignEmployees_thenReturnOrderWithEmployees() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(1L, client);
        RepairOrder order = buildRepairOrder(1L, client, vehicle);
        Employee employee = buildEmployee(1L);
        RepairOrderResponse response = buildResponse(1L);

        when(repairOrderRepository.findWithDetailsById(1L)).thenReturn(Optional.of(order));
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(repairOrderRepository.save(order)).thenReturn(order);
        when(repairOrderMapper.toResponse(order)).thenReturn(response);

        // Act
        RepairOrderResponse result = repairOrderService.assignEmployees(1L, List.of(1L));

        // Assert
        assertThat(result).isNotNull();
        assertThat(order.getEmployees()).contains(employee);
    }

    @Test
    void givenInactiveEmployee_whenCreate_thenThrowBusinessException() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(1L, client);
        Employee inactive = buildEmployee(2L);
        inactive.setStatus(EmployeeStatus.INACTIVO);
        RepairOrderRequest request = new RepairOrderRequest(1L, 1L, null, "Reason", null, List.of(2L), null);

        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        when(repairOrderRepository.save(any(RepairOrder.class))).thenAnswer(inv -> inv.getArgument(0));
        when(employeeRepository.findById(2L)).thenReturn(Optional.of(inactive));

        // Act & Assert
        assertThatThrownBy(() -> repairOrderService.create(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("inactivo")
                .hasMessageContaining("Carlos");
    }

    @Test
    void givenInactiveEmployeeNotAssigned_whenUpdate_thenThrowBusinessException() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(1L, client);
        RepairOrder existing = buildRepairOrder(1L, client, vehicle);
        Employee inactive = buildEmployee(2L);
        inactive.setStatus(EmployeeStatus.INACTIVO);
        RepairOrderRequest request = new RepairOrderRequest(1L, 1L, null, "Reason", null, List.of(2L), null);

        when(repairOrderRepository.findWithDetailsById(1L)).thenReturn(Optional.of(existing));
        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        when(employeeRepository.findById(2L)).thenReturn(Optional.of(inactive));

        // Act & Assert
        assertThatThrownBy(() -> repairOrderService.update(1L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("inactivo")
                .hasMessageContaining("Carlos");
    }

    @Test
    void givenInactiveEmployeeNotAssigned_whenAssignEmployees_thenThrowBusinessException() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(1L, client);
        RepairOrder order = buildRepairOrder(1L, client, vehicle);
        Employee inactive = buildEmployee(2L);
        inactive.setStatus(EmployeeStatus.INACTIVO);

        when(repairOrderRepository.findWithDetailsById(1L)).thenReturn(Optional.of(order));
        when(employeeRepository.findById(2L)).thenReturn(Optional.of(inactive));

        // Act & Assert
        assertThatThrownBy(() -> repairOrderService.assignEmployees(1L, List.of(2L)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("inactivo")
                .hasMessageContaining("Carlos");
    }

    @Test
    void givenAlreadyAssignedInactiveEmployee_whenUpdate_thenKeepsInactiveAssignment() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(1L, client);
        RepairOrder existing = buildRepairOrder(1L, client, vehicle);
        Employee inactive = buildEmployee(2L);
        inactive.setStatus(EmployeeStatus.INACTIVO);
        Employee active = buildEmployee(3L);
        existing.setEmployees(new HashSet<>(Set.of(inactive)));
        RepairOrderRequest request = new RepairOrderRequest(1L, 1L, null, "Reason", null, List.of(2L, 3L), null);
        RepairOrderResponse response = buildResponse(1L);

        when(repairOrderRepository.findWithDetailsById(1L)).thenReturn(Optional.of(existing));
        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        when(employeeRepository.findById(2L)).thenReturn(Optional.of(inactive));
        when(employeeRepository.findById(3L)).thenReturn(Optional.of(active));
        when(repairOrderRepository.save(existing)).thenReturn(existing);
        when(repairOrderMapper.toResponse(existing)).thenReturn(response);

        // Act
        RepairOrderResponse result = repairOrderService.update(1L, request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(existing.getEmployees()).contains(inactive, active);
    }

    @Test
    void givenNonExistentEmployee_whenAssignEmployees_thenThrowResourceNotFoundException() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(1L, client);
        RepairOrder order = buildRepairOrder(1L, client, vehicle);

        when(repairOrderRepository.findWithDetailsById(1L)).thenReturn(Optional.of(order));
        when(employeeRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> repairOrderService.assignEmployees(1L, List.of(99L)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void givenTagIds_whenAssignTags_thenReturnOrderWithTags() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(1L, client);
        RepairOrder order = buildRepairOrder(1L, client, vehicle);
        Tag tag = buildTag(1L);
        RepairOrderResponse response = buildResponse(1L);

        when(repairOrderRepository.findWithDetailsById(1L)).thenReturn(Optional.of(order));
        when(tagRepository.findById(1L)).thenReturn(Optional.of(tag));
        when(repairOrderRepository.save(order)).thenReturn(order);
        when(repairOrderMapper.toResponse(order)).thenReturn(response);

        // Act
        RepairOrderResponse result = repairOrderService.assignTags(1L, List.of(1L));

        // Assert
        assertThat(result).isNotNull();
        assertThat(order.getTags()).contains(tag);
    }

    @Test
    void givenFilter_whenSearch_thenReturnPagedResponses() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(1L, client);
        RepairOrder order = buildRepairOrder(1L, client, vehicle);
        RepairOrderResponse response = buildResponse(1L);
        RepairOrderFilter filter = new RepairOrderFilter(
                List.of(RepairOrderStatus.REPARACION), null, null, null, null, "Perez", null, null);
        Pageable pageable = PageRequest.of(0, 20);

        when(repairOrderRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(order), pageable, 1));
        when(repairOrderRepository.findAllByIdIn(List.of(1L))).thenReturn(List.of(order));
        when(repairOrderMapper.toResponse(order)).thenReturn(response);

        // Act
        Page<RepairOrderResponse> result = repairOrderService.search(filter, pageable);

        // Assert
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).title()).isEqualTo(response.title());
    }

    @Test
    void givenFilterMatchingNothing_whenSearch_thenReturnEmptyPage() {
        // Arrange
        RepairOrderFilter filter = new RepairOrderFilter(null, null, null, null, null, null, null, null);
        Pageable pageable = PageRequest.of(0, 20);

        when(repairOrderRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));

        // Act
        Page<RepairOrderResponse> result = repairOrderService.search(filter, pageable);

        // Assert
        assertThat(result.getTotalElements()).isZero();
        assertThat(result.getContent()).isEmpty();
    }

    @Test
    void givenEntregadoRepairOrder_whenValidateOpenForNewDocuments_thenThrowBusinessException() {
        // Arrange
        RepairOrder order = buildRepairOrder(1L, buildClient(1L), buildVehicle(1L, buildClient(1L)));
        order.setStatus(RepairOrderStatus.ENTREGADO);

        // Act & Assert
        assertThatThrownBy(() -> repairOrderService.validateOpenForNewDocuments(order))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("cerrada")
                .hasMessageContaining("ENTREGADO");
    }

    @Test
    void givenCanceladoRepairOrder_whenValidateOpenForNewDocuments_thenThrowBusinessException() {
        // Arrange
        RepairOrder order = buildRepairOrder(1L, buildClient(1L), buildVehicle(1L, buildClient(1L)));
        order.setStatus(RepairOrderStatus.CANCELADO);

        // Act & Assert
        assertThatThrownBy(() -> repairOrderService.validateOpenForNewDocuments(order))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("cerrada")
                .hasMessageContaining("CANCELADO");
    }

    @Test
    void givenRepairOrderWithInvoice_whenValidateOpenForNewDocuments_thenThrowBusinessException() {
        // Arrange
        RepairOrder order = buildRepairOrder(1L, buildClient(1L), buildVehicle(1L, buildClient(1L)));
        when(invoiceRepository.findByRepairOrderId(1L)).thenReturn(Optional.of(Invoice.builder().build()));

        // Act & Assert
        assertThatThrownBy(() -> repairOrderService.validateOpenForNewDocuments(order))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("factura");
    }

    @Test
    void givenOpenRepairOrderWithoutInvoice_whenValidateOpenForNewDocuments_thenDoesNotThrow() {
        // Arrange
        RepairOrder order = buildRepairOrder(1L, buildClient(1L), buildVehicle(1L, buildClient(1L)));
        when(invoiceRepository.findByRepairOrderId(1L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatCode(() -> repairOrderService.validateOpenForNewDocuments(order))
                .doesNotThrowAnyException();
    }

    @Test
    void givenNullRepairOrder_whenValidateOpenForNewDocuments_thenDoesNotThrow() {
        // Act & Assert
        assertThatCode(() -> repairOrderService.validateOpenForNewDocuments(null))
                .doesNotThrowAnyException();
        verifyNoInteractions(invoiceRepository);
    }

    @Test
    void givenEntregadoRepairOrder_whenValidateNotClosedByStatus_thenThrowBusinessException() {
        // Arrange
        RepairOrder order = buildRepairOrder(1L, buildClient(1L), buildVehicle(1L, buildClient(1L)));
        order.setStatus(RepairOrderStatus.ENTREGADO);

        // Act & Assert
        assertThatThrownBy(() -> repairOrderService.validateNotClosedByStatus(order))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("cerrada");
    }

    @Test
    void givenOpenRepairOrder_whenValidateNotClosedByStatus_thenDoesNotThrowAndDoesNotQueryInvoices() {
        // Arrange
        RepairOrder order = buildRepairOrder(1L, buildClient(1L), buildVehicle(1L, buildClient(1L)));

        // Act & Assert
        assertThatCode(() -> repairOrderService.validateNotClosedByStatus(order))
                .doesNotThrowAnyException();
        verifyNoInteractions(invoiceRepository);
    }

    // --- Helpers ---

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
        Brand brand = Brand.builder().name("Toyota").build();
        brand.setId(1L);
        Vehicle vehicle = Vehicle.builder()
                .client(client)
                .plate("ABC123")
                .brand(brand)
                .model("Corolla")
                .year(2020)
                .build();
        vehicle.setId(id);
        return vehicle;
    }

    private Employee buildEmployee(Long id) {
        Employee employee = Employee.builder()
                .firstName("Carlos")
                .lastName("Lopez")
                .dni("99887766")
                .phone("5551234")
                .build();
        employee.setId(id);
        return employee;
    }

    private Tag buildTag(Long id) {
        Tag tag = Tag.builder()
                .name("Urgente")
                .color("#FF0000")
                .build();
        tag.setId(id);
        return tag;
    }

    private RepairOrder buildRepairOrder(Long id, Client client, Vehicle vehicle) {
        RepairOrder order = RepairOrder.builder()
                .title("OT-" + id + " Perez - ABC123")
                .client(client)
                .vehicle(vehicle)
                .reason("Engine noise")
                .status(RepairOrderStatus.INGRESO_VEHICULO)
                .build();
        order.setId(id);
        return order;
    }

    private RepairOrderResponse buildResponse(Long id) {
        return new RepairOrderResponse(
                id, "OT-" + id + " Perez - ABC123", RepairOrderStatus.INGRESO_VEHICULO,
                1L, "Juan", "Perez", "1234567890",
                1L, "ABC123", "Toyota", "Corolla", 2020,
                List.of(), List.of(),
                LocalDateTime.now(), LocalDateTime.now()
        );
    }

    private RepairOrderDetailResponse buildDetailResponse(Long id) {
        return new RepairOrderDetailResponse(
                id, "OT-" + id + " Perez - ABC123", RepairOrderStatus.INGRESO_VEHICULO,
                "Engine noise", null, null, null,
                1L, "Juan", "Perez", null, "1234567890", null,
                1L, "ABC123", "Toyota", "Corolla", 2020, null,
                List.of(), List.of(), null,
                LocalDateTime.now(), LocalDateTime.now()
        );
    }
}
