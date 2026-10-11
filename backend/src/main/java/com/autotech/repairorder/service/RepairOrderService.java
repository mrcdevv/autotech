package com.autotech.repairorder.service;

import com.autotech.repairorder.dto.NotesUpdateRequest;
import com.autotech.repairorder.dto.RepairOrderDetailResponse;
import com.autotech.repairorder.dto.RepairOrderFilter;
import com.autotech.repairorder.dto.RepairOrderRequest;
import com.autotech.repairorder.dto.RepairOrderResponse;
import com.autotech.repairorder.dto.StatusUpdateRequest;
import com.autotech.repairorder.dto.TitleUpdateRequest;
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
}
