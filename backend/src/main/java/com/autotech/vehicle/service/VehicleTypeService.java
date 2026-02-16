package com.autotech.vehicle.service;

import com.autotech.vehicle.dto.VehicleTypeResponse;

import java.util.List;

public interface VehicleTypeService {
    List<VehicleTypeResponse> getAll();
}
