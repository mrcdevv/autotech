package com.autotech.repairorder.repository;

import com.autotech.repairorder.model.RepairOrder;
import com.autotech.repairorder.model.RepairOrderStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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

    Long countByStatusNot(RepairOrderStatus status);

    Long countByStatus(RepairOrderStatus status);

    @Query("SELECT ro.status, COUNT(ro) FROM RepairOrder ro GROUP BY ro.status")
    List<Object[]> countGroupByStatus();

    @Query("""
            SELECT ro FROM RepairOrder ro
            JOIN FETCH ro.client JOIN FETCH ro.vehicle
            WHERE ro.status = :status
            ORDER BY ro.updatedAt ASC
            """)
    List<RepairOrder> findByStatusWithClientAndVehicle(@Param("status") RepairOrderStatus status);

    @Query("""
            SELECT ro FROM RepairOrder ro
            JOIN FETCH ro.client JOIN FETCH ro.vehicle
            WHERE ro.updatedAt < :threshold AND ro.status <> :excludedStatus
            ORDER BY ro.updatedAt ASC
            """)
    List<RepairOrder> findStaleOrders(
            @Param("threshold") LocalDateTime threshold,
            @Param("excludedStatus") RepairOrderStatus excludedStatus);

    @Query(value = """
            SELECT AVG(EXTRACT(EPOCH FROM (ro.updated_at - ro.created_at)) / 86400)
            FROM repair_orders ro
            WHERE ro.status = :#{#status.name()} AND ro.updated_at >= :start AND ro.updated_at < :end
            """, nativeQuery = true)
    BigDecimal avgRepairDaysByStatusAndUpdatedAtBetween(
            @Param("status") RepairOrderStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("""
            SELECT e.id, CONCAT(e.firstName, ' ', e.lastName), COUNT(ro)
            FROM RepairOrder ro JOIN ro.employees e
            WHERE ro.status = :status AND ro.updatedAt >= :start AND ro.updatedAt < :end
            GROUP BY e.id, e.firstName, e.lastName
            ORDER BY COUNT(ro) DESC
            """)
    List<Object[]> countCompletedByEmployee(
            @Param("status") RepairOrderStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
