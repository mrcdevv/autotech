package com.autotech.vehicle.controller;

import com.autotech.common.dto.ApiResponse;
import com.autotech.vehicle.dto.VehicleTypeResponse;
import com.autotech.vehicle.service.VehicleTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/vehicle-types")
@RequiredArgsConstructor
public class VehicleTypeController {

    private final VehicleTypeService vehicleTypeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<VehicleTypeResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(vehicleTypeService.getAll()));
    }
}
