package com.autotech.repairorder.service;

import com.autotech.appointment.model.Appointment;
import com.autotech.appointment.repository.AppointmentRepository;
import com.autotech.client.model.Client;
import com.autotech.client.repository.ClientRepository;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.employee.model.Employee;
import com.autotech.employee.repository.EmployeeRepository;
import com.autotech.repairorder.dto.NotesUpdateRequest;
import com.autotech.repairorder.dto.RepairOrderDetailResponse;
import com.autotech.repairorder.dto.RepairOrderMapper;
import com.autotech.repairorder.dto.RepairOrderRequest;
import com.autotech.repairorder.dto.RepairOrderResponse;
import com.autotech.repairorder.dto.StatusUpdateRequest;
import com.autotech.repairorder.dto.TitleUpdateRequest;
import com.autotech.repairorder.model.RepairOrder;
import com.autotech.repairorder.model.RepairOrderStatus;
import com.autotech.repairorder.repository.RepairOrderRepository;
import com.autotech.tag.model.Tag;
import com.autotech.tag.repository.TagRepository;
import com.autotech.vehicle.model.Vehicle;
import com.autotech.vehicle.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class RepairOrderServiceImpl implements RepairOrderService {

    private final RepairOrderRepository repairOrderRepository;
    private final RepairOrderMapper repairOrderMapper;
    private final ClientRepository clientRepository;
    private final VehicleRepository vehicleRepository;
    private final AppointmentRepository appointmentRepository;
    private final EmployeeRepository employeeRepository;
    private final TagRepository tagRepository;

    @Override
    @Transactional(readOnly = true)
    public List<RepairOrderResponse> getAll() {
        return repairOrderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(repairOrderMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RepairOrderDetailResponse getById(Long id) {
        RepairOrder order = repairOrderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RepairOrder", id));

        RepairOrderDetailResponse response = repairOrderMapper.toDetailResponse(order);

        List<RepairOrder> vehicleOrders = repairOrderRepository
                .findByVehicleIdOrderByCreatedAtDesc(order.getVehicle().getId());
        List<RepairOrderDetailResponse.WorkHistoryEntry> workHistory = vehicleOrders.stream()
                .map(ro -> new RepairOrderDetailResponse.WorkHistoryEntry(
                        ro.getId(),
                        ro.getTitle(),
                        ro.getReason(),
                        ro.getCreatedAt()
                ))
                .toList();

        return new RepairOrderDetailResponse(
                response.id(), response.title(), response.status(),
                response.reason(), response.clientSource(), response.mechanicNotes(),
                response.appointmentId(),
                response.clientId(), response.clientFirstName(), response.clientLastName(),
                response.clientDni(), response.clientPhone(), response.clientEmail(),
                response.vehicleId(), response.vehiclePlate(), response.vehicleBrandName(),
                response.vehicleModel(), response.vehicleYear(), response.vehicleChassisNumber(),
                response.employees(), response.tags(),
                workHistory,
                response.createdAt(), response.updatedAt()
        );
    }

    @Override
    @Transactional
    public RepairOrderResponse create(RepairOrderRequest request) {
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", request.clientId()));

        Vehicle vehicle = vehicleRepository.findById(request.vehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", request.vehicleId()));
        if (!vehicle.getClient().getId().equals(client.getId())) {
            throw new IllegalArgumentException("El vehículo no pertenece al cliente seleccionado");
        }

        Appointment appointment = null;
        if (request.appointmentId() != null) {
            appointment = appointmentRepository.findById(request.appointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Appointment", request.appointmentId()));
        }

        RepairOrder order = RepairOrder.builder()
                .client(client)
                .vehicle(vehicle)
                .appointment(appointment)
                .reason(request.reason())
                .clientSource(request.clientSource())
                .status(RepairOrderStatus.INGRESO_VEHICULO)
                .build();

        RepairOrder saved = repairOrderRepository.save(order);
        String autoTitle = String.format("OT-%d %s - %s",
                saved.getId(), client.getLastName(), vehicle.getPlate());
        saved.setTitle(autoTitle);

        if (request.employeeIds() != null && !request.employeeIds().isEmpty()) {
            saved.setEmployees(resolveEmployees(request.employeeIds()));
        }

        if (request.tagIds() != null && !request.tagIds().isEmpty()) {
            saved.setTags(resolveTags(request.tagIds()));
        }

        RepairOrder result = repairOrderRepository.save(saved);
        log.info("Created repair order with id {} and title '{}'", result.getId(), result.getTitle());
        return repairOrderMapper.toResponse(result);
    }

    @Override
    @Transactional
    public RepairOrderResponse update(Long id, RepairOrderRequest request) {
        RepairOrder existing = repairOrderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RepairOrder", id));

        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", request.clientId()));

        Vehicle vehicle = vehicleRepository.findById(request.vehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", request.vehicleId()));
        if (!vehicle.getClient().getId().equals(client.getId())) {
            throw new IllegalArgumentException("El vehículo no pertenece al cliente seleccionado");
        }

        Appointment appointment = null;
        if (request.appointmentId() != null) {
            appointment = appointmentRepository.findById(request.appointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Appointment", request.appointmentId()));
        }

        existing.setClient(client);
        existing.setVehicle(vehicle);
        existing.setAppointment(appointment);
        existing.setReason(request.reason());
        existing.setClientSource(request.clientSource());

        if (request.employeeIds() != null) {
            existing.getEmployees().clear();
            if (!request.employeeIds().isEmpty()) {
                existing.setEmployees(resolveEmployees(request.employeeIds()));
            }
        }

        if (request.tagIds() != null) {
            existing.getTags().clear();
            if (!request.tagIds().isEmpty()) {
                existing.setTags(resolveTags(request.tagIds()));
            }
        }

        RepairOrder saved = repairOrderRepository.save(existing);
        log.info("Updated repair order with id {}", saved.getId());
        return repairOrderMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        RepairOrder order = repairOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RepairOrder", id));
        repairOrderRepository.delete(order);
        log.info("Deleted repair order with id {}", id);
    }

    @Override
    @Transactional
    public RepairOrderResponse updateStatus(Long id, StatusUpdateRequest request) {
        RepairOrder order = repairOrderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RepairOrder", id));

        RepairOrderStatus newStatus = request.newStatus();

        if (newStatus == RepairOrderStatus.INGRESO_VEHICULO
                || newStatus == RepairOrderStatus.ESPERANDO_APROBACION_PRESUPUESTO) {
            throw new IllegalArgumentException(
                    "No se puede cambiar al estado '" + newStatus + "'. "
                    + "Los estados 'Ingresó vehículo' y 'Esperando aprobación presupuesto' son estados iniciales.");
        }

        log.info("Updating repair order {} status from {} to {}", id, order.getStatus(), newStatus);
        order.setStatus(newStatus);
        RepairOrder saved = repairOrderRepository.save(order);
        return repairOrderMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public RepairOrderResponse updateTitle(Long id, TitleUpdateRequest request) {
        RepairOrder order = repairOrderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RepairOrder", id));

        order.setTitle(request.title());
        RepairOrder saved = repairOrderRepository.save(order);
        log.info("Updated title for repair order {} to '{}'", id, request.title());
        return repairOrderMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RepairOrderResponse> getByStatus(List<RepairOrderStatus> statuses) {
        return repairOrderRepository.findByStatusIn(statuses).stream()
                .map(repairOrderMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public RepairOrderResponse assignEmployees(Long id, List<Long> employeeIds) {
        RepairOrder order = repairOrderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RepairOrder", id));

        order.getEmployees().clear();
        if (employeeIds != null && !employeeIds.isEmpty()) {
            order.setEmployees(resolveEmployees(employeeIds));
        }

        RepairOrder saved = repairOrderRepository.save(order);
        log.info("Assigned {} employees to repair order {}", employeeIds != null ? employeeIds.size() : 0, id);
        return repairOrderMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public RepairOrderResponse assignTags(Long id, List<Long> tagIds) {
        RepairOrder order = repairOrderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RepairOrder", id));

        order.getTags().clear();
        if (tagIds != null && !tagIds.isEmpty()) {
            order.setTags(resolveTags(tagIds));
        }

        RepairOrder saved = repairOrderRepository.save(order);
        log.info("Assigned {} tags to repair order {}", tagIds != null ? tagIds.size() : 0, id);
        return repairOrderMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RepairOrderResponse> search(String query) {
        if (query == null || query.isBlank()) {
            return getAll();
        }
        return repairOrderRepository.search(query).stream()
                .map(repairOrderMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RepairOrderResponse> filterByEmployee(Long employeeId) {
        return repairOrderRepository.findByEmployeeId(employeeId).stream()
                .map(repairOrderMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RepairOrderResponse> filterByTag(Long tagId) {
        return repairOrderRepository.findByTagId(tagId).stream()
                .map(repairOrderMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public RepairOrderDetailResponse updateNotes(Long id, NotesUpdateRequest request) {
        RepairOrder order = repairOrderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RepairOrder", id));

        order.setReason(request.reason());
        order.setMechanicNotes(request.mechanicNotes());
        repairOrderRepository.save(order);
        log.info("Updated notes for repair order {}", id);
        return getById(id);
    }

    private Set<Employee> resolveEmployees(List<Long> employeeIds) {
        Set<Employee> employees = new HashSet<>();
        for (Long empId : employeeIds) {
            Employee emp = employeeRepository.findById(empId)
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", empId));
            employees.add(emp);
        }
        return employees;
    }

    private Set<Tag> resolveTags(List<Long> tagIds) {
        Set<Tag> tags = new HashSet<>();
        for (Long tagId : tagIds) {
            Tag tag = tagRepository.findById(tagId)
                    .orElseThrow(() -> new ResourceNotFoundException("Tag", tagId));
            tags.add(tag);
        }
        return tags;
    }
}
