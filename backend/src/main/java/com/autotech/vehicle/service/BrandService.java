package com.autotech.vehicle.service;

import com.autotech.vehicle.dto.BrandRequest;
import com.autotech.vehicle.dto.BrandResponse;

import java.util.List;

public interface BrandService {

    List<BrandResponse> getAll();

    BrandResponse getById(Long id);

    BrandResponse create(BrandRequest request);

    BrandResponse update(Long id, BrandRequest request);

    void delete(Long id);
}
