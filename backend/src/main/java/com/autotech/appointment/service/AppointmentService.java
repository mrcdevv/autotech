package com.autotech.appointment.service;

import com.autotech.appointment.dto.AppointmentRequest;
import com.autotech.appointment.dto.AppointmentResponse;
import com.autotech.appointment.dto.AppointmentUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentService {

    Page<AppointmentResponse> getAll(Pageable pageable);

    AppointmentResponse getById(Long id);

    AppointmentResponse create(AppointmentRequest request);

    AppointmentResponse update(Long id, AppointmentUpdateRequest request);

    void delete(Long id);

    AppointmentResponse markClientArrived(Long id, boolean arrived);

    AppointmentResponse markVehicleArrived(Long id);

    AppointmentResponse markVehiclePickedUp(Long id);

    List<AppointmentResponse> getByDateRange(LocalDateTime rangeStart, LocalDateTime rangeEnd);

    List<AppointmentResponse> getByEmployeeAndDateRange(Long employeeId, LocalDateTime rangeStart, LocalDateTime rangeEnd);
}
