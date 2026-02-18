package com.autotech.bankaccount.service;

import com.autotech.bankaccount.dto.BankAccountRequest;
import com.autotech.bankaccount.dto.BankAccountResponse;
import com.autotech.bankaccount.dto.BankResponse;
import com.autotech.bankaccount.model.BankAccount;

import java.util.List;

public interface BankAccountService {

    List<BankAccountResponse> getAll();

    BankAccountResponse getById(Long id);

    BankAccountResponse create(BankAccountRequest request);

    BankAccountResponse update(Long id, BankAccountRequest request);

    void delete(Long id);

    List<BankResponse> getAllBanks();

    BankAccount findEntityById(Long id);
}
