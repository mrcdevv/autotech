package com.autotech.appointment.service;

import com.autotech.appointment.dto.AppointmentMapper;
import com.autotech.appointment.dto.AppointmentRequest;
import com.autotech.appointment.dto.AppointmentResponse;
import com.autotech.appointment.dto.AppointmentUpdateRequest;
import com.autotech.appointment.dto.PublicAppointmentResponse;
import com.autotech.appointment.model.Appointment;
import com.autotech.appointment.model.AppointmentConfirmationStatus;
import com.autotech.appointment.model.AppointmentStatus;
import com.autotech.appointment.model.VehicleDeliveryMethod;
import com.autotech.appointment.repository.AppointmentRepository;
import com.autotech.client.model.Client;
import com.autotech.client.model.ClientType;
import com.autotech.client.repository.ClientRepository;
import com.autotech.common.exception.BusinessException;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.config.AppProperties;
import com.autotech.email.service.EmailNotificationService;
import com.autotech.employee.model.Employee;
import com.autotech.employee.repository.EmployeeRepository;
import com.autotech.tag.model.Tag;
import com.autotech.tag.repository.TagRepository;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceImplTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private AppointmentMapper appointmentMapper;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private EmailNotificationService emailNotificationService;

    @Mock
    private AppProperties appProperties;

    @InjectMocks
    private AppointmentServiceImpl appointmentService;

    private final Pageable pageable = PageRequest.of(0, 12);

    private final LocalDateTime startTime = LocalDateTime.of(2025, 3, 15, 10, 0);
    private final LocalDateTime endTime = LocalDateTime.of(2025, 3, 15, 11, 0);

    @Test
    void givenAppointments_whenGetAll_thenReturnPagedResponse() {
        // Arrange
        Appointment entity = buildAppointment(1L);
        AppointmentResponse response = buildResponse(1L);
        Page<Appointment> entityPage = new PageImpl<>(List.of(entity));
        when(appointmentRepository.findAll(pageable)).thenReturn(entityPage);
        when(appointmentMapper.toResponse(entity)).thenReturn(response);

        // Act
        Page<AppointmentResponse> result = appointmentService.getAll(pageable);

        // Assert
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().id()).isEqualTo(1L);
    }

    @Test
    void givenExistingId_whenGetById_thenReturnResponse() {
        // Arrange
        Appointment entity = buildAppointment(1L);
        AppointmentResponse response = buildResponse(1L);
        when(appointmentRepository.findWithDetailsById(1L)).thenReturn(Optional.of(entity));
        when(appointmentMapper.toResponse(entity)).thenReturn(response);

        // Act
        AppointmentResponse result = appointmentService.getById(1L);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void givenNonExistingId_whenGetById_thenThrowResourceNotFoundException() {
        // Arrange
        when(appointmentRepository.findWithDetailsById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> appointmentService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void givenValidRequest_whenCreate_thenReturnResponse() {
        // Arrange
        AppointmentRequest request = new AppointmentRequest(
                "Test", null, null, "Purpose", startTime, endTime, null, null, null, null);
        Appointment entity = buildAppointment(null);
        Appointment saved = buildAppointment(1L);
        AppointmentResponse response = buildResponse(1L);

        when(appointmentMapper.toEntity(request)).thenReturn(entity);
        when(appointmentRepository.save(entity)).thenReturn(saved);
        when(appointmentMapper.toResponse(saved)).thenReturn(response);

        // Act
        AppointmentResponse result = appointmentService.create(request);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void givenRequestWithClientAndVehicle_whenCreate_thenResolvesRelations() {
        // Arrange
        Client client = buildClient(1L);
        Vehicle vehicle = buildVehicle(1L, client);
        AppointmentRequest request = new AppointmentRequest(
                "Test", 1L, 1L, null, startTime, endTime, VehicleDeliveryMethod.PROPIO, null, null, null);
        Appointment entity = buildAppointment(null);
        Appointment saved = buildAppointment(1L);
        AppointmentResponse response = buildResponse(1L);

        when(appointmentMapper.toEntity(request)).thenReturn(entity);
        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        when(appointmentRepository.save(entity)).thenReturn(saved);
        when(appointmentMapper.toResponse(saved)).thenReturn(response);

        // Act
        AppointmentResponse result = appointmentService.create(request);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
        assertThat(entity.getClient()).isEqualTo(client);
        assertThat(entity.getVehicle()).isEqualTo(vehicle);
    }

    @Test
    void givenVehicleNotBelongingToClient_whenCreate_thenThrowBusinessException() {
        // Arrange
        Client client1 = buildClient(1L);
        Client client2 = buildClient(2L);
        Vehicle vehicle = buildVehicle(1L, client2);
        AppointmentRequest request = new AppointmentRequest(
                "Test", 1L, 1L, null, startTime, endTime, null, null, null, null);
        Appointment entity = buildAppointment(null);

        when(appointmentMapper.toEntity(request)).thenReturn(entity);
        when(clientRepository.findById(1L)).thenReturn(Optional.of(client1));
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));

        // Act & Assert
        assertThatThrownBy(() -> appointmentService.create(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("vehículo no pertenece");
    }

    @Test
    void givenStartAfterEnd_whenCreate_thenThrowBusinessException() {
        // Arrange
        AppointmentRequest request = new AppointmentRequest(
                "Test", null, null, null, endTime, startTime, null, null, null, null);

        // Act & Assert
        assertThatThrownBy(() -> appointmentService.create(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("hora de inicio");
    }

    @Test
    void givenRequestWithEmployeesAndTags_whenCreate_thenResolvesRelations() {
        // Arrange
        Employee emp = buildEmployee(1L);
        Tag tag = buildTag(1L);
        AppointmentRequest request = new AppointmentRequest(
                "Test", null, null, null, startTime, endTime, null, List.of(1L), List.of(1L), null);
        Appointment entity = buildAppointment(null);
        Appointment saved = buildAppointment(1L);
        AppointmentResponse response = buildResponse(1L);

        when(appointmentMapper.toEntity(request)).thenReturn(entity);
        when(employeeRepository.findAllById(List.of(1L))).thenReturn(List.of(emp));
        when(tagRepository.findAllById(List.of(1L))).thenReturn(List.of(tag));
        when(appointmentRepository.save(entity)).thenReturn(saved);
        when(appointmentMapper.toResponse(saved)).thenReturn(response);

        // Act
        AppointmentResponse result = appointmentService.create(request);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
        assertThat(entity.getEmployees()).containsExactly(emp);
        assertThat(entity.getTags()).containsExactly(tag);
    }

    @Test
    void givenNonExistentEmployee_whenCreate_thenThrowException() {
        // Arrange
        AppointmentRequest request = new AppointmentRequest(
                "Test", null, null, null, startTime, endTime, null, List.of(99L), null, null);
        Appointment entity = buildAppointment(null);

        when(appointmentMapper.toEntity(request)).thenReturn(entity);
        when(employeeRepository.findAllById(List.of(99L))).thenReturn(List.of());

        // Act & Assert
        assertThatThrownBy(() -> appointmentService.create(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("empleados");
    }

    @Test
    void givenNonExistentTag_whenCreate_thenThrowException() {
        // Arrange
        AppointmentRequest request = new AppointmentRequest(
                "Test", null, null, null, startTime, endTime, null, null, List.of(99L), null);
        Appointment entity = buildAppointment(null);

        when(appointmentMapper.toEntity(request)).thenReturn(entity);
        when(tagRepository.findAllById(List.of(99L))).thenReturn(List.of());

        // Act & Assert
        assertThatThrownBy(() -> appointmentService.create(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("etiquetas");
    }

    @Test
    void givenExistingId_whenUpdate_thenUpdateOnlyDateTime() {
        // Arrange
        LocalDateTime newStart = LocalDateTime.of(2025, 3, 16, 14, 0);
        LocalDateTime newEnd = LocalDateTime.of(2025, 3, 16, 15, 0);
        AppointmentUpdateRequest request = new AppointmentUpdateRequest(newStart, newEnd, null);
        Appointment entity = buildAppointment(1L);
        Appointment saved = buildAppointment(1L);
        saved.setStartTime(newStart);
        saved.setEndTime(newEnd);
        AppointmentResponse response = buildResponse(1L);

        when(appointmentRepository.findWithDetailsById(1L)).thenReturn(Optional.of(entity));
        when(appointmentRepository.save(entity)).thenReturn(saved);
        when(appointmentMapper.toResponse(saved)).thenReturn(response);

        // Act
        AppointmentResponse result = appointmentService.update(1L, request);

        // Assert
        assertThat(entity.getStartTime()).isEqualTo(newStart);
        assertThat(entity.getEndTime()).isEqualTo(newEnd);
    }

    @Test
    void givenNonExistingId_whenUpdate_thenThrowResourceNotFoundException() {
        // Arrange
        AppointmentUpdateRequest request = new AppointmentUpdateRequest(startTime, endTime, null);
        when(appointmentRepository.findWithDetailsById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> appointmentService.update(99L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void givenExistingId_whenDelete_thenDeleteSuccessfully() {
        // Arrange
        when(appointmentRepository.existsById(1L)).thenReturn(true);

        // Act
        appointmentService.delete(1L);

        // Assert
        verify(appointmentRepository).deleteById(1L);
    }

    @Test
    void givenNonExistingId_whenDelete_thenThrowResourceNotFoundException() {
        // Arrange
        when(appointmentRepository.existsById(99L)).thenReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> appointmentService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenAppointment_whenMarkClientArrivedTrue_thenSetsTrue() {
        // Arrange
        Appointment entity = buildAppointment(1L);
        entity.setClientArrived(false);
        Appointment saved = buildAppointment(1L);
        saved.setClientArrived(true);
        AppointmentResponse response = buildResponse(1L);

        when(appointmentRepository.findWithDetailsById(1L)).thenReturn(Optional.of(entity));
        when(appointmentRepository.save(entity)).thenReturn(saved);
        when(appointmentMapper.toResponse(saved)).thenReturn(response);

        // Act
        appointmentService.markClientArrived(1L, true);

        // Assert
        assertThat(entity.getClientArrived()).isTrue();
    }

    @Test
    void givenAppointment_whenMarkClientArrivedFalse_thenSetsFalse() {
        // Arrange
        Appointment entity = buildAppointment(1L);
        entity.setClientArrived(true);
        Appointment saved = buildAppointment(1L);
        saved.setClientArrived(false);
        AppointmentResponse response = buildResponse(1L);

        when(appointmentRepository.findWithDetailsById(1L)).thenReturn(Optional.of(entity));
        when(appointmentRepository.save(entity)).thenReturn(saved);
        when(appointmentMapper.toResponse(saved)).thenReturn(response);

        // Act
        appointmentService.markClientArrived(1L, false);

        // Assert
        assertThat(entity.getClientArrived()).isFalse();
    }

    @Test
    void givenAppointment_whenMarkVehicleArrived_thenSetsTimestamp() {
        // Arrange
        Appointment entity = buildAppointment(1L);
        Appointment saved = buildAppointment(1L);
        AppointmentResponse response = buildResponse(1L);

        when(appointmentRepository.findWithDetailsById(1L)).thenReturn(Optional.of(entity));
        when(appointmentRepository.save(entity)).thenReturn(saved);
        when(appointmentMapper.toResponse(saved)).thenReturn(response);

        // Act
        appointmentService.markVehicleArrived(1L);

        // Assert
        assertThat(entity.getVehicleArrivedAt()).isNotNull();
    }

    @Test
    void givenAppointment_whenMarkVehiclePickedUp_thenSetsTimestamp() {
        // Arrange
        Appointment entity = buildAppointment(1L);
        Appointment saved = buildAppointment(1L);
        AppointmentResponse response = buildResponse(1L);

        when(appointmentRepository.findWithDetailsById(1L)).thenReturn(Optional.of(entity));
        when(appointmentRepository.save(entity)).thenReturn(saved);
        when(appointmentMapper.toResponse(saved)).thenReturn(response);

        // Act
        appointmentService.markVehiclePickedUp(1L);

        // Assert
        assertThat(entity.getVehiclePickedUpAt()).isNotNull();
    }

    @Test
    void givenDateRange_whenGetByDateRange_thenReturnFilteredList() {
        // Arrange
        Appointment entity = buildAppointment(1L);
        AppointmentResponse response = buildResponse(1L);
        when(appointmentRepository.findByDateRange(startTime, endTime)).thenReturn(List.of(entity));
        when(appointmentMapper.toResponse(entity)).thenReturn(response);

        // Act
        List<AppointmentResponse> result = appointmentService.getByDateRange(startTime, endTime);

        // Assert
        assertThat(result).hasSize(1);
    }

    @Test
    void givenEmployeeAndDateRange_whenGetByEmployeeAndDateRange_thenReturnFilteredList() {
        // Arrange
        Appointment entity = buildAppointment(1L);
        AppointmentResponse response = buildResponse(1L);
        when(appointmentRepository.findByEmployeeAndDateRange(1L, startTime, endTime)).thenReturn(List.of(entity));
        when(appointmentMapper.toResponse(entity)).thenReturn(response);

        // Act
        List<AppointmentResponse> result = appointmentService.getByEmployeeAndDateRange(1L, startTime, endTime);

        // Assert
        assertThat(result).hasSize(1);
    }

    // --- Helpers ---

    // --- Client notifications (notifyClient flag) ---

    @Test
    void givenNotifyClientTrue_whenCreate_thenSendScheduledEmail() {
        // Arrange
        AppointmentRequest request = new AppointmentRequest(
                "Test", null, null, "Purpose", startTime, endTime, null, null, null, true);
        Appointment entity = buildAppointment(null);
        Appointment saved = buildAppointment(1L);
        when(appointmentMapper.toEntity(request)).thenReturn(entity);
        when(appointmentRepository.save(entity)).thenReturn(saved);

        // Act
        appointmentService.create(request);

        // Assert
        verify(emailNotificationService).notifyAppointmentScheduled(saved);
    }

    @Test
    void givenNotifyClientFalse_whenCreate_thenDoNotSendEmail() {
        // Arrange
        AppointmentRequest request = new AppointmentRequest(
                "Test", null, null, "Purpose", startTime, endTime, null, null, null, false);
        Appointment entity = buildAppointment(null);
        when(appointmentMapper.toEntity(request)).thenReturn(entity);
        when(appointmentRepository.save(entity)).thenReturn(buildAppointment(1L));

        // Act
        appointmentService.create(request);

        // Assert
        verify(emailNotificationService, never()).notifyAppointmentScheduled(any());
    }

    @Test
    void givenNewTimesAndNotifyClient_whenUpdate_thenResetConfirmationAndSendRescheduledEmail() {
        // Arrange
        LocalDateTime newStart = startTime.plusDays(1);
        LocalDateTime newEnd = endTime.plusDays(1);
        Appointment entity = buildAppointment(1L);
        entity.setConfirmationStatus(AppointmentConfirmationStatus.CONFIRMED);
        entity.setConfirmedAt(LocalDateTime.now());
        when(appointmentRepository.findWithDetailsById(1L)).thenReturn(Optional.of(entity));
        when(appointmentRepository.save(entity)).thenReturn(entity);

        // Act
        appointmentService.update(1L, new AppointmentUpdateRequest(newStart, newEnd, true));

        // Assert
        assertThat(entity.getConfirmationStatus()).isEqualTo(AppointmentConfirmationStatus.PENDING);
        assertThat(entity.getConfirmedAt()).isNull();
        verify(emailNotificationService).notifyAppointmentRescheduled(entity, startTime, endTime);
    }

    @Test
    void givenSameTimes_whenUpdate_thenKeepConfirmationAndDoNotSendEmail() {
        // Arrange
        Appointment entity = buildAppointment(1L);
        entity.setConfirmationStatus(AppointmentConfirmationStatus.CONFIRMED);
        when(appointmentRepository.findWithDetailsById(1L)).thenReturn(Optional.of(entity));
        when(appointmentRepository.save(entity)).thenReturn(entity);

        // Act
        appointmentService.update(1L, new AppointmentUpdateRequest(startTime, endTime, true));

        // Assert
        assertThat(entity.getConfirmationStatus()).isEqualTo(AppointmentConfirmationStatus.CONFIRMED);
        verify(emailNotificationService, never()).notifyAppointmentRescheduled(any(), any(), any());
    }

    @Test
    void givenNotifyClient_whenCancel_thenSendCancelledEmail() {
        // Arrange
        Appointment entity = buildAppointment(1L);
        when(appointmentRepository.findWithDetailsById(1L)).thenReturn(Optional.of(entity));
        when(appointmentRepository.save(entity)).thenReturn(entity);

        // Act
        appointmentService.cancel(1L, true);

        // Assert
        assertThat(entity.getStatus()).isEqualTo(AppointmentStatus.CANCELLED);
        verify(emailNotificationService).notifyAppointmentCancelled(entity);
    }

    @Test
    void givenNotifyClientFalse_whenCancel_thenDoNotSendEmail() {
        // Arrange
        Appointment entity = buildAppointment(1L);
        when(appointmentRepository.findWithDetailsById(1L)).thenReturn(Optional.of(entity));
        when(appointmentRepository.save(entity)).thenReturn(entity);

        // Act
        appointmentService.cancel(1L, false);

        // Assert
        verify(emailNotificationService, never()).notifyAppointmentCancelled(any());
    }

    // --- Public confirmation link ---

    @Test
    void givenFutureAppointment_whenConfirmByToken_thenMarkConfirmed() {
        // Arrange
        Appointment entity = buildAppointment(1L);
        when(appointmentRepository.findByConfirmationToken("tok")).thenReturn(Optional.of(entity));
        when(appProperties.workshopNow()).thenReturn(startTime.minusDays(1));

        // Act
        PublicAppointmentResponse result = appointmentService.confirmByToken("tok");

        // Assert
        assertThat(entity.getConfirmationStatus()).isEqualTo(AppointmentConfirmationStatus.CONFIRMED);
        assertThat(entity.getConfirmedAt()).isNotNull();
        assertThat(result.confirmationStatus()).isEqualTo(AppointmentConfirmationStatus.CONFIRMED);
        assertThat(result.canRespond()).isTrue();
    }

    @Test
    void givenFutureAppointment_whenDeclineByToken_thenMarkDeclined() {
        // Arrange
        Appointment entity = buildAppointment(1L);
        entity.setConfirmationStatus(AppointmentConfirmationStatus.CONFIRMED);
        when(appointmentRepository.findByConfirmationToken("tok")).thenReturn(Optional.of(entity));
        when(appProperties.workshopNow()).thenReturn(startTime.minusHours(2));

        // Act
        appointmentService.declineByToken("tok");

        // Assert
        assertThat(entity.getConfirmationStatus()).isEqualTo(AppointmentConfirmationStatus.DECLINED);
        assertThat(entity.getConfirmedAt()).isNull();
    }

    @Test
    void givenPastAppointment_whenConfirmByToken_thenThrowBusinessException() {
        // Arrange
        Appointment entity = buildAppointment(1L);
        when(appointmentRepository.findByConfirmationToken("tok")).thenReturn(Optional.of(entity));
        when(appProperties.workshopNow()).thenReturn(startTime.plusMinutes(1));

        // Act & Assert
        assertThatThrownBy(() -> appointmentService.confirmByToken("tok"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ya pasó");
    }

    @Test
    void givenCancelledAppointment_whenConfirmByToken_thenThrowBusinessException() {
        // Arrange
        Appointment entity = buildAppointment(1L);
        entity.setStatus(AppointmentStatus.CANCELLED);
        when(appointmentRepository.findByConfirmationToken("tok")).thenReturn(Optional.of(entity));

        // Act & Assert
        assertThatThrownBy(() -> appointmentService.confirmByToken("tok"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("cancelado");
    }

    @Test
    void givenUnknownToken_whenGetByConfirmationToken_thenThrowResourceNotFoundException() {
        // Arrange
        when(appointmentRepository.findByConfirmationToken("nope")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> appointmentService.getByConfirmationToken("nope"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenNewAppointment_whenBuilt_thenHasRandomConfirmationToken() {
        // Act
        Appointment first = buildAppointment(null);
        Appointment second = buildAppointment(null);

        // Assert
        assertThat(first.getConfirmationToken()).hasSize(43).isNotEqualTo(second.getConfirmationToken());
        assertThat(first.getConfirmationStatus()).isEqualTo(AppointmentConfirmationStatus.PENDING);
    }

    private Appointment buildAppointment(Long id) {
        Appointment appointment = Appointment.builder()
                .title("Test Appointment")
                .purpose("Test purpose")
                .startTime(startTime)
                .endTime(endTime)
                .build();
        if (id != null) appointment.setId(id);
        return appointment;
    }

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

    private AppointmentResponse buildResponse(Long id) {
        return new AppointmentResponse(
                id, "Test Appointment", null, null, null, null, null, null, null,
                "Test purpose", startTime, endTime, null, AppointmentStatus.SCHEDULED, null, null, false,
                AppointmentConfirmationStatus.PENDING, null,
                List.of(), List.of(), null, null
        );
    }
}
