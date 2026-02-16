package com.autotech.inspection.service;

import com.autotech.inspection.dto.InspectionResponse;
import com.autotech.inspection.dto.SaveInspectionItemsRequest;

import java.util.List;

public interface InspectionService {

    InspectionResponse createForRepairOrder(Long repairOrderId, Long templateId);

    List<InspectionResponse> getByRepairOrder(Long repairOrderId);

    InspectionResponse getById(Long id);

    InspectionResponse saveItems(Long inspectionId, SaveInspectionItemsRequest request);

    void delete(Long id);
}
