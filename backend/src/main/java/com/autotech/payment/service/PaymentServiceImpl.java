package com.autotech.payment.service;

import com.autotech.bankaccount.model.BankAccount;
import com.autotech.bankaccount.service.BankAccountService;
import com.autotech.common.exception.BusinessException;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.employee.model.Employee;
import com.autotech.employee.repository.EmployeeRepository;
import com.autotech.email.service.EmailNotificationService;
import com.autotech.deliverynote.dto.DeliveryNoteDetailResponse;
import com.autotech.deliverynote.model.DeliveryNote;
import com.autotech.deliverynote.repository.DeliveryNoteRepository;
import com.autotech.deliverynote.service.DeliveryNoteService;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentAuditLogRepository auditLogRepository;
    private final PaymentMapper paymentMapper;
    private final DeliveryNoteService deliveryNoteService;
    private final DeliveryNoteRepository deliveryNoteRepository;
    private final EmployeeRepository employeeRepository;
    private final BankAccountService bankAccountService;
    private final ObjectMapper objectMapper;
    private final EmailNotificationService emailNotificationService;

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getByDeliveryNoteId(Long deliveryNoteId) {
        log.debug("Fetching payments for delivery note {}", deliveryNoteId);
        return paymentRepository.findByDeliveryNoteIdOrderByPaymentDateDesc(deliveryNoteId).stream()
                .map(paymentMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getById(Long paymentId) {
        log.debug("Fetching payment with id {}", paymentId);
        Payment payment = paymentRepository.findWithDetailsById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", paymentId));
        return paymentMapper.toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentSummaryResponse getSummary(Long deliveryNoteId) {
        log.debug("Calculating payment summary for delivery note {}", deliveryNoteId);
        DeliveryNoteDetailResponse deliveryNote = deliveryNoteService.getById(deliveryNoteId);

        BigDecimal totalServices = deliveryNote.services().stream()
                .map(s -> s.price())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalProducts = deliveryNote.products().stream()
                .map(p -> p.totalPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal subtotal = totalServices.add(totalProducts);

        BigDecimal discountAmount = subtotal
                .multiply(deliveryNote.discountPercentage())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal afterDiscount = subtotal.subtract(discountAmount);

        BigDecimal taxPercentage = deliveryNote.taxPercentage() != null
                ? deliveryNote.taxPercentage()
                : BigDecimal.ZERO;
        BigDecimal taxAmount = afterDiscount
                .multiply(taxPercentage)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal total = afterDiscount.add(taxAmount);

        BigDecimal totalPaid = paymentRepository.sumAmountByDeliveryNoteId(deliveryNoteId);

        BigDecimal remaining = total.subtract(totalPaid).max(BigDecimal.ZERO);

        return new PaymentSummaryResponse(
                totalServices,
                totalProducts,
                discountAmount,
                taxAmount,
                total,
                totalPaid,
                remaining
        );
    }

    @Override
    @Transactional
    public PaymentResponse create(Long deliveryNoteId, PaymentRequest request) {
        deliveryNoteService.getById(deliveryNoteId);

        PaymentSummaryResponse summary = getSummary(deliveryNoteId);
        if (summary.remaining().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("El remito ya se encuentra completamente pagado");
        }

        if (request.amount().compareTo(summary.remaining()) > 0) {
            throw new BusinessException("El monto del pago no puede superar el restante por pagar ($" + summary.remaining() + ")");
        }

        validateBankAccountRequirement(request);

        Payment payment = paymentMapper.toEntity(request);

        DeliveryNote deliveryNote = deliveryNoteRepository.findById(deliveryNoteId)
                .orElseThrow(() -> new ResourceNotFoundException("DeliveryNote", deliveryNoteId));
        payment.setDeliveryNote(deliveryNote);

        if (request.paymentType() == PaymentType.CUENTA_BANCARIA && request.bankAccountId() != null) {
            BankAccount bankAccount = bankAccountService.findEntityById(request.bankAccountId());
            payment.setBankAccount(bankAccount);
        }

        if (request.registeredByEmployeeId() != null) {
            Employee employee = employeeRepository.findById(request.registeredByEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", request.registeredByEmployeeId()));
            payment.setRegisteredByEmployee(employee);
        }

        Payment saved = paymentRepository.save(payment);
        log.info("Created payment with id {} for delivery note {}", saved.getId(), deliveryNoteId);

        createAuditLog(saved, AuditAction.CREATED, null, saved, request.registeredByEmployeeId());

        BigDecimal newTotalPaid = paymentRepository.sumAmountByDeliveryNoteId(deliveryNoteId);
        if (newTotalPaid.compareTo(summary.total()) >= 0) {
            deliveryNoteService.updateStatusToPagada(deliveryNoteId);
            log.info("Delivery note {} auto-updated to PAGADA (fully paid)", deliveryNoteId);
        }

        Payment savedWithDetails = paymentRepository.findWithDetailsById(saved.getId()).orElse(saved);
        emailNotificationService.notifyPaymentRegistered(savedWithDetails, getSummary(deliveryNoteId));
        return paymentMapper.toResponse(savedWithDetails);
    }

    @Override
    @Transactional
    public PaymentResponse update(Long paymentId, PaymentRequest request) {
        Payment existing = paymentRepository.findWithDetailsById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", paymentId));

        Long deliveryNoteId = existing.getDeliveryNote().getId();

        Payment oldSnapshot = snapshotPayment(existing);

        PaymentSummaryResponse summary = getSummary(deliveryNoteId);
        BigDecimal remainingWithoutThis = summary.remaining().add(existing.getAmount());

        if (request.amount().compareTo(remainingWithoutThis) > 0) {
            throw new BusinessException("El monto del pago no puede superar el restante por pagar ($" + remainingWithoutThis + ")");
        }

        validateBankAccountRequirement(request);

        existing.setPaymentDate(request.paymentDate());
        existing.setAmount(request.amount());
        existing.setPayerName(request.payerName());
        existing.setPaymentType(request.paymentType());

        if (request.paymentType() == PaymentType.CUENTA_BANCARIA && request.bankAccountId() != null) {
            BankAccount bankAccount = bankAccountService.findEntityById(request.bankAccountId());
            existing.setBankAccount(bankAccount);
        } else {
            existing.setBankAccount(null);
        }

        Payment saved = paymentRepository.save(existing);
        log.info("Updated payment with id {}", saved.getId());

        createAuditLog(saved, AuditAction.MODIFIED, oldSnapshot, saved, request.registeredByEmployeeId());

        updateDeliveryNotePaidStatus(deliveryNoteId);

        return paymentMapper.toResponse(
                paymentRepository.findWithDetailsById(saved.getId()).orElse(saved)
        );
    }

    @Override
    @Transactional
    public void delete(Long paymentId, Long performedByEmployeeId) {
        Payment existing = paymentRepository.findWithDetailsById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", paymentId));

        Long deliveryNoteId = existing.getDeliveryNote().getId();

        createAuditLog(existing, AuditAction.DELETED, existing, null, performedByEmployeeId);

        paymentRepository.delete(existing);
        log.info("Deleted payment with id {}", paymentId);

        updateDeliveryNotePaidStatus(deliveryNoteId);
    }

    private void validateBankAccountRequirement(PaymentRequest request) {
        if (request.paymentType() == PaymentType.CUENTA_BANCARIA && request.bankAccountId() == null) {
            throw new BusinessException("Se debe seleccionar una cuenta bancaria para pagos de tipo CUENTA_BANCARIA");
        }
    }

    private void createAuditLog(Payment payment, AuditAction action,
                                 Payment oldPayment, Payment newPayment,
                                 Long performedByEmployeeId) {
        PaymentAuditLog auditLog = PaymentAuditLog.builder()
                .payment(action == AuditAction.DELETED ? null : payment)
                .action(action)
                .oldValues(oldPayment != null ? serializePaymentToJson(oldPayment) : null)
                .newValues(newPayment != null ? serializePaymentToJson(newPayment) : null)
                .performedByEmployee(performedByEmployeeId != null
                        ? employeeRepository.findById(performedByEmployeeId).orElse(null)
                        : null)
                .build();

        auditLogRepository.save(auditLog);
        log.debug("Created audit log: action={}, paymentId={}", action, payment.getId());
    }

    private String serializePaymentToJson(Payment payment) {
        try {
            Map<String, Object> values = new LinkedHashMap<>();
            values.put("paymentDate", payment.getPaymentDate().toString());
            values.put("amount", payment.getAmount().toString());
            values.put("payerName", payment.getPayerName() != null ? payment.getPayerName() : "");
            values.put("paymentType", payment.getPaymentType().name());
            values.put("bankAccountId", payment.getBankAccount() != null ? payment.getBankAccount().getId() : "");
            return objectMapper.writeValueAsString(values);
        } catch (Exception e) {
            log.error("Failed to serialize payment to JSON", e);
            return "{}";
        }
    }

    private Payment snapshotPayment(Payment original) {
        return Payment.builder()
                .paymentDate(original.getPaymentDate())
                .amount(original.getAmount())
                .payerName(original.getPayerName())
                .paymentType(original.getPaymentType())
                .bankAccount(original.getBankAccount())
                .build();
    }

    private void updateDeliveryNotePaidStatus(Long deliveryNoteId) {
        PaymentSummaryResponse summary = getSummary(deliveryNoteId);
        if (summary.remaining().compareTo(BigDecimal.ZERO) <= 0) {
            deliveryNoteService.updateStatusToPagada(deliveryNoteId);
        } else {
            deliveryNoteService.updateStatusToPendiente(deliveryNoteId);
        }
    }
}
