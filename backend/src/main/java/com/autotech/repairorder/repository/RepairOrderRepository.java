package com.autotech.repairorder.repository;

import com.autotech.repairorder.model.RepairOrder;
import com.autotech.repairorder.model.RepairOrderStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface RepairOrderRepository
        extends JpaRepository<RepairOrder, Long>, JpaSpecificationExecutor<RepairOrder> {

    @EntityGraph(attributePaths = {"client", "vehicle", "vehicle.brand", "employees", "tags", "appointment"})
    Optional<RepairOrder> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"client", "vehicle", "vehicle.brand", "employees", "tags"})
    List<RepairOrder> findAllByIdIn(Collection<Long> ids);

    List<RepairOrder> findByVehicleIdOrderByCreatedAtDesc(Long vehicleId);

    boolean existsByVehicleIdAndStatusNotIn(Long vehicleId, Collection<RepairOrderStatus> statuses);

    Long countByStatusNotIn(Collection<RepairOrderStatus> statuses);

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
            WHERE ro.updatedAt < :threshold AND ro.status NOT IN :excludedStatuses
            ORDER BY ro.updatedAt ASC
            """)
    List<RepairOrder> findStaleOrders(
            @Param("threshold") LocalDateTime threshold,
            @Param("excludedStatuses") Collection<RepairOrderStatus> excludedStatuses);

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

    @Query("""
            SELECT b.name, COUNT(ro)
            FROM RepairOrder ro
            JOIN ro.vehicle v
            JOIN v.brand b
            WHERE ro.createdAt >= :start AND ro.createdAt < :end
            GROUP BY b.name
            ORDER BY COUNT(ro) DESC
            """)
    List<Object[]> countByBrand(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
