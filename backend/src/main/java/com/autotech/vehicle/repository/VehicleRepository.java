package com.autotech.vehicle.repository;

import com.autotech.vehicle.model.Vehicle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    @EntityGraph(attributePaths = {"client", "brand", "vehicleType"})
    Page<Vehicle> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"client", "brand", "vehicleType"})
    Optional<Vehicle> findById(Long id);

    List<Vehicle> findByClientId(Long clientId);

    boolean existsByPlate(String plate);

    boolean existsByPlateAndIdNot(String plate, Long id);

    @EntityGraph(attributePaths = {"client", "brand", "vehicleType"})
    Page<Vehicle> findByPlateContainingIgnoreCase(String plate, Pageable pageable);

    @EntityGraph(attributePaths = {"client", "brand", "vehicleType"})
    Page<Vehicle> findByBrandId(Long brandId, Pageable pageable);

    @EntityGraph(attributePaths = {"client", "brand", "vehicleType"})
    Page<Vehicle> findByYear(Integer year, Pageable pageable);

    @EntityGraph(attributePaths = {"client", "brand", "vehicleType"})
    Page<Vehicle> findByModelContainingIgnoreCase(String model, Pageable pageable);
}
