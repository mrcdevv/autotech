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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BankAccountServiceImplTest {

    @Mock
    private BankAccountRepository bankAccountRepository;

    @Mock
    private BankRepository bankRepository;

    @Mock
    private BankAccountMapper bankAccountMapper;

    @InjectMocks
    private BankAccountServiceImpl bankAccountService;

    @Test
    void givenAccountsExist_whenGetAll_thenReturnSortedList() {
        BankAccount entity = buildBankAccount(1L);
        BankAccountResponse response = buildBankAccountResponse(1L);
        when(bankAccountRepository.findAllByOrderByAliasAsc()).thenReturn(List.of(entity));
        when(bankAccountMapper.toResponse(entity)).thenReturn(response);

        List<BankAccountResponse> result = bankAccountService.getAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(1L);
    }

    @Test
    void givenValidId_whenGetById_thenReturnBankAccountResponse() {
        BankAccount entity = buildBankAccount(1L);
        BankAccountResponse response = buildBankAccountResponse(1L);
        when(bankAccountRepository.findWithBankById(1L)).thenReturn(Optional.of(entity));
        when(bankAccountMapper.toResponse(entity)).thenReturn(response);

        BankAccountResponse result = bankAccountService.getById(1L);

        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void givenNonExistentId_whenGetById_thenThrowResourceNotFoundException() {
        when(bankAccountRepository.findWithBankById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bankAccountService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenValidRequest_whenCreate_thenReturnBankAccountResponse() {
        BankAccountRequest request = new BankAccountRequest(1L, "Mi Cuenta", "1234567890");
        Bank bank = buildBank(1L);
        BankAccount entity = buildBankAccount(null);
        BankAccount saved = buildBankAccount(1L);
        BankAccountResponse response = buildBankAccountResponse(1L);

        when(bankRepository.findById(1L)).thenReturn(Optional.of(bank));
        when(bankAccountMapper.toEntity(request)).thenReturn(entity);
        when(bankAccountRepository.save(entity)).thenReturn(saved);
        when(bankAccountMapper.toResponse(saved)).thenReturn(response);

        BankAccountResponse result = bankAccountService.create(request);

        assertThat(result.id()).isEqualTo(1L);
        verify(bankAccountRepository).save(entity);
    }

    @Test
    void givenInvalidBankId_whenCreate_thenThrowResourceNotFoundException() {
        BankAccountRequest request = new BankAccountRequest(99L, "Mi Cuenta", null);
        when(bankRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bankAccountService.create(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenValidRequest_whenUpdate_thenReturnUpdatedResponse() {
        BankAccountRequest request = new BankAccountRequest(1L, "Updated Alias", "9999");
        BankAccount entity = buildBankAccount(1L);
        Bank bank = buildBank(1L);
        BankAccountResponse response = buildBankAccountResponse(1L);

        when(bankAccountRepository.findById(1L)).thenReturn(Optional.of(entity));
        when(bankRepository.findById(1L)).thenReturn(Optional.of(bank));
        when(bankAccountRepository.save(entity)).thenReturn(entity);
        when(bankAccountMapper.toResponse(entity)).thenReturn(response);

        BankAccountResponse result = bankAccountService.update(1L, request);

        assertThat(result).isNotNull();
        verify(bankAccountRepository).save(entity);
    }

    @Test
    void givenNonExistentId_whenUpdate_thenThrowResourceNotFoundException() {
        when(bankAccountRepository.findById(99L)).thenReturn(Optional.empty());
        BankAccountRequest request = new BankAccountRequest(1L, "Alias", null);

        assertThatThrownBy(() -> bankAccountService.update(99L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenExistingId_whenDelete_thenDeletesSuccessfully() {
        when(bankAccountRepository.existsById(1L)).thenReturn(true);

        bankAccountService.delete(1L);

        verify(bankAccountRepository).deleteById(1L);
    }

    @Test
    void givenNonExistentId_whenDelete_thenThrowResourceNotFoundException() {
        when(bankAccountRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> bankAccountService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenBanksExist_whenGetAllBanks_thenReturnSortedList() {
        Bank bank = buildBank(1L);
        BankResponse response = new BankResponse(1L, "Banco Test");
        when(bankRepository.findAllByOrderByNameAsc()).thenReturn(List.of(bank));
        when(bankAccountMapper.toBankResponse(bank)).thenReturn(response);

        List<BankResponse> result = bankAccountService.getAllBanks();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("Banco Test");
    }

    @Test
    void givenValidId_whenFindEntityById_thenReturnEntity() {
        BankAccount entity = buildBankAccount(1L);
        when(bankAccountRepository.findById(1L)).thenReturn(Optional.of(entity));

        BankAccount result = bankAccountService.findEntityById(1L);

        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    void givenNonExistentId_whenFindEntityById_thenThrowResourceNotFoundException() {
        when(bankAccountRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bankAccountService.findEntityById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // --- Helpers ---

    private Bank buildBank(Long id) {
        Bank bank = Bank.builder().name("Banco Test").build();
        if (id != null) bank.setId(id);
        return bank;
    }

    private BankAccount buildBankAccount(Long id) {
        Bank bank = buildBank(1L);
        BankAccount ba = BankAccount.builder().bank(bank).alias("Test Alias").cbuCvu("123456").build();
        if (id != null) ba.setId(id);
        return ba;
    }

    private BankAccountResponse buildBankAccountResponse(Long id) {
        return new BankAccountResponse(id, 1L, "Banco Test", "Test Alias", "123456", LocalDateTime.now());
    }
}
