package com.autotech.appointment.service;

import com.autotech.appointment.dto.AppointmentMapper;
import com.autotech.appointment.dto.AppointmentRequest;
import com.autotech.appointment.dto.AppointmentResponse;
import com.autotech.appointment.dto.AppointmentUpdateRequest;
import com.autotech.appointment.model.Appointment;
import com.autotech.appointment.repository.AppointmentRepository;
import com.autotech.client.model.Client;
import com.autotech.client.repository.ClientRepository;
import com.autotech.common.exception.BusinessException;
import com.autotech.common.exception.ResourceNotFoundException;
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
        return appointmentMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public AppointmentResponse update(Long id, AppointmentUpdateRequest request) {
        validateTimeRange(request.startTime(), request.endTime());

        Appointment entity = appointmentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));

        entity.setStartTime(request.startTime());
        entity.setEndTime(request.endTime());

        Appointment saved = appointmentRepository.save(entity);
        log.info("Updated appointment with id {}", saved.getId());
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

    private void validateTimeRange(LocalDateTime start, LocalDateTime end) {
        if (start != null && end != null && !start.isBefore(end)) {
            throw new BusinessException("La hora de inicio debe ser anterior a la hora de fin");
        }
    }
}
