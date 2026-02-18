package com.autotech.bankaccount.service;

import com.autotech.bankaccount.dto.BankAccountMapper;
import com.autotech.bankaccount.dto.BankAccountRequest;
import com.autotech.bankaccount.dto.BankAccountResponse;
import com.autotech.bankaccount.dto.BankResponse;
import com.autotech.bankaccount.model.Bank;
import com.autotech.bankaccount.model.BankAccount;
import com.autotech.bankaccount.repository.BankAccountRepository;
import com.autotech.bankaccount.repository.BankRepository;
import com.autotech.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BankAccountServiceImpl implements BankAccountService {

    private final BankAccountRepository bankAccountRepository;
    private final BankRepository bankRepository;
    private final BankAccountMapper bankAccountMapper;

    @Override
    @Transactional(readOnly = true)
    public List<BankAccountResponse> getAll() {
        log.debug("Fetching all bank accounts");
        return bankAccountRepository.findAllByOrderByAliasAsc().stream()
                .map(bankAccountMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BankAccountResponse getById(Long id) {
        log.debug("Fetching bank account with id {}", id);
        BankAccount entity = bankAccountRepository.findWithBankById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", id));
        return bankAccountMapper.toResponse(entity);
    }

    @Override
    @Transactional
    public BankAccountResponse create(BankAccountRequest request) {
        Bank bank = bankRepository.findById(request.bankId())
                .orElseThrow(() -> new ResourceNotFoundException("Bank", request.bankId()));

        BankAccount entity = bankAccountMapper.toEntity(request);
        entity.setBank(bank);

        BankAccount saved = bankAccountRepository.save(entity);
        log.info("Created bank account with id {}", saved.getId());
        return bankAccountMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public BankAccountResponse update(Long id, BankAccountRequest request) {
        BankAccount entity = bankAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", id));

        Bank bank = bankRepository.findById(request.bankId())
                .orElseThrow(() -> new ResourceNotFoundException("Bank", request.bankId()));

        entity.setBank(bank);
        entity.setAlias(request.alias());
        entity.setCbuCvu(request.cbuCvu());

        BankAccount saved = bankAccountRepository.save(entity);
        log.info("Updated bank account with id {}", saved.getId());
        return bankAccountMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!bankAccountRepository.existsById(id)) {
            throw new ResourceNotFoundException("BankAccount", id);
        }
        bankAccountRepository.deleteById(id);
        log.info("Deleted bank account with id {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BankResponse> getAllBanks() {
        log.debug("Fetching all banks");
        return bankRepository.findAllByOrderByNameAsc().stream()
                .map(bankAccountMapper::toBankResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BankAccount findEntityById(Long id) {
        return bankAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", id));
    }
}
