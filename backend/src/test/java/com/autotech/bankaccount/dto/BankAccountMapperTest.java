package com.autotech.bankaccount.dto;

import com.autotech.bankaccount.model.Bank;
import com.autotech.bankaccount.model.BankAccount;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class BankAccountMapperTest {

    private final BankAccountMapper mapper = new BankAccountMapper();

    @Test
    void givenBankAccount_whenToResponse_thenMapsAllFieldsIncludingBankName() {
        Bank bank = Bank.builder().name("Banco Galicia").build();
        bank.setId(1L);

        BankAccount entity = BankAccount.builder().bank(bank).alias("Mi Cuenta").cbuCvu("123456").build();
        entity.setId(2L);
        entity.setCreatedAt(LocalDateTime.now());

        BankAccountResponse result = mapper.toResponse(entity);

        assertThat(result.id()).isEqualTo(2L);
        assertThat(result.bankId()).isEqualTo(1L);
        assertThat(result.bankName()).isEqualTo("Banco Galicia");
        assertThat(result.alias()).isEqualTo("Mi Cuenta");
        assertThat(result.cbuCvu()).isEqualTo("123456");
    }

    @Test
    void givenBank_whenToBankResponse_thenMapsAllFields() {
        Bank bank = Bank.builder().name("BBVA Frances").build();
        bank.setId(5L);

        BankResponse result = mapper.toBankResponse(bank);

        assertThat(result.id()).isEqualTo(5L);
        assertThat(result.name()).isEqualTo("BBVA Frances");
    }

    @Test
    void givenBankAccountRequest_whenToEntity_thenIgnoresRelationships() {
        BankAccountRequest request = new BankAccountRequest(1L, "Test Alias", "999999");

        BankAccount result = mapper.toEntity(request);

        assertThat(result.getAlias()).isEqualTo("Test Alias");
        assertThat(result.getCbuCvu()).isEqualTo("999999");
        assertThat(result.getBank()).isNull();
        assertThat(result.getId()).isNull();
    }
}
