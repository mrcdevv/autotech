package com.autotech.appointment.service;

import com.autotech.appointment.dto.AppointmentMapper;
import com.autotech.appointment.dto.AppointmentRequest;
import com.autotech.appointment.dto.AppointmentResponse;
import com.autotech.appointment.dto.AppointmentUpdateRequest;
import com.autotech.appointment.dto.PublicAppointmentResponse;
import com.autotech.appointment.model.Appointment;
import com.autotech.appointment.model.AppointmentConfirmationStatus;
import com.autotech.appointment.model.AppointmentStatus;
import com.autotech.appointment.repository.AppointmentRepository;
import com.autotech.client.model.Client;
import com.autotech.client.repository.ClientRepository;
import com.autotech.common.exception.BusinessException;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.config.AppProperties;
import com.autotech.email.service.EmailFormats;
import com.autotech.email.service.EmailNotificationService;
import com.autotech.employee.model.Employee;
import com.autotech.employee.repository.EmployeeRepository;
import com.autotech.tag.model.Tag;
import com.autotech.tag.repository.TagRepository;
import com.autotech.vehicle.model.Vehicle;
import com.autotech.vehicle.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentMapper appointmentMapper;
    private final ClientRepository clientRepository;
    private final VehicleRepository vehicleRepository;
    private final EmployeeRepository employeeRepository;
    private final TagRepository tagRepository;
    private final EmailNotificationService emailNotificationService;
    private final AppProperties appProperties;

    @Override
    @Transactional(readOnly = true)
    public Page<AppointmentResponse> getAll(Pageable pageable) {
        log.debug("Fetching all appointments, page: {}", pageable);
        return appointmentRepository.findAll(pageable)
                .map(appointmentMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AppointmentResponse getById(Long id) {
        log.debug("Fetching appointment with id {}", id);
        Appointment entity = appointmentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        return appointmentMapper.toResponse(entity);
    }

    @Override
    @Transactional
    public AppointmentResponse create(AppointmentRequest request) {
        validateTimeRange(request.startTime(), request.endTime());

        Appointment entity = appointmentMapper.toEntity(request);

        if (request.clientId() != null) {
            Client client = clientRepository.findById(request.clientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Client", request.clientId()));
            entity.setClient(client);
        }

        if (request.vehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(request.vehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle", request.vehicleId()));
            if (request.clientId() != null && !vehicle.getClient().getId().equals(request.clientId())) {
                throw new BusinessException("El vehículo no pertenece al cliente seleccionado");
            }
            entity.setVehicle(vehicle);
        }

        if (request.employeeIds() != null && !request.employeeIds().isEmpty()) {
            Set<Employee> employees = new HashSet<>(employeeRepository.findAllById(request.employeeIds()));
            if (employees.size() != request.employeeIds().size()) {
                throw new ResourceNotFoundException("Uno o más empleados no fueron encontrados");
            }
            entity.setEmployees(employees);
        }

        if (request.tagIds() != null && !request.tagIds().isEmpty()) {
            Set<Tag> tags = new HashSet<>(tagRepository.findAllById(request.tagIds()));
            if (tags.size() != request.tagIds().size()) {
                throw new ResourceNotFoundException("Una o más etiquetas no fueron encontradas");
            }
            entity.setTags(tags);
        }

        Appointment saved = appointmentRepository.save(entity);
        log.info("Created appointment with id {}", saved.getId());
        if (Boolean.TRUE.equals(request.notifyClient())) {
            emailNotificationService.notifyAppointmentScheduled(saved);
        }
        return appointmentMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public AppointmentResponse update(Long id, AppointmentUpdateRequest request) {
        validateTimeRange(request.startTime(), request.endTime());

        Appointment entity = appointmentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));

        LocalDateTime previousStart = entity.getStartTime();
        LocalDateTime previousEnd = entity.getEndTime();
        boolean rescheduled = !request.startTime().equals(previousStart) || !request.endTime().equals(previousEnd);
        if (rescheduled && entity.getStatus() != AppointmentStatus.SCHEDULED) {
            throw new BusinessException("No se puede reprogramar un turno completado o cancelado");
        }

        entity.setStartTime(request.startTime());
        entity.setEndTime(request.endTime());
        if (rescheduled) {
            // The client has to confirm the new slot again
            entity.setConfirmationStatus(AppointmentConfirmationStatus.PENDING);
            entity.setConfirmedAt(null);
        }

        Appointment saved = appointmentRepository.save(entity);
        log.info("Updated appointment with id {}", saved.getId());
        if (rescheduled && Boolean.TRUE.equals(request.notifyClient())) {
            emailNotificationService.notifyAppointmentRescheduled(saved, previousStart, previousEnd);
        }
        return appointmentMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!appointmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Appointment", id);
        }
        appointmentRepository.deleteById(id);
        log.info("Deleted appointment with id {}", id);
    }

    @Override
    @Transactional
    public AppointmentResponse markClientArrived(Long id, boolean arrived) {
        Appointment entity = appointmentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        entity.setClientArrived(arrived);
        Appointment saved = appointmentRepository.save(entity);
        log.info("Marked client arrived = {} for appointment {}", arrived, id);
        return appointmentMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public AppointmentResponse markVehicleArrived(Long id) {
        Appointment entity = appointmentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        entity.setVehicleArrivedAt(LocalDateTime.now());
        Appointment saved = appointmentRepository.save(entity);
        log.info("Marked vehicle arrived for appointment {}", id);
        return appointmentMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public AppointmentResponse markVehiclePickedUp(Long id) {
        Appointment entity = appointmentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        entity.setVehiclePickedUpAt(LocalDateTime.now());
        Appointment saved = appointmentRepository.save(entity);
        log.info("Marked vehicle picked up for appointment {}", id);
        return appointmentMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public AppointmentResponse cancel(Long id, boolean notifyClient) {
        Appointment entity = appointmentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        if (entity.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BusinessException("La cita ya se encuentra cancelada");
        }
        entity.setStatus(AppointmentStatus.CANCELLED);
        Appointment saved = appointmentRepository.save(entity);
        log.info("Cancelled appointment with id {}", id);
        if (notifyClient) {
            emailNotificationService.notifyAppointmentCancelled(saved);
        }
        return appointmentMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PublicAppointmentResponse getByConfirmationToken(String token) {
        return toPublicResponse(findByToken(token));
    }

    @Override
    @Transactional
    public PublicAppointmentResponse confirmByToken(String token) {
        Appointment entity = findByToken(token);
        ensureClientCanRespond(entity);
        if (entity.getConfirmationStatus() != AppointmentConfirmationStatus.CONFIRMED) {
            entity.setConfirmationStatus(AppointmentConfirmationStatus.CONFIRMED);
            entity.setConfirmedAt(LocalDateTime.now());
            appointmentRepository.save(entity);
            log.info("Client confirmed appointment {}", entity.getId());
        }
        return toPublicResponse(entity);
    }

    @Override
    @Transactional
    public PublicAppointmentResponse declineByToken(String token) {
        Appointment entity = findByToken(token);
        ensureClientCanRespond(entity);
        if (entity.getConfirmationStatus() != AppointmentConfirmationStatus.DECLINED) {
            entity.setConfirmationStatus(AppointmentConfirmationStatus.DECLINED);
            entity.setConfirmedAt(null);
            appointmentRepository.save(entity);
            log.info("Client declined appointment {}", entity.getId());
        }
        return toPublicResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getByDateRange(LocalDateTime rangeStart, LocalDateTime rangeEnd) {
        log.debug("Fetching appointments from {} to {}", rangeStart, rangeEnd);
        return appointmentRepository.findByDateRange(rangeStart, rangeEnd).stream()
                .map(appointmentMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getByEmployeeAndDateRange(Long employeeId, LocalDateTime rangeStart, LocalDateTime rangeEnd) {
        log.debug("Fetching appointments for employee {} from {} to {}", employeeId, rangeStart, rangeEnd);
        return appointmentRepository.findByEmployeeAndDateRange(employeeId, rangeStart, rangeEnd).stream()
                .map(appointmentMapper::toResponse)
                .toList();
    }

    private Appointment findByToken(String token) {
        return appointmentRepository.findByConfirmationToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("El enlace del turno no es válido"));
    }

    private boolean canRespond(Appointment entity) {
        return entity.getStatus() == AppointmentStatus.SCHEDULED
                && entity.getStartTime().isAfter(appProperties.workshopNow());
    }

    private void ensureClientCanRespond(Appointment entity) {
        if (entity.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BusinessException("Este turno fue cancelado por el taller");
        }
        if (!canRespond(entity)) {
            throw new BusinessException("Este turno ya pasó y no se puede modificar");
        }
    }

    private PublicAppointmentResponse toPublicResponse(Appointment entity) {
        String vehicle = entity.getVehicle() != null
                ? EmailFormats.vehicleLabel(
                        entity.getVehicle().getBrand() != null ? entity.getVehicle().getBrand().getName() : null,
                        entity.getVehicle().getModel(), entity.getVehicle().getPlate())
                : null;
        return new PublicAppointmentResponse(
                entity.getClient() != null ? entity.getClient().getFirstName() : null,
                vehicle,
                entity.getPurpose(),
                entity.getStartTime(),
                entity.getEndTime(),
                entity.getStatus(),
                entity.getConfirmationStatus(),
                canRespond(entity)
        );
    }

    private void validateTimeRange(LocalDateTime start, LocalDateTime end) {
        if (start != null && end != null && !start.isBefore(end)) {
            throw new BusinessException("La hora de inicio debe ser anterior a la hora de fin");
        }
    }
}
