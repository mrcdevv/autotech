package com.autotech.vehicle.service;

import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.vehicle.dto.BrandMapper;
import com.autotech.vehicle.dto.BrandRequest;
import com.autotech.vehicle.dto.BrandResponse;
import com.autotech.vehicle.model.Brand;
import com.autotech.vehicle.repository.BrandRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BrandServiceImpl implements BrandService {

    private final BrandRepository brandRepository;
    private final BrandMapper brandMapper;

    @Override
    @Transactional(readOnly = true)
    public List<BrandResponse> getAll() {
        return brandRepository.findAll().stream()
                .map(brandMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BrandResponse getById(Long id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand", id));
        return brandMapper.toResponse(brand);
    }

    @Override
    @Transactional
    public BrandResponse create(BrandRequest request) {
        if (brandRepository.existsByNameIgnoreCase(request.name())) {
            throw new IllegalArgumentException("La marca ya se encuentra registrada");
        }
        Brand brand = brandMapper.toEntity(request);
        Brand saved = brandRepository.save(brand);
        log.info("Created brand with id {} and name {}", saved.getId(), saved.getName());
        return brandMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public BrandResponse update(Long id, BrandRequest request) {
        Brand existing = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand", id));
        existing.setName(request.name());
        Brand saved = brandRepository.save(existing);
        log.info("Updated brand with id {}", saved.getId());
        return brandMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand", id));
        brandRepository.delete(brand);
        log.info("Deleted brand with id {}", id);
    }
}
