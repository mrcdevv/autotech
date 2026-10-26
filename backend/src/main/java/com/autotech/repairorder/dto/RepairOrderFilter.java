package com.autotech.repairorder.dto;

import com.autotech.repairorder.model.RepairOrderStatus;

import java.time.LocalDate;
import java.util.List;

public record RepairOrderFilter(
        List<RepairOrderStatus> statuses,
        LocalDate createdFrom,
        LocalDate createdTo,
        LocalDate updatedFrom,
        LocalDate updatedTo,
        Long employeeId,
        Long tagId,
        String query
) {
}
