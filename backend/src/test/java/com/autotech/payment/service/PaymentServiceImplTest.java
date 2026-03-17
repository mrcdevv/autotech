package com.autotech.payment.service;

import com.autotech.bankaccount.model.Bank;
import com.autotech.bankaccount.model.BankAccount;
import com.autotech.bankaccount.service.BankAccountService;
import com.autotech.common.exception.BusinessException;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.employee.repository.EmployeeRepository;
import com.autotech.invoice.dto.InvoiceDetailResponse;
import com.autotech.invoice.dto.InvoiceProductResponse;
import com.autotech.invoice.dto.InvoiceServiceItemResponse;
import com.autotech.invoice.model.Invoice;
import com.autotech.invoice.model.InvoiceStatus;
import com.autotech.invoice.repository.InvoiceRepository;
import com.autotech.invoice.service.InvoiceService;
import com.autotech.payment.dto.PaymentMapper;
import com.autotech.payment.dto.PaymentRequest;
import com.autotech.payment.dto.PaymentResponse;
import com.autotech.payment.dto.PaymentSummaryResponse;
import com.autotech.payment.model.AuditAction;
import com.autotech.payment.model.Payment;
import com.autotech.payment.model.PaymentAuditLog;
import com.autotech.payment.model.PaymentType;
import com.autotech.payment.repository.PaymentAuditLogRepository;
import com.autotech.payment.repository.PaymentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentAuditLogRepository auditLogRepository;

    @Mock
    private PaymentMapper paymentMapper;

    @Mock
    private InvoiceService invoiceService;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private BankAccountService bankAccountService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private PaymentServiceImpl paymentService;

    @Test
    void givenPaymentsExist_whenGetByInvoiceId_thenReturnPaymentList() {
        Payment payment = buildPayment(1L);
        PaymentResponse response = buildPaymentResponse(1L);
        when(paymentRepository.findByInvoiceIdOrderByPaymentDateDesc(10L)).thenReturn(List.of(payment));
        when(paymentMapper.toResponse(payment)).thenReturn(response);

        List<PaymentResponse> result = paymentService.getByInvoiceId(10L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(1L);
    }

    @Test
    void givenNoPayments_whenGetByInvoiceId_thenReturnEmptyList() {
        when(paymentRepository.findByInvoiceIdOrderByPaymentDateDesc(10L)).thenReturn(Collections.emptyList());

        List<PaymentResponse> result = paymentService.getByInvoiceId(10L);

        assertThat(result).isEmpty();
    }

    @Test
    void givenValidId_whenGetById_thenReturnPaymentResponse() {
        Payment payment = buildPayment(1L);
        PaymentResponse response = buildPaymentResponse(1L);
        when(paymentRepository.findWithDetailsById(1L)).thenReturn(Optional.of(payment));
        when(paymentMapper.toResponse(payment)).thenReturn(response);

        PaymentResponse result = paymentService.getById(1L);

        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void givenNonExistentId_whenGetById_thenThrowResourceNotFoundException() {
        when(paymentRepository.findWithDetailsById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenInvoiceWithPayments_whenGetSummary_thenCalculateAllFieldsCorrectly() {
        InvoiceDetailResponse invoice = buildInvoiceDetailResponse();
        when(invoiceService.getById(10L)).thenReturn(invoice);
        when(paymentRepository.sumAmountByInvoiceId(10L)).thenReturn(BigDecimal.valueOf(500));

        PaymentSummaryResponse result = paymentService.getSummary(10L);

        // services=1000, products=200, subtotal=1200, discount(10%)=120, after=1080, tax(21%)=226.80, total=1306.80
        assertThat(result.totalServices()).isEqualByComparingTo(BigDecimal.valueOf(1000));
        assertThat(result.totalProducts()).isEqualByComparingTo(BigDecimal.valueOf(200));
        assertThat(result.discountAmount()).isEqualByComparingTo(BigDecimal.valueOf(120));
        assertThat(result.taxAmount()).isEqualByComparingTo(new BigDecimal("226.80"));
        assertThat(result.total()).isEqualByComparingTo(new BigDecimal("1306.80"));
        assertThat(result.totalPaid()).isEqualByComparingTo(BigDecimal.valueOf(500));
        assertThat(result.remaining()).isEqualByComparingTo(new BigDecimal("806.80"));
    }

    @Test
    void givenNoPayments_whenGetSummary_thenRemainingEqualsTotal() {
        InvoiceDetailResponse invoice = buildInvoiceDetailResponse();
        when(invoiceService.getById(10L)).thenReturn(invoice);
        when(paymentRepository.sumAmountByInvoiceId(10L)).thenReturn(BigDecimal.ZERO);

        PaymentSummaryResponse result = paymentService.getSummary(10L);

        assertThat(result.remaining()).isEqualByComparingTo(result.total());
    }

    @Test
    void givenFullyPaid_whenGetSummary_thenRemainingIsZero() {
        InvoiceDetailResponse invoice = buildInvoiceDetailResponse();
        when(invoiceService.getById(10L)).thenReturn(invoice);
        when(paymentRepository.sumAmountByInvoiceId(10L)).thenReturn(new BigDecimal("1306.80"));

        PaymentSummaryResponse result = paymentService.getSummary(10L);

        assertThat(result.remaining()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void givenValidCashRequest_whenCreate_thenReturnPaymentResponse() {
        PaymentRequest request = new PaymentRequest(
                LocalDate.now(), BigDecimal.valueOf(500), "Juan", PaymentType.EFECTIVO, null, null);
        setupCreateMocks(BigDecimal.valueOf(500));

        PaymentResponse result = paymentService.create(10L, request);

        assertThat(result).isNotNull();
        verify(paymentRepository).save(any(Payment.class));
        verify(auditLogRepository).save(any(PaymentAuditLog.class));
    }

    @Test
    void givenValidBankRequest_whenCreate_thenSetsBankAccount() {
        PaymentRequest request = new PaymentRequest(
                LocalDate.now(), BigDecimal.valueOf(500), "Juan", PaymentType.CUENTA_BANCARIA, 1L, null);
        setupCreateMocks(BigDecimal.valueOf(500));
        BankAccount bankAccount = buildBankAccount(1L);
        when(bankAccountService.findEntityById(1L)).thenReturn(bankAccount);

        PaymentResponse result = paymentService.create(10L, request);

        assertThat(result).isNotNull();
        verify(bankAccountService).findEntityById(1L);
    }

    @Test
    void givenBankPaymentWithoutBankAccountId_whenCreate_thenThrowBusinessException() {
        PaymentRequest request = new PaymentRequest(
                LocalDate.now(), BigDecimal.valueOf(500), null, PaymentType.CUENTA_BANCARIA, null, null);
        setupSummaryMocks();

        assertThatThrownBy(() -> paymentService.create(10L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("cuenta bancaria");
    }

    @Test
    void givenAmountExceedsRemaining_whenCreate_thenThrowBusinessException() {
        PaymentRequest request = new PaymentRequest(
                LocalDate.now(), BigDecimal.valueOf(2000), null, PaymentType.EFECTIVO, null, null);
        setupSummaryMocks();

        assertThatThrownBy(() -> paymentService.create(10L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("restante por pagar");
    }

    @Test
    void givenInvoiceFullyPaid_whenCreate_thenThrowBusinessException() {
        PaymentRequest request = new PaymentRequest(
                LocalDate.now(), BigDecimal.valueOf(100), null, PaymentType.EFECTIVO, null, null);
        InvoiceDetailResponse invoice = buildInvoiceDetailResponse();
        when(invoiceService.getById(10L)).thenReturn(invoice);
        when(paymentRepository.sumAmountByInvoiceId(10L)).thenReturn(new BigDecimal("1306.80"));

        assertThatThrownBy(() -> paymentService.create(10L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("completamente pagada");
    }

    @Test
    void givenPaymentCreated_whenCreate_thenCreatesAuditLogWithCreatedAction() {
        PaymentRequest request = new PaymentRequest(
                LocalDate.now(), BigDecimal.valueOf(500), "Juan", PaymentType.EFECTIVO, null, null);
        setupCreateMocks(BigDecimal.valueOf(500));

        paymentService.create(10L, request);

        ArgumentCaptor<PaymentAuditLog> captor = ArgumentCaptor.forClass(PaymentAuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        assertThat(captor.getValue().getAction()).isEqualTo(AuditAction.CREATED);
        assertThat(captor.getValue().getOldValues()).isNull();
        assertThat(captor.getValue().getNewValues()).isNotNull();
    }

    @Test
    void givenPaymentFullyPaysInvoice_whenCreate_thenUpdatesStatusToPagada() {
        PaymentRequest request = new PaymentRequest(
                LocalDate.now(), new BigDecimal("1306.80"), null, PaymentType.EFECTIVO, null, null);
        InvoiceDetailResponse invoice = buildInvoiceDetailResponse();
        when(invoiceService.getById(10L)).thenReturn(invoice);
        when(paymentRepository.sumAmountByInvoiceId(10L))
                .thenReturn(BigDecimal.ZERO)
                .thenReturn(new BigDecimal("1306.80"));

        Invoice invoiceEntity = buildInvoiceEntity(10L);
        when(invoiceRepository.findById(10L)).thenReturn(Optional.of(invoiceEntity));

        Payment mapped = buildPayment(1L);
        when(paymentMapper.toEntity(request)).thenReturn(mapped);
        when(paymentRepository.save(any(Payment.class))).thenReturn(mapped);
        when(paymentRepository.findWithDetailsById(1L)).thenReturn(Optional.of(mapped));

        PaymentResponse response = buildPaymentResponse(1L);
        when(paymentMapper.toResponse(mapped)).thenReturn(response);

        paymentService.create(10L, request);

        verify(invoiceService).updateStatusToPagada(10L);
    }

    @Test
    void givenValidRequest_whenUpdate_thenReturnUpdatedPaymentResponse() {
        Payment existing = buildPayment(1L);
        PaymentRequest request = new PaymentRequest(
                LocalDate.now(), BigDecimal.valueOf(300), "Updated", PaymentType.EFECTIVO, null, null);
        PaymentResponse response = buildPaymentResponse(1L);

        when(paymentRepository.findWithDetailsById(1L)).thenReturn(Optional.of(existing));
        setupSummaryMocksForUpdate();
        when(paymentRepository.save(any(Payment.class))).thenReturn(existing);
        when(paymentMapper.toResponse(existing)).thenReturn(response);

        PaymentResponse result = paymentService.update(1L, request);

        assertThat(result).isNotNull();
        verify(paymentRepository).save(any(Payment.class));
    }

    @Test
    void givenNonExistentId_whenUpdate_thenThrowResourceNotFoundException() {
        when(paymentRepository.findWithDetailsById(99L)).thenReturn(Optional.empty());
        PaymentRequest request = new PaymentRequest(
                LocalDate.now(), BigDecimal.valueOf(100), null, PaymentType.EFECTIVO, null, null);

        assertThatThrownBy(() -> paymentService.update(99L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenAmountExceedsRemaining_whenUpdate_thenThrowBusinessException() {
        Payment existing = buildPayment(1L);
        when(paymentRepository.findWithDetailsById(1L)).thenReturn(Optional.of(existing));
        setupSummaryMocksForUpdate();

        PaymentRequest request = new PaymentRequest(
                LocalDate.now(), BigDecimal.valueOf(5000), null, PaymentType.EFECTIVO, null, null);

        assertThatThrownBy(() -> paymentService.update(1L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("restante por pagar");
    }

    @Test
    void givenPaymentUpdated_whenUpdate_thenCreatesAuditLogWithModifiedAction() {
        Payment existing = buildPayment(1L);
        PaymentRequest request = new PaymentRequest(
                LocalDate.now(), BigDecimal.valueOf(300), "Updated", PaymentType.EFECTIVO, null, null);
        PaymentResponse response = buildPaymentResponse(1L);

        when(paymentRepository.findWithDetailsById(1L)).thenReturn(Optional.of(existing));
        setupSummaryMocksForUpdate();
        when(paymentRepository.save(any(Payment.class))).thenReturn(existing);
        when(paymentMapper.toResponse(existing)).thenReturn(response);

        paymentService.update(1L, request);

        ArgumentCaptor<PaymentAuditLog> captor = ArgumentCaptor.forClass(PaymentAuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        assertThat(captor.getValue().getAction()).isEqualTo(AuditAction.MODIFIED);
        assertThat(captor.getValue().getOldValues()).isNotNull();
        assertThat(captor.getValue().getNewValues()).isNotNull();
    }

    @Test
    void givenExistingPayment_whenDelete_thenDeletesSuccessfully() {
        Payment existing = buildPayment(1L);
        when(paymentRepository.findWithDetailsById(1L)).thenReturn(Optional.of(existing));
        setupSummaryMocksForDelete();

        paymentService.delete(1L, 5L);

        verify(paymentRepository).delete(existing);
    }

    @Test
    void givenNonExistentId_whenDelete_thenThrowResourceNotFoundException() {
        when(paymentRepository.findWithDetailsById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.delete(99L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenPaymentDeleted_whenDelete_thenCreatesAuditLogWithDeletedAction() {
        Payment existing = buildPayment(1L);
        when(paymentRepository.findWithDetailsById(1L)).thenReturn(Optional.of(existing));
        setupSummaryMocksForDelete();

        paymentService.delete(1L, 5L);

        ArgumentCaptor<PaymentAuditLog> captor = ArgumentCaptor.forClass(PaymentAuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        assertThat(captor.getValue().getAction()).isEqualTo(AuditAction.DELETED);
        assertThat(captor.getValue().getOldValues()).isNotNull();
        assertThat(captor.getValue().getNewValues()).isNull();
    }

    @Test
    void givenPaymentDeleted_whenDelete_thenRevertsInvoiceStatusToPendiente() {
        Payment existing = buildPayment(1L);
        when(paymentRepository.findWithDetailsById(1L)).thenReturn(Optional.of(existing));

        InvoiceDetailResponse invoice = buildInvoiceDetailResponse();
        when(invoiceService.getById(10L)).thenReturn(invoice);
        when(paymentRepository.sumAmountByInvoiceId(10L)).thenReturn(BigDecimal.valueOf(500));

        paymentService.delete(1L, 5L);

        verify(invoiceService).updateStatusToPendiente(10L);
    }

    // --- Helpers ---

    private void setupSummaryMocks() {
        InvoiceDetailResponse invoice = buildInvoiceDetailResponse();
        when(invoiceService.getById(10L)).thenReturn(invoice);
        when(paymentRepository.sumAmountByInvoiceId(10L)).thenReturn(BigDecimal.ZERO);
    }

    private void setupSummaryMocksForUpdate() {
        InvoiceDetailResponse invoice = buildInvoiceDetailResponse();
        when(invoiceService.getById(10L)).thenReturn(invoice);
        when(paymentRepository.sumAmountByInvoiceId(10L)).thenReturn(BigDecimal.valueOf(500));
    }

    private void setupSummaryMocksForDelete() {
        InvoiceDetailResponse invoice = buildInvoiceDetailResponse();
        when(invoiceService.getById(10L)).thenReturn(invoice);
        when(paymentRepository.sumAmountByInvoiceId(10L)).thenReturn(BigDecimal.valueOf(500));
    }

    private void setupCreateMocks(BigDecimal amount) {
        InvoiceDetailResponse invoice = buildInvoiceDetailResponse();
        when(invoiceService.getById(10L)).thenReturn(invoice);
        when(paymentRepository.sumAmountByInvoiceId(10L))
                .thenReturn(BigDecimal.ZERO)
                .thenReturn(amount);

        Invoice invoiceEntity = buildInvoiceEntity(10L);
        when(invoiceRepository.findById(10L)).thenReturn(Optional.of(invoiceEntity));

        Payment mapped = buildPayment(1L);
        when(paymentMapper.toEntity(any(PaymentRequest.class))).thenReturn(mapped);
        when(paymentRepository.save(any(Payment.class))).thenReturn(mapped);
        when(paymentRepository.findWithDetailsById(1L)).thenReturn(Optional.of(mapped));

        PaymentResponse response = buildPaymentResponse(1L);
        when(paymentMapper.toResponse(mapped)).thenReturn(response);
    }

    private Payment buildPayment(Long id) {
        Invoice invoice = buildInvoiceEntity(10L);
        Payment payment = Payment.builder()
                .invoice(invoice)
                .paymentDate(LocalDate.now())
                .amount(BigDecimal.valueOf(500))
                .payerName("Juan Perez")
                .paymentType(PaymentType.EFECTIVO)
                .build();
        payment.setId(id);
        payment.setCreatedAt(LocalDateTime.now());
        payment.setUpdatedAt(LocalDateTime.now());
        return payment;
    }

    private Invoice buildInvoiceEntity(Long id) {
        Invoice invoice = Invoice.builder()
                .status(InvoiceStatus.PENDIENTE)
                .discountPercentage(BigDecimal.valueOf(10))
                .taxPercentage(BigDecimal.valueOf(21))
                .total(new BigDecimal("1306.80"))
                .build();
        invoice.setId(id);
        return invoice;
    }

    private PaymentResponse buildPaymentResponse(Long id) {
        return new PaymentResponse(
                id, 10L, LocalDate.now(), LocalDateTime.now(),
                BigDecimal.valueOf(500), "Juan Perez", PaymentType.EFECTIVO,
                null, null, null, null, null);
    }

    private InvoiceDetailResponse buildInvoiceDetailResponse() {
        return new InvoiceDetailResponse(
                10L, 1L, "Juan Perez", "12345678", "1234567890", null, "PERSONAL",
                2L, "ABC123", null, "Corolla", 2020, null, null,
                InvoiceStatus.PENDIENTE, BigDecimal.valueOf(10), BigDecimal.valueOf(21),
                new BigDecimal("1306.80"),
                List.of(new InvoiceServiceItemResponse(1L, "Service A", BigDecimal.valueOf(1000))),
                List.of(new InvoiceProductResponse(1L, "Product A", 2, BigDecimal.valueOf(100), BigDecimal.valueOf(200))),
                LocalDateTime.now(), LocalDateTime.now());
    }

    private BankAccount buildBankAccount(Long id) {
        Bank bank = Bank.builder().name("Banco Test").build();
        bank.setId(1L);
        BankAccount ba = BankAccount.builder().bank(bank).alias("Test Alias").cbuCvu("123456").build();
        ba.setId(id);
        return ba;
    }
}
