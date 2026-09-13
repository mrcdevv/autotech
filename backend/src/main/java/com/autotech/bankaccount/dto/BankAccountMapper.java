package com.autotech.bankaccount.dto;

import com.autotech.bankaccount.model.Bank;
import com.autotech.bankaccount.model.BankAccount;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class BankAccountMapper {

    public BankAccountResponse toResponse(BankAccount entity) {
        if (entity == null) return null;
        return new BankAccountResponse(
                entity.getId(),
                entity.getBank().getId(),
                entity.getBank().getName(),
                entity.getAlias(),
                entity.getCbuCvu(),
                entity.getCreatedAt()
        );
    }

    public BankResponse toBankResponse(Bank entity) {
        if (entity == null) return null;
        return new BankResponse(
                entity.getId(),
                entity.getName()
        );
    }

    public BankAccount toEntity(BankAccountRequest request) {
        if (request == null) return null;
        return BankAccount.builder()
                .alias(request.alias())
                .cbuCvu(request.cbuCvu())
                .build();
    }

    public List<BankAccountResponse> toResponseList(List<BankAccount> entities) {
        if (entities == null) return null;
        return entities.stream().map(this::toResponse).toList();
    }
}
