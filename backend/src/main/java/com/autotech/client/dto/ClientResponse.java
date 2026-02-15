package com.autotech.client.dto;

import com.autotech.client.model.ClientType;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ClientResponse(
        Long id,
        String firstName,
        String lastName,
        String dni,
        String commercialName,
        String email,
        String phone,
        String address,
        String province,
        String country,
        ClientType clientType,
        LocalDate entryDate,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
