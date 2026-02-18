package com.autotech.estimate.repository;

import com.autotech.estimate.model.Estimate;
import com.autotech.estimate.model.EstimateStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EstimateRepository extends JpaRepository<Estimate, Long> {

    @EntityGraph(attributePaths = {"services", "products", "client", "vehicle", "repairOrder"})
    Optional<Estimate> findWithDetailsById(Long id);

    Optional<Estimate> findByRepairOrderId(Long repairOrderId);

    List<Estimate> findAllByRepairOrderId(Long repairOrderId);

    @EntityGraph(attributePaths = {"client", "vehicle", "repairOrder"})
    Page<Estimate> findAll(Pageable pageable);

    @Query("""
            SELECT e FROM Estimate e
            LEFT JOIN e.client c
            LEFT JOIN e.vehicle v
            WHERE (:clientName IS NULL OR LOWER(c.firstName) LIKE LOWER(CONCAT('%', :clientName, '%'))
                   OR LOWER(c.lastName) LIKE LOWER(CONCAT('%', :clientName, '%')))
            AND (:plate IS NULL OR LOWER(v.plate) LIKE LOWER(CONCAT('%', :plate, '%')))
            AND (:status IS NULL OR e.status = :status)
            """)
    Page<Estimate> search(
            @Param("clientName") String clientName,
            @Param("plate") String plate,
            @Param("status") EstimateStatus status,
            Pageable pageable);
}
