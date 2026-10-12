package com.autotech.deliverynote.service;

import com.autotech.deliverynote.dto.DeliveryNoteDetailResponse;
import com.autotech.deliverynote.dto.DeliveryNoteProductRequest;
import com.autotech.deliverynote.dto.DeliveryNoteRequest;
import com.autotech.deliverynote.dto.DeliveryNoteResponse;
import com.autotech.deliverynote.dto.DeliveryNoteServiceItemRequest;
import com.autotech.deliverynote.model.DeliveryNoteStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface DeliveryNoteService {

    Page<DeliveryNoteResponse> getAll(Pageable pageable);

    Page<DeliveryNoteResponse> search(String clientName, String plate, DeliveryNoteStatus status, Pageable pageable);

    DeliveryNoteDetailResponse getById(Long id);

    DeliveryNoteDetailResponse getByRepairOrderId(Long repairOrderId);

    DeliveryNoteDetailResponse create(DeliveryNoteRequest request);

    DeliveryNoteDetailResponse createFromEstimate(Long estimateId);

    void delete(Long id);

    BigDecimal calculateTotal(List<DeliveryNoteServiceItemRequest> services,
                              List<DeliveryNoteProductRequest> products,
                              BigDecimal discountPercentage,
                              BigDecimal taxPercentage);

    void markAsPaid(Long id);

    void updateStatusToPagada(Long id);

    void updateStatusToPendiente(Long id);
}
