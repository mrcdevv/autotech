package com.autotech.estimate.service;

import com.autotech.estimate.dto.EstimateDetailResponse;
import com.autotech.estimate.dto.EstimateDeliveryNoteDataResponse;
import com.autotech.estimate.dto.EstimateProductRequest;
import com.autotech.estimate.dto.EstimateRequest;
import com.autotech.estimate.dto.EstimateResponse;
import com.autotech.estimate.dto.EstimateServiceItemRequest;
import com.autotech.estimate.dto.InspectionIssueResponse;
import com.autotech.estimate.dto.PublicEstimateResponse;
import com.autotech.estimate.model.EstimateDecisionChannel;
import com.autotech.estimate.model.EstimateStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface EstimateService {

    Page<EstimateResponse> getAll(Pageable pageable);

    Page<EstimateResponse> search(String clientName, String plate, EstimateStatus status, Pageable pageable);

    EstimateDetailResponse getById(Long id);

    EstimateDetailResponse getByRepairOrderId(Long repairOrderId);

    List<EstimateResponse> getAllByRepairOrderId(Long repairOrderId);

    EstimateDetailResponse create(EstimateRequest request);

    EstimateDetailResponse update(Long id, EstimateRequest request);

    /**
     * Staff decision. The channel tells how the client answered (WhatsApp, phone, in person).
     */
    EstimateDetailResponse approve(Long id, EstimateDecisionChannel channel, String decidedByEmail);

    EstimateDetailResponse reject(Long id, EstimateDecisionChannel channel, String decidedByEmail);

    PublicEstimateResponse getByApprovalToken(String token);

    PublicEstimateResponse approveByToken(String token);

    PublicEstimateResponse rejectByToken(String token);

    void delete(Long id);

    BigDecimal calculateTotal(List<EstimateServiceItemRequest> services,
                              List<EstimateProductRequest> products,
                              BigDecimal discountPercentage,
                              BigDecimal taxPercentage);

    EstimateDeliveryNoteDataResponse convertToDeliveryNoteData(Long estimateId);

    List<InspectionIssueResponse> getInspectionIssues(Long repairOrderId);
}
