package com.autotech.payment.dto;

import com.autotech.bankaccount.model.Bank;
import com.autotech.bankaccount.model.BankAccount;
import com.autotech.employee.model.Employee;
import com.autotech.deliverynote.model.DeliveryNote;
import com.autotech.deliverynote.model.DeliveryNoteStatus;
import com.autotech.payment.model.Payment;
import com.autotech.payment.model.PaymentType;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class PaymentMapperTest {

    private final PaymentMapper mapper = new PaymentMapper();

    @Test
    void givenPaymentWithAllFields_whenToResponse_thenMapsAllFieldsIncludingEmployeeFullName() {
        DeliveryNote deliveryNote = DeliveryNote.builder().status(DeliveryNoteStatus.PENDIENTE).build();
        deliveryNote.setId(10L);

        Bank bank = Bank.builder().name("Banco Galicia").build();
        bank.setId(1L);

        BankAccount bankAccount = BankAccount.builder().bank(bank).alias("Mi Cuenta").build();
        bankAccount.setId(2L);

        Employee employee = Employee.builder().firstName("Juan").lastName("Perez").build();
        employee.setId(3L);

        Payment payment = Payment.builder()
                .deliveryNote(deliveryNote)
                .paymentDate(LocalDate.of(2025, 1, 15))
                .amount(BigDecimal.valueOf(500))
                .payerName("Test Payer")
                .paymentType(PaymentType.CUENTA_BANCARIA)
                .bankAccount(bankAccount)
                .registeredByEmployee(employee)
                .build();
        payment.setId(1L);
        payment.setCreatedAt(LocalDateTime.now());

        PaymentResponse result = mapper.toResponse(payment);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.deliveryNoteId()).isEqualTo(10L);
        assertThat(result.amount()).isEqualByComparingTo(BigDecimal.valueOf(500));
        assertThat(result.bankAccountId()).isEqualTo(2L);
        assertThat(result.bankAccountAlias()).isEqualTo("Mi Cuenta");
        assertThat(result.bankName()).isEqualTo("Banco Galicia");
        assertThat(result.registeredByEmployeeId()).isEqualTo(3L);
        assertThat(result.registeredByEmployeeFullName()).isEqualTo("Juan Perez");
    }

    @Test
    void givenPaymentWithNullBankAccount_whenToResponse_thenMapsNulls() {
        DeliveryNote deliveryNote = DeliveryNote.builder().status(DeliveryNoteStatus.PENDIENTE).build();
        deliveryNote.setId(10L);

        Payment payment = Payment.builder()
                .deliveryNote(deliveryNote)
                .paymentDate(LocalDate.now())
                .amount(BigDecimal.valueOf(100))
                .paymentType(PaymentType.EFECTIVO)
                .build();
        payment.setId(1L);
        payment.setCreatedAt(LocalDateTime.now());

        PaymentResponse result = mapper.toResponse(payment);

        assertThat(result.bankAccountId()).isNull();
        assertThat(result.bankAccountAlias()).isNull();
        assertThat(result.bankName()).isNull();
        assertThat(result.registeredByEmployeeId()).isNull();
        assertThat(result.registeredByEmployeeFullName()).isNull();
    }

    @Test
    void givenPaymentRequest_whenToEntity_thenIgnoresRelationships() {
        PaymentRequest request = new PaymentRequest(
                LocalDate.of(2025, 1, 15), BigDecimal.valueOf(500),
                "Test Payer", PaymentType.EFECTIVO, 1L, 2L);

        Payment result = mapper.toEntity(request);

        assertThat(result.getPaymentDate()).isEqualTo(LocalDate.of(2025, 1, 15));
        assertThat(result.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(500));
        assertThat(result.getPaymentType()).isEqualTo(PaymentType.EFECTIVO);
        assertThat(result.getDeliveryNote()).isNull();
        assertThat(result.getBankAccount()).isNull();
        assertThat(result.getRegisteredByEmployee()).isNull();
    }
}
