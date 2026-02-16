package com.autotech.vehicle.service;

import com.autotech.vehicle.dto.VehicleRequest;
import com.autotech.vehicle.dto.VehicleResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface VehicleService {

    Page<VehicleResponse> getAll(Pageable pageable);

    VehicleResponse getById(Long id);

    VehicleResponse create(VehicleRequest request);

    VehicleResponse update(Long id, VehicleRequest request);

    void delete(Long id);

    Page<VehicleResponse> searchByPlate(String plate, Pageable pageable);

    List<VehicleResponse> getByClientId(Long clientId);

    Page<VehicleResponse> filterByBrand(Long brandId, Pageable pageable);

    Page<VehicleResponse> filterByYear(Integer year, Pageable pageable);

    Page<VehicleResponse> filterByModel(String model, Pageable pageable);
}
