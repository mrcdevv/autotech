package com.autotech.repairorder.service;

import com.autotech.repairorder.dto.NotesUpdateRequest;
import com.autotech.repairorder.dto.RepairOrderDetailResponse;
import com.autotech.repairorder.dto.RepairOrderFilter;
import com.autotech.repairorder.dto.RepairOrderRequest;
import com.autotech.repairorder.dto.RepairOrderResponse;
import com.autotech.repairorder.dto.StatusUpdateRequest;
import com.autotech.repairorder.dto.TitleUpdateRequest;
import com.autotech.repairorder.model.RepairOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface RepairOrderService {

    Page<RepairOrderResponse> search(RepairOrderFilter filter, Pageable pageable);

    RepairOrderDetailResponse getById(Long id);

    RepairOrderResponse create(RepairOrderRequest request);

    RepairOrderResponse update(Long id, RepairOrderRequest request);

    void delete(Long id);

    RepairOrderResponse updateStatus(Long id, StatusUpdateRequest request);

    RepairOrderResponse updateTitle(Long id, TitleUpdateRequest request);

    RepairOrderResponse assignEmployees(Long id, List<Long> employeeIds);

    RepairOrderResponse assignTags(Long id, List<Long> tagIds);

    RepairOrderDetailResponse updateNotes(Long id, NotesUpdateRequest request);

    /**
     * Validates that the given repair order is open for new documents (estimates, invoices).
     * Closed means: status is ENTREGADO or CANCELADO, or the repair order already has an invoice.
     * A null repair order (standalone documents) short-circuits and is always allowed.
     */
    void validateOpenForNewDocuments(RepairOrder repairOrder);

    /**
     * Validates that the given repair order is not closed by status (ENTREGADO or CANCELADO).
     * Does not check for an existing invoice; callers that already enforce the one-invoice rule
     * use this variant. A null repair order short-circuits and is always allowed.
     */
    void validateNotClosedByStatus(RepairOrder repairOrder);
}
