package com.autotech.vehicle.service;

import com.autotech.client.model.Client;
import com.autotech.client.service.ClientService;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.vehicle.dto.VehicleMapper;
import com.autotech.vehicle.dto.VehicleRequest;
import com.autotech.vehicle.dto.VehicleResponse;
import com.autotech.vehicle.model.Brand;
import com.autotech.vehicle.model.Vehicle;
import com.autotech.vehicle.model.VehicleType;
import com.autotech.vehicle.repository.BrandRepository;
import com.autotech.vehicle.repository.VehicleRepository;
import com.autotech.vehicle.repository.VehicleTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final VehicleMapper vehicleMapper;
    private final ClientService clientService;
    private final BrandRepository brandRepository;
    private final VehicleTypeRepository vehicleTypeRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<VehicleResponse> getAll(Pageable pageable) {
        return vehicleRepository.findAll(pageable).map(vehicleMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public VehicleResponse getById(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", id));
        return vehicleMapper.toResponse(vehicle);
    }

    @Override
    @Transactional
    public VehicleResponse create(VehicleRequest request) {
        if (vehicleRepository.existsByPlate(request.plate())) {
            throw new IllegalArgumentException("La patente ya se encuentra registrada");
        }

        Client client = resolveClient(request.clientId());
        Brand brand = resolveBrand(request.brandId());
        VehicleType vehicleType = resolveVehicleType(request.vehicleTypeId());

        Vehicle vehicle = vehicleMapper.toEntity(request);
        vehicle.setClient(client);
        vehicle.setBrand(brand);
        vehicle.setVehicleType(vehicleType);

        Vehicle saved = vehicleRepository.save(vehicle);
        log.info("Created vehicle with id {} and plate {}", saved.getId(), saved.getPlate());
        return vehicleMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public VehicleResponse update(Long id, VehicleRequest request) {
        Vehicle existing = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", id));

        if (vehicleRepository.existsByPlateAndIdNot(request.plate(), id)) {
            throw new IllegalArgumentException("La patente ya se encuentra registrada");
        }

        Client client = resolveClient(request.clientId());
        Brand brand = resolveBrand(request.brandId());
        VehicleType vehicleType = resolveVehicleType(request.vehicleTypeId());

        existing.setClient(client);
        existing.setPlate(request.plate());
        existing.setChassisNumber(request.chassisNumber());
        existing.setEngineNumber(request.engineNumber());
        existing.setBrand(brand);
        existing.setModel(request.model());
        existing.setYear(request.year());
        existing.setVehicleType(vehicleType);
        existing.setObservations(request.observations());

        Vehicle saved = vehicleRepository.save(existing);
        log.info("Updated vehicle with id {}", saved.getId());
        return vehicleMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", id));
        vehicleRepository.delete(vehicle);
        log.info("Deleted vehicle with id {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VehicleResponse> searchByPlate(String plate, Pageable pageable) {
        return vehicleRepository.findByPlateContainingIgnoreCase(plate, pageable)
                .map(vehicleMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleResponse> getByClientId(Long clientId) {
        return vehicleRepository.findByClientId(clientId).stream()
                .map(vehicleMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VehicleResponse> filterByBrand(Long brandId, Pageable pageable) {
        return vehicleRepository.findByBrandId(brandId, pageable)
                .map(vehicleMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VehicleResponse> filterByYear(Integer year, Pageable pageable) {
        return vehicleRepository.findByYear(year, pageable)
                .map(vehicleMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VehicleResponse> filterByModel(String model, Pageable pageable) {
        return vehicleRepository.findByModelContainingIgnoreCase(model, pageable)
                .map(vehicleMapper::toResponse);
    }

    private Client resolveClient(Long clientId) {
        return clientService.findEntityById(clientId);
    }

    private Brand resolveBrand(Long brandId) {
        if (brandId == null) return null;
        return brandRepository.findById(brandId)
                .orElseThrow(() -> new ResourceNotFoundException("Brand", brandId));
    }

    private VehicleType resolveVehicleType(Long vehicleTypeId) {
        if (vehicleTypeId == null) return null;
        return vehicleTypeRepository.findById(vehicleTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("VehicleType", vehicleTypeId));
    }
}
