package com.autotech.invoice.repository;

import com.autotech.invoice.model.InvoiceServiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceServiceItemRepository extends JpaRepository<InvoiceServiceItem, Long> {

    List<InvoiceServiceItem> findByInvoiceId(Long invoiceId);

    void deleteByInvoiceId(Long invoiceId);
}
