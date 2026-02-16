package com.autotech.appointment.controller;

import com.autotech.appointment.dto.AppointmentRequest;
import com.autotech.appointment.dto.AppointmentResponse;
import com.autotech.appointment.dto.AppointmentUpdateRequest;
import com.autotech.appointment.service.AppointmentService;
import com.autotech.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AppointmentResponse>>> getAll(
            @PageableDefault(size = 12, sort = "startTime") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getAll(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AppointmentResponse>> create(
            @Valid @RequestBody AppointmentRequest request) {
        AppointmentResponse created = appointmentService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Cita creada", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AppointmentResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cita actualizada", appointmentService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        appointmentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Cita eliminada", null));
    }

    @PatchMapping("/{id}/client-arrived")
    public ResponseEntity<ApiResponse<AppointmentResponse>> markClientArrived(
            @PathVariable Long id,
            @RequestParam boolean arrived) {
        return ResponseEntity.ok(ApiResponse.success(
                arrived ? "Cliente marcado como presente" : "Cliente marcado como ausente",
                appointmentService.markClientArrived(id, arrived)));
    }

    @PatchMapping("/{id}/vehicle-arrived")
    public ResponseEntity<ApiResponse<AppointmentResponse>> markVehicleArrived(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Vehículo marcado como recibido",
                appointmentService.markVehicleArrived(id)));
    }

    @PatchMapping("/{id}/vehicle-picked-up")
    public ResponseEntity<ApiResponse<AppointmentResponse>> markVehiclePickedUp(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Vehículo marcado como retirado",
                appointmentService.markVehiclePickedUp(id)));
    }

    @GetMapping("/range")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(required = false) Long employeeId) {
        List<AppointmentResponse> appointments;
        if (employeeId != null) {
            appointments = appointmentService.getByEmployeeAndDateRange(employeeId, start, end);
        } else {
            appointments = appointmentService.getByDateRange(start, end);
        }
        return ResponseEntity.ok(ApiResponse.success(appointments));
    }
}
