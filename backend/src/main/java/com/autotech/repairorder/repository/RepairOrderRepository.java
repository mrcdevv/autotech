package com.autotech.repairorder.repository;

import com.autotech.repairorder.model.RepairOrder;
import com.autotech.repairorder.model.RepairOrderStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RepairOrderRepository extends JpaRepository<RepairOrder, Long> {

    @EntityGraph(attributePaths = {"client", "vehicle", "vehicle.brand", "employees", "tags"})
    List<RepairOrder> findByStatusIn(List<RepairOrderStatus> statuses);

    @EntityGraph(attributePaths = {"client", "vehicle", "vehicle.brand", "employees", "tags"})
    List<RepairOrder> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"client", "vehicle", "vehicle.brand", "employees", "tags", "appointment"})
    Optional<RepairOrder> findWithDetailsById(Long id);

    List<RepairOrder> findByVehicleIdOrderByCreatedAtDesc(Long vehicleId);

    boolean existsByVehicleIdAndStatusNot(Long vehicleId, RepairOrderStatus status);

    @Query("""
            SELECT DISTINCT ro FROM RepairOrder ro
            LEFT JOIN ro.client c
            LEFT JOIN ro.vehicle v
            LEFT JOIN v.brand b
            LEFT JOIN ro.employees e
            LEFT JOIN ro.tags t
            WHERE LOWER(ro.title) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(c.firstName) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(c.lastName) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(v.plate) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(b.name) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(v.model) LIKE LOWER(CONCAT('%', :query, '%'))
            """)
    List<RepairOrder> search(@Param("query") String query);

    @Query("""
            SELECT DISTINCT ro FROM RepairOrder ro
            JOIN ro.employees e
            WHERE e.id = :employeeId
            """)
    List<RepairOrder> findByEmployeeId(@Param("employeeId") Long employeeId);

    @Query("""
            SELECT DISTINCT ro FROM RepairOrder ro
            JOIN ro.tags t
            WHERE t.id = :tagId
            """)
    List<RepairOrder> findByTagId(@Param("tagId") Long tagId);
}
