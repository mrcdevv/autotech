package com.autotech.invoice.service;

import com.autotech.invoice.dto.InvoiceDetailResponse;
import com.autotech.invoice.dto.InvoiceProductRequest;
import com.autotech.invoice.dto.InvoiceRequest;
import com.autotech.invoice.dto.InvoiceResponse;
import com.autotech.invoice.dto.InvoiceServiceItemRequest;
import com.autotech.invoice.model.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface InvoiceService {

    Page<InvoiceResponse> getAll(Pageable pageable);

    Page<InvoiceResponse> search(String clientName, String plate, InvoiceStatus status, Pageable pageable);

    InvoiceDetailResponse getById(Long id);

    InvoiceDetailResponse getByRepairOrderId(Long repairOrderId);

    InvoiceDetailResponse create(InvoiceRequest request);

    InvoiceDetailResponse createFromEstimate(Long estimateId);

    void delete(Long id);

    BigDecimal calculateTotal(List<InvoiceServiceItemRequest> services,
                              List<InvoiceProductRequest> products,
                              BigDecimal discountPercentage,
                              BigDecimal taxPercentage);

    void markAsPaid(Long id);

    void updateStatusToPagada(Long id);

    void updateStatusToPendiente(Long id);
}
