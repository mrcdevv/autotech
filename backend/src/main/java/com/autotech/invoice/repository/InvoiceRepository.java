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
}
