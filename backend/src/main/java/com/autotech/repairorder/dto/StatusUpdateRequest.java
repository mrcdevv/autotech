package com.autotech.repairorder.dto;

import com.autotech.repairorder.model.RepairOrderStatus;
import jakarta.validation.constraints.NotNull;

public record StatusUpdateRequest(

        @NotNull(message = "El nuevo estado es obligatorio")
        RepairOrderStatus newStatus
) {}
