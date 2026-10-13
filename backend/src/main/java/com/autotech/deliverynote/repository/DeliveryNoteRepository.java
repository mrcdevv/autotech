package com.autotech.deliverynote.repository;

import com.autotech.deliverynote.model.DeliveryNote;
import com.autotech.deliverynote.model.DeliveryNoteStatus;
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
public interface DeliveryNoteRepository extends JpaRepository<DeliveryNote, Long> {

    @EntityGraph(attributePaths = {"services", "products", "client", "vehicle", "repairOrder", "estimate"})
    Optional<DeliveryNote> findWithDetailsById(Long id);

    Optional<DeliveryNote> findByRepairOrderId(Long repairOrderId);

    Optional<DeliveryNote> findByEstimateId(Long estimateId);

    @EntityGraph(attributePaths = {"client", "vehicle", "repairOrder", "estimate"})
    Page<DeliveryNote> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"client", "vehicle", "repairOrder", "estimate"})
    @Query("""
            SELECT DISTINCT i FROM DeliveryNote i
            JOIN i.client c
            JOIN i.vehicle v
            WHERE (:clientName IS NULL OR :clientName = '' OR LOWER(CONCAT(c.firstName, ' ', c.lastName)) LIKE LOWER(CONCAT('%', :clientName, '%')))
            AND (:plate IS NULL OR :plate = '' OR REPLACE(LOWER(v.plate), ' ', '') LIKE LOWER(CONCAT('%', REPLACE(:plate, ' ', ''), '%')))
            AND (:status IS NULL OR i.status = :status)
            """)
    Page<DeliveryNote> search(
            @Param("clientName") String clientName,
            @Param("plate") String plate,
            @Param("status") DeliveryNoteStatus status,
            Pageable pageable);

    @Query("SELECT COALESCE(SUM(i.total), 0) FROM DeliveryNote i WHERE i.status = :status")
    BigDecimal sumTotalByStatus(@Param("status") DeliveryNoteStatus status);

    @Query("SELECT COALESCE(SUM(i.total), 0) FROM DeliveryNote i WHERE i.status = :status AND i.createdAt >= :start AND i.createdAt < :end")
    BigDecimal sumTotalByStatusAndCreatedAtBetween(
            @Param("status") DeliveryNoteStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT AVG(i.total) FROM DeliveryNote i WHERE i.status = :status AND i.createdAt >= :start AND i.createdAt < :end")
    BigDecimal avgTotalByStatusAndCreatedAtBetween(
            @Param("status") DeliveryNoteStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("""
            SELECT YEAR(i.createdAt), MONTH(i.createdAt), COALESCE(SUM(i.total), 0)
            FROM DeliveryNote i
            WHERE i.status = :status AND i.createdAt >= :start AND i.createdAt < :end
            GROUP BY YEAR(i.createdAt), MONTH(i.createdAt)
            ORDER BY YEAR(i.createdAt), MONTH(i.createdAt)
            """)
    List<Object[]> sumTotalByStatusGroupByMonth(
            @Param("status") DeliveryNoteStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(i), COALESCE(SUM(i.total), 0) FROM DeliveryNote i WHERE i.status = :status AND i.createdAt >= :start AND i.createdAt < :end")
    Object[] countAndSumByStatusAndCreatedAtBetween(
            @Param("status") DeliveryNoteStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(i), COALESCE(SUM(i.total), 0) FROM DeliveryNote i WHERE i.status = :status AND i.createdAt < :before")
    Object[] countAndSumByStatusAndCreatedAtBefore(
            @Param("status") DeliveryNoteStatus status,
            @Param("before") LocalDateTime before);

    @EntityGraph(attributePaths = {"client", "vehicle"})
    @Query("SELECT i FROM DeliveryNote i WHERE i.status = :status ORDER BY i.total DESC")
    List<DeliveryNote> findByStatusWithClientAndVehicleOrderByTotalDesc(
            @Param("status") DeliveryNoteStatus status,
            Pageable pageable);

    @Query("""
            SELECT s.serviceName, COUNT(s)
            FROM DeliveryNote i JOIN i.services s
            WHERE i.status = :status AND i.createdAt >= :start AND i.createdAt < :end
            GROUP BY s.serviceName
            ORDER BY COUNT(s) DESC
            """)
    List<Object[]> findTopServiceNames(
            @Param("status") DeliveryNoteStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable);

    @Query("""
            SELECT YEAR(i.createdAt), MONTH(i.createdAt), COALESCE(SUM(i.total), 0)
            FROM DeliveryNote i
            WHERE i.createdAt >= :start AND i.createdAt < :end
            GROUP BY YEAR(i.createdAt), MONTH(i.createdAt)
            ORDER BY YEAR(i.createdAt), MONTH(i.createdAt)
            """)
    List<Object[]> sumTotalGroupByMonth(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("""
            SELECT s.serviceName, COUNT(s)
            FROM DeliveryNote i JOIN i.services s
            WHERE i.createdAt >= :start AND i.createdAt < :end
            GROUP BY s.serviceName
            ORDER BY COUNT(s) DESC
            """)
    List<Object[]> countServiceOccurrences(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("""
            SELECT s.serviceName, COALESCE(SUM(s.price), 0)
            FROM DeliveryNote i JOIN i.services s
            WHERE i.createdAt >= :start AND i.createdAt < :end
            GROUP BY s.serviceName
            ORDER BY SUM(s.price) DESC
            """)
    List<Object[]> sumServiceRevenue(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query(value = "SELECT nextval('delivery_note_number_seq')", nativeQuery = true)
    Long nextNumber();
}
