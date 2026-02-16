package com.autotech.vehicle.controller;

import com.autotech.common.dto.ApiResponse;
import com.autotech.vehicle.dto.VehicleRequest;
import com.autotech.vehicle.dto.VehicleResponse;
import com.autotech.vehicle.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<VehicleResponse>>> getAll(
            @PageableDefault(size = 12) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.getAll(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VehicleResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<VehicleResponse>> create(@Valid @RequestBody VehicleRequest request) {
        VehicleResponse created = vehicleService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Vehículo creado", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VehicleResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody VehicleRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Vehículo actualizado", vehicleService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        vehicleService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Vehículo eliminado", null));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<VehicleResponse>>> searchByPlate(
            @RequestParam String plate,
            @PageableDefault(size = 12) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.searchByPlate(plate, pageable)));
    }

    @GetMapping("/by-client/{clientId}")
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> getByClient(@PathVariable Long clientId) {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.getByClientId(clientId)));
    }

    @GetMapping("/filter/by-brand")
    public ResponseEntity<ApiResponse<Page<VehicleResponse>>> filterByBrand(
            @RequestParam Long brandId,
            @PageableDefault(size = 12) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.filterByBrand(brandId, pageable)));
    }

    @GetMapping("/filter/by-year")
    public ResponseEntity<ApiResponse<Page<VehicleResponse>>> filterByYear(
            @RequestParam Integer year,
            @PageableDefault(size = 12) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.filterByYear(year, pageable)));
    }

    @GetMapping("/filter/by-model")
    public ResponseEntity<ApiResponse<Page<VehicleResponse>>> filterByModel(
            @RequestParam String model,
            @PageableDefault(size = 12) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.filterByModel(model, pageable)));
    }
}
