package com.autotech.repairorder.service;

import com.autotech.repairorder.dto.NotesUpdateRequest;
import com.autotech.repairorder.dto.RepairOrderDetailResponse;
import com.autotech.repairorder.dto.RepairOrderRequest;
import com.autotech.repairorder.dto.RepairOrderResponse;
import com.autotech.repairorder.dto.StatusUpdateRequest;
import com.autotech.repairorder.dto.TitleUpdateRequest;
import com.autotech.repairorder.model.RepairOrderStatus;

import java.util.List;

public interface RepairOrderService {

    List<RepairOrderResponse> getAll();

    RepairOrderDetailResponse getById(Long id);

    RepairOrderResponse create(RepairOrderRequest request);

    RepairOrderResponse update(Long id, RepairOrderRequest request);

    void delete(Long id);

    RepairOrderResponse updateStatus(Long id, StatusUpdateRequest request);

    RepairOrderResponse updateTitle(Long id, TitleUpdateRequest request);

    List<RepairOrderResponse> getByStatus(List<RepairOrderStatus> statuses);

    RepairOrderResponse assignEmployees(Long id, List<Long> employeeIds);

    RepairOrderResponse assignTags(Long id, List<Long> tagIds);

    List<RepairOrderResponse> search(String query);

    List<RepairOrderResponse> filterByEmployee(Long employeeId);

    List<RepairOrderResponse> filterByTag(Long tagId);

    RepairOrderDetailResponse updateNotes(Long id, NotesUpdateRequest request);
}
