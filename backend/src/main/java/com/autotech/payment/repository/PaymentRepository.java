package com.autotech.payment.repository;

import com.autotech.payment.model.Payment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @EntityGraph(attributePaths = {"bankAccount", "bankAccount.bank", "registeredByEmployee"})
    List<Payment> findByInvoiceIdOrderByPaymentDateDesc(Long invoiceId);

    @EntityGraph(attributePaths = {"bankAccount", "bankAccount.bank", "registeredByEmployee"})
    Optional<Payment> findWithDetailsById(Long id);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.invoice.id = :invoiceId")
    BigDecimal sumAmountByInvoiceId(@Param("invoiceId") Long invoiceId);
}
