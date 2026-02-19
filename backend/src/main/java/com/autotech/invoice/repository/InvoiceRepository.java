package com.autotech.invoice.repository;

import com.autotech.invoice.model.Invoice;
import com.autotech.invoice.model.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    @EntityGraph(attributePaths = {"services", "products", "client", "vehicle", "repairOrder", "estimate"})
    Optional<Invoice> findWithDetailsById(Long id);

    Optional<Invoice> findByRepairOrderId(Long repairOrderId);

    Optional<Invoice> findByEstimateId(Long estimateId);

    @EntityGraph(attributePaths = {"client", "vehicle", "repairOrder", "estimate"})
    Page<Invoice> findAll(Pageable pageable);

    @Query("""
            SELECT i FROM Invoice i
            LEFT JOIN i.client c
            LEFT JOIN i.vehicle v
            WHERE (:clientName IS NULL OR LOWER(c.firstName) LIKE LOWER(CONCAT('%', :clientName, '%'))
                   OR LOWER(c.lastName) LIKE LOWER(CONCAT('%', :clientName, '%')))
            AND (:plate IS NULL OR LOWER(v.plate) LIKE LOWER(CONCAT('%', :plate, '%')))
            AND (:status IS NULL OR i.status = :status)
            """)
    Page<Invoice> search(
            @Param("clientName") String clientName,
            @Param("plate") String plate,
            @Param("status") InvoiceStatus status,
            Pageable pageable);

    @Query("SELECT COALESCE(SUM(i.total), 0) FROM Invoice i WHERE i.status = :status")
    BigDecimal sumTotalByStatus(@Param("status") InvoiceStatus status);

    @Query("SELECT COALESCE(SUM(i.total), 0) FROM Invoice i WHERE i.status = :status AND i.createdAt >= :start AND i.createdAt < :end")
    BigDecimal sumTotalByStatusAndCreatedAtBetween(
            @Param("status") InvoiceStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT AVG(i.total) FROM Invoice i WHERE i.status = :status AND i.createdAt >= :start AND i.createdAt < :end")
    BigDecimal avgTotalByStatusAndCreatedAtBetween(
            @Param("status") InvoiceStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("""
            SELECT YEAR(i.createdAt), MONTH(i.createdAt), COALESCE(SUM(i.total), 0)
            FROM Invoice i
            WHERE i.status = :status AND i.createdAt >= :start AND i.createdAt < :end
            GROUP BY YEAR(i.createdAt), MONTH(i.createdAt)
            ORDER BY YEAR(i.createdAt), MONTH(i.createdAt)
            """)
    List<Object[]> sumTotalByStatusGroupByMonth(
            @Param("status") InvoiceStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(i), COALESCE(SUM(i.total), 0) FROM Invoice i WHERE i.status = :status AND i.createdAt >= :start AND i.createdAt < :end")
    Object[] countAndSumByStatusAndCreatedAtBetween(
            @Param("status") InvoiceStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(i), COALESCE(SUM(i.total), 0) FROM Invoice i WHERE i.status = :status AND i.createdAt < :before")
    Object[] countAndSumByStatusAndCreatedAtBefore(
            @Param("status") InvoiceStatus status,
            @Param("before") LocalDateTime before);

    @EntityGraph(attributePaths = {"client", "vehicle"})
    @Query("SELECT i FROM Invoice i WHERE i.status = :status ORDER BY i.total DESC")
    List<Invoice> findByStatusWithClientAndVehicleOrderByTotalDesc(
            @Param("status") InvoiceStatus status,
            Pageable pageable);

    @Query("""
            SELECT s.serviceName, COUNT(s)
            FROM Invoice i JOIN i.services s
            WHERE i.status = :status AND i.createdAt >= :start AND i.createdAt < :end
            GROUP BY s.serviceName
            ORDER BY COUNT(s) DESC
            """)
    List<Object[]> findTopServiceNames(
            @Param("status") InvoiceStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable);
}
