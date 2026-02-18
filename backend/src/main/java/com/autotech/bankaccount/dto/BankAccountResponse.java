package com.autotech.bankaccount.dto;

import java.time.LocalDateTime;

public record BankAccountResponse(
        Long id,
        Long bankId,
        String bankName,
        String alias,
        String cbuCvu,
        LocalDateTime createdAt
) {}
