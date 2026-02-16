# 10 — Pagos (Payments)

## 1. Overview

This feature implements full management for **Payments (Pagos)** — the ability to register, modify, and delete payments against invoices. Payments live inside the **"Pagos"** tab of an invoice detail view (both standalone invoices at `/facturas/:id` and the "Factura" tab within a repair order detail at `/ordenes-de-trabajo/:id`). There are no standalone payment pages or routes — payments are always accessed in the context of their parent invoice.

Key capabilities:
- Register cash (`EFECTIVO`) and bank account (`CUENTA_BANCARIA`) payments against an invoice.
- Payment summary showing total services, total parts, taxes (monetary), discount (monetary), grand total, total paid to date, and remaining balance.
- Payment history grid with modify and delete actions.
- Full audit trail: every payment mutation (create, modify, delete) is logged in `payment_audit_log` with JSONB snapshots of old/new values.
- Automatic invoice status transition: invoice moves to `PAGADA` when fully paid (remaining = 0).
- Bank account management (CRUD for bank accounts used in bank payments, managed from the configuration screen).

**Dependencies**: Invoices (spec 09), Employees (spec 01), Clients (spec 02), Bank Accounts (configuration — spec 11).

---

## 2. Git

| Item | Value |
|---|---|
| Branch | `feature/pagos` |
| Base | `develop` |
| Commit style | Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`) |

Example commits:
- `feat: add Payment, PaymentAuditLog, BankAccount, Bank entities`
- `feat: add payment CRUD endpoints under /api/invoices/{id}/payments`
- `feat: add bank accounts endpoint /api/bank-accounts`
- `feat: add PaymentsTab component with summary, dialogs, and history grid`
- `feat: add automatic audit logging on payment mutations`
- `feat: add invoice auto-status update to PAGADA when fully paid`
- `test: add unit tests for PaymentService`

---

## 3. DB Tables

All tables already exist in `V1__init_schema.sql`. No new migration needed.

### 3.1 `banks`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `name` | `VARCHAR(100)` | NOT NULL, UNIQUE |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |

Pre-seeded with Argentine banks: Mercadopago, Banco de Cordoba, BBVA Frances, Banco Galicia, Banco Santander, Banco Nacion, Banco Provincia, HSBC, Banco Macro, Brubank, Uala.

### 3.2 `bank_accounts`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `bank_id` | `BIGINT` | NOT NULL, FK → `banks(id)` |
| `alias` | `VARCHAR(100)` | NOT NULL |
| `cbu_cvu` | `VARCHAR(30)` | nullable |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |

**Index**: `idx_bank_accounts_bank_id`.

### 3.3 `payments`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `invoice_id` | `BIGINT` | NOT NULL, FK → `invoices(id)` |
| `payment_date` | `DATE` | NOT NULL |
| `amount` | `NUMERIC(12,2)` | NOT NULL |
| `payer_name` | `VARCHAR(200)` | nullable |
| `payment_type` | `VARCHAR(20)` | NOT NULL, CHECK (`EFECTIVO`, `CUENTA_BANCARIA`) |
| `bank_account_id` | `BIGINT` | nullable, FK → `bank_accounts(id)` |
| `registered_by_employee_id` | `BIGINT` | FK → `employees(id)` |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |

**Index**: `idx_payments_invoice_id`.

### 3.4 `payment_audit_log`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `payment_id` | `BIGINT` | FK → `payments(id)` ON DELETE SET NULL |
| `action` | `VARCHAR(20)` | NOT NULL, CHECK (`CREATED`, `MODIFIED`, `DELETED`) |
| `old_values` | `JSONB` | nullable |
| `new_values` | `JSONB` | nullable |
| `performed_by_employee_id` | `BIGINT` | FK → `employees(id)` |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |

**Index**: `idx_payment_audit_log_payment_id`.

---

## 4. Backend

### 4.1 Package Structure

```
com.autotech.payment/
├── controller/
│   └── PaymentController.java
├── service/
│   ├── PaymentService.java                (interface)
│   └── PaymentServiceImpl.java            (implementation)
├── repository/
│   ├── PaymentRepository.java
│   └── PaymentAuditLogRepository.java
├── model/
│   ├── Payment.java
│   ├── PaymentType.java                   (enum)
│   ├── PaymentAuditLog.java
│   └── AuditAction.java                   (enum)
└── dto/
    ├── PaymentRequest.java
    ├── PaymentResponse.java
    ├── PaymentSummaryResponse.java
    └── PaymentMapper.java

com.autotech.bankaccount/
├── controller/
│   └── BankAccountController.java
├── service/
│   ├── BankAccountService.java            (interface)
│   └── BankAccountServiceImpl.java        (implementation)
├── repository/
│   ├── BankAccountRepository.java
│   └── BankRepository.java
├── model/
│   ├── BankAccount.java
│   └── Bank.java
└── dto/
    ├── BankAccountRequest.java
    ├── BankAccountResponse.java
    ├── BankResponse.java
    └── BankAccountMapper.java
```

---

### 4.2 Enums

#### `PaymentType`

```java
package com.autotech.payment.model;

public enum PaymentType {
    EFECTIVO,
    CUENTA_BANCARIA
}
```

#### `AuditAction`

```java
package com.autotech.payment.model;

public enum AuditAction {
    CREATED,
    MODIFIED,
    DELETED
}
```

---

### 4.3 Entities

#### `Bank`

```java
@Entity
@Table(name = "banks")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor @Builder
public class Bank extends BaseEntity {

    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Bank other)) return false;
        return getId() != null && getId().equals(other.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
```

#### `BankAccount`

```java
@Entity
@Table(name = "bank_accounts")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor @Builder
public class BankAccount extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_id", nullable = false)
    private Bank bank;

    @Column(name = "alias", nullable = false, length = 100)
    private String alias;

    @Column(name = "cbu_cvu", length = 30)
    private String cbuCvu;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof BankAccount other)) return false;
        return getId() != null && getId().equals(other.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
```

#### `Payment`

```java
@Entity
@Table(name = "payments")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor @Builder
public class Payment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "payer_name", length = 200)
    private String payerName;

    @Column(name = "payment_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private PaymentType paymentType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_account_id")
    private BankAccount bankAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registered_by_employee_id")
    private Employee registeredByEmployee;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Payment other)) return false;
        return getId() != null && getId().equals(other.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
```

#### `PaymentAuditLog`

```java
@Entity
@Table(name = "payment_audit_log")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor @Builder
public class PaymentAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id")
    private Payment payment;

    @Column(name = "action", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private AuditAction action;

    @Column(name = "old_values", columnDefinition = "jsonb")
    private String oldValues;

    @Column(name = "new_values", columnDefinition = "jsonb")
    private String newValues;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by_employee_id")
    private Employee performedByEmployee;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PaymentAuditLog other)) return false;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
```

> **Note**: `PaymentAuditLog` does NOT extend `BaseEntity` because it has no `updated_at` field — audit logs are immutable (write-once, never updated).

---

### 4.4 Repositories

#### `BankRepository`

```java
@Repository
public interface BankRepository extends JpaRepository<Bank, Long> {

    List<Bank> findAllByOrderByNameAsc();
}
```

#### `BankAccountRepository`

```java
@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {

    @EntityGraph(attributePaths = {"bank"})
    List<BankAccount> findAllByOrderByAliasAsc();

    @EntityGraph(attributePaths = {"bank"})
    Optional<BankAccount> findWithBankById(Long id);

    List<BankAccount> findByBankId(Long bankId);
}
```

#### `PaymentRepository`

```java
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @EntityGraph(attributePaths = {"bankAccount", "bankAccount.bank", "registeredByEmployee"})
    List<Payment> findByInvoiceIdOrderByPaymentDateDesc(Long invoiceId);

    @EntityGraph(attributePaths = {"bankAccount", "bankAccount.bank", "registeredByEmployee"})
    Optional<Payment> findWithDetailsById(Long id);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.invoice.id = :invoiceId")
    BigDecimal sumAmountByInvoiceId(@Param("invoiceId") Long invoiceId);
}
```

#### `PaymentAuditLogRepository`

```java
@Repository
public interface PaymentAuditLogRepository extends JpaRepository<PaymentAuditLog, Long> {

    List<PaymentAuditLog> findByPaymentIdOrderByCreatedAtDesc(Long paymentId);
}
```

---

### 4.5 DTOs

#### Request DTOs

```java
public record PaymentRequest(
        @NotNull(message = "La fecha de pago es obligatoria")
        LocalDate paymentDate,

        @NotNull(message = "El monto es obligatorio")
        @DecimalMin(value = "0.01", message = "El monto debe ser mayor a cero")
        @Digits(integer = 10, fraction = 2, message = "El monto debe tener como máximo 10 dígitos enteros y 2 decimales")
        BigDecimal amount,

        @Size(max = 200, message = "El nombre del pagador no puede superar los 200 caracteres")
        String payerName,

        @NotNull(message = "El tipo de pago es obligatorio")
        PaymentType paymentType,

        Long bankAccountId,  // required when paymentType = CUENTA_BANCARIA

        Long registeredByEmployeeId  // set from the authenticated user context
) {}

public record BankAccountRequest(
        @NotNull(message = "El banco es obligatorio")
        Long bankId,

        @NotBlank(message = "El alias es obligatorio")
        @Size(max = 100, message = "El alias no puede superar los 100 caracteres")
        String alias,

        @Size(max = 30, message = "El CBU/CVU no puede superar los 30 caracteres")
        String cbuCvu
) {}
```

#### Response DTOs

```java
// Used in the payment history grid
public record PaymentResponse(
        Long id,
        Long invoiceId,
        LocalDate paymentDate,
        LocalDateTime createdAt,
        BigDecimal amount,
        String payerName,
        PaymentType paymentType,
        Long bankAccountId,
        String bankAccountAlias,
        String bankName,
        Long registeredByEmployeeId,
        String registeredByEmployeeFullName
) {}

// Used in the payment summary section
public record PaymentSummaryResponse(
        BigDecimal totalServices,
        BigDecimal totalProducts,
        BigDecimal taxAmount,          // monetary value, not percentage
        BigDecimal discountAmount,     // monetary value, not percentage
        BigDecimal total,
        BigDecimal totalPaid,
        BigDecimal remaining
) {}

public record BankAccountResponse(
        Long id,
        Long bankId,
        String bankName,
        String alias,
        String cbuCvu,
        LocalDateTime createdAt
) {}

public record BankResponse(
        Long id,
        String name
) {}
```

---

### 4.6 Mappers

#### `PaymentMapper`

```java
@Mapper(componentModel = "spring")
public interface PaymentMapper {

    @Mapping(target = "invoiceId", source = "invoice.id")
    @Mapping(target = "bankAccountId", source = "bankAccount.id")
    @Mapping(target = "bankAccountAlias", source = "bankAccount.alias")
    @Mapping(target = "bankName", source = "bankAccount.bank.name")
    @Mapping(target = "registeredByEmployeeId", source = "registeredByEmployee.id")
    @Mapping(target = "registeredByEmployeeFullName",
             expression = "java(entity.getRegisteredByEmployee() != null ? entity.getRegisteredByEmployee().getFirstName() + \" \" + entity.getRegisteredByEmployee().getLastName() : null)")
    PaymentResponse toResponse(Payment entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "invoice", ignore = true)
    @Mapping(target = "bankAccount", ignore = true)
    @Mapping(target = "registeredByEmployee", ignore = true)
    Payment toEntity(PaymentRequest request);
}
```

#### `BankAccountMapper`

```java
@Mapper(componentModel = "spring")
public interface BankAccountMapper {

    @Mapping(target = "bankId", source = "bank.id")
    @Mapping(target = "bankName", source = "bank.name")
    BankAccountResponse toResponse(BankAccount entity);

    BankResponse toBankResponse(Bank entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "bank", ignore = true)
    BankAccount toEntity(BankAccountRequest request);
}
```

---

### 4.7 Services

#### `PaymentService` — Interface

```java
public interface PaymentService {

    List<PaymentResponse> getByInvoiceId(Long invoiceId);

    PaymentResponse getById(Long paymentId);

    PaymentSummaryResponse getSummary(Long invoiceId);

    PaymentResponse create(Long invoiceId, PaymentRequest request);

    PaymentResponse update(Long paymentId, PaymentRequest request);

    void delete(Long paymentId, Long performedByEmployeeId);
}
```

#### `PaymentServiceImpl`

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentAuditLogRepository auditLogRepository;
    private final PaymentMapper paymentMapper;
    private final InvoiceService invoiceService;       // from invoice module (interface)
    private final EmployeeRepository employeeRepository; // for resolving registeredByEmployee
    private final BankAccountService bankAccountService; // from bankaccount module (interface)
    private final ObjectMapper objectMapper;            // for JSONB serialization

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getByInvoiceId(Long invoiceId) {
        log.debug("Fetching payments for invoice {}", invoiceId);
        return paymentRepository.findByInvoiceIdOrderByPaymentDateDesc(invoiceId).stream()
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
    public PaymentSummaryResponse getSummary(Long invoiceId) {
        log.debug("Calculating payment summary for invoice {}", invoiceId);
        // Delegate to invoice service to get invoice totals
        InvoiceDetailResponse invoice = invoiceService.getById(invoiceId);

        BigDecimal totalServices = invoice.services().stream()
                .map(s -> s.price())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalProducts = invoice.products().stream()
                .map(p -> p.totalPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal subtotal = totalServices.add(totalProducts);

        BigDecimal discountAmount = subtotal
                .multiply(invoice.discountPercentage())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal afterDiscount = subtotal.subtract(discountAmount);

        BigDecimal taxAmount = afterDiscount
                .multiply(invoice.taxPercentage())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal total = afterDiscount.add(taxAmount);

        BigDecimal totalPaid = paymentRepository.sumAmountByInvoiceId(invoiceId);

        BigDecimal remaining = total.subtract(totalPaid).max(BigDecimal.ZERO);

        return new PaymentSummaryResponse(
                totalServices,
                totalProducts,
                taxAmount,
                discountAmount,
                total,
                totalPaid,
                remaining
        );
    }

    @Override
    @Transactional
    public PaymentResponse create(Long invoiceId, PaymentRequest request) {
        // 1. Validate invoice exists
        InvoiceDetailResponse invoice = invoiceService.getById(invoiceId);

        // 2. Validate remaining > 0
        PaymentSummaryResponse summary = getSummary(invoiceId);
        if (summary.remaining().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("La factura ya se encuentra completamente pagada");
        }

        // 3. Validate amount does not exceed remaining
        if (request.amount().compareTo(summary.remaining()) > 0) {
            throw new BusinessRuleException("El monto del pago no puede superar el restante por pagar ($" + summary.remaining() + ")");
        }

        // 4. Validate bank account requirement
        validateBankAccountRequirement(request);

        // 5. Build entity
        Payment payment = paymentMapper.toEntity(request);
        payment.setInvoice(/* resolve Invoice entity by invoiceId */);

        // Resolve bank account if bank payment
        if (request.paymentType() == PaymentType.CUENTA_BANCARIA && request.bankAccountId() != null) {
            BankAccount bankAccount = bankAccountService.findEntityById(request.bankAccountId());
            payment.setBankAccount(bankAccount);
        }

        // Resolve employee
        if (request.registeredByEmployeeId() != null) {
            Employee employee = employeeRepository.findById(request.registeredByEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", request.registeredByEmployeeId()));
            payment.setRegisteredByEmployee(employee);
        }

        // 6. Save payment
        Payment saved = paymentRepository.save(payment);
        log.info("Created payment with id {} for invoice {}", saved.getId(), invoiceId);

        // 7. Create audit log (CREATED)
        createAuditLog(saved, AuditAction.CREATED, null, saved, request.registeredByEmployeeId());

        // 8. Check if invoice is fully paid → auto-update status to PAGADA
        BigDecimal newTotalPaid = paymentRepository.sumAmountByInvoiceId(invoiceId);
        if (newTotalPaid.compareTo(summary.total()) >= 0) {
            invoiceService.updateStatusToPagada(invoiceId);
            log.info("Invoice {} auto-updated to PAGADA (fully paid)", invoiceId);
        }

        return paymentMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public PaymentResponse update(Long paymentId, PaymentRequest request) {
        Payment existing = paymentRepository.findWithDetailsById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", paymentId));

        Long invoiceId = existing.getInvoice().getId();

        // Snapshot old values before update
        Payment oldSnapshot = snapshotPayment(existing);

        // Calculate remaining excluding this payment's current amount
        PaymentSummaryResponse summary = getSummary(invoiceId);
        BigDecimal remainingWithoutThis = summary.remaining().add(existing.getAmount());

        // Validate amount does not exceed remaining (excluding current payment)
        if (request.amount().compareTo(remainingWithoutThis) > 0) {
            throw new BusinessRuleException("El monto del pago no puede superar el restante por pagar ($" + remainingWithoutThis + ")");
        }

        // Validate bank account requirement
        validateBankAccountRequirement(request);

        // Update fields
        existing.setPaymentDate(request.paymentDate());
        existing.setAmount(request.amount());
        existing.setPayerName(request.payerName());
        existing.setPaymentType(request.paymentType());

        // Resolve bank account
        if (request.paymentType() == PaymentType.CUENTA_BANCARIA && request.bankAccountId() != null) {
            BankAccount bankAccount = bankAccountService.findEntityById(request.bankAccountId());
            existing.setBankAccount(bankAccount);
        } else {
            existing.setBankAccount(null);
        }

        Payment saved = paymentRepository.save(existing);
        log.info("Updated payment with id {}", saved.getId());

        // Create audit log (MODIFIED)
        createAuditLog(saved, AuditAction.MODIFIED, oldSnapshot, saved, request.registeredByEmployeeId());

        // Re-check invoice paid status
        updateInvoicePaidStatus(invoiceId);

        return paymentMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long paymentId, Long performedByEmployeeId) {
        Payment existing = paymentRepository.findWithDetailsById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", paymentId));

        Long invoiceId = existing.getInvoice().getId();

        // Create audit log BEFORE deletion (DELETED)
        createAuditLog(existing, AuditAction.DELETED, existing, null, performedByEmployeeId);

        paymentRepository.delete(existing);
        log.info("Deleted payment with id {}", paymentId);

        // Re-check invoice paid status (may revert to PENDIENTE)
        updateInvoicePaidStatus(invoiceId);
    }

    // --- Private helpers ---

    private void validateBankAccountRequirement(PaymentRequest request) {
        if (request.paymentType() == PaymentType.CUENTA_BANCARIA && request.bankAccountId() == null) {
            throw new BusinessRuleException("Se debe seleccionar una cuenta bancaria para pagos de tipo CUENTA_BANCARIA");
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
            Map<String, Object> values = Map.of(
                    "paymentDate", payment.getPaymentDate().toString(),
                    "amount", payment.getAmount().toString(),
                    "payerName", payment.getPayerName() != null ? payment.getPayerName() : "",
                    "paymentType", payment.getPaymentType().name(),
                    "bankAccountId", payment.getBankAccount() != null ? payment.getBankAccount().getId() : ""
            );
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

    private void updateInvoicePaidStatus(Long invoiceId) {
        PaymentSummaryResponse summary = getSummary(invoiceId);
        if (summary.remaining().compareTo(BigDecimal.ZERO) <= 0) {
            invoiceService.updateStatusToPagada(invoiceId);
        } else {
            invoiceService.updateStatusToPendiente(invoiceId);
        }
    }
}
```

---

#### `BankAccountService` — Interface

```java
public interface BankAccountService {

    List<BankAccountResponse> getAll();

    BankAccountResponse getById(Long id);

    BankAccountResponse create(BankAccountRequest request);

    BankAccountResponse update(Long id, BankAccountRequest request);

    void delete(Long id);

    List<BankResponse> getAllBanks();

    BankAccount findEntityById(Long id);  // used internally by PaymentService
}
```

#### `BankAccountServiceImpl`

```java
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
```

---

### 4.8 Controllers

#### `PaymentController`

Base path: `/api/invoices/{invoiceId}/payments`

```java
@RestController
@RequestMapping("/api/invoices/{invoiceId}/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // GET /api/invoices/{invoiceId}/payments
    @GetMapping
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getByInvoice(
            @PathVariable Long invoiceId) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.getByInvoiceId(invoiceId)));
    }

    // GET /api/invoices/{invoiceId}/payments/summary
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<PaymentSummaryResponse>> getSummary(
            @PathVariable Long invoiceId) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.getSummary(invoiceId)));
    }

    // POST /api/invoices/{invoiceId}/payments
    @PostMapping
    public ResponseEntity<ApiResponse<PaymentResponse>> create(
            @PathVariable Long invoiceId,
            @Valid @RequestBody PaymentRequest request) {
        PaymentResponse created = paymentService.create(invoiceId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Pago registrado", created));
    }

    // PUT /api/invoices/{invoiceId}/payments/{paymentId}
    @PutMapping("/{paymentId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> update(
            @PathVariable Long invoiceId,
            @PathVariable Long paymentId,
            @Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Pago actualizado", paymentService.update(paymentId, request)));
    }

    // DELETE /api/invoices/{invoiceId}/payments/{paymentId}?performedBy={employeeId}
    @DeleteMapping("/{paymentId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long invoiceId,
            @PathVariable Long paymentId,
            @RequestParam Long performedBy) {
        paymentService.delete(paymentId, performedBy);
        return ResponseEntity.ok(ApiResponse.success("Pago eliminado", null));
    }
}
```

#### `BankAccountController`

Base path: `/api/bank-accounts`

```java
@RestController
@RequestMapping("/api/bank-accounts")
@RequiredArgsConstructor
public class BankAccountController {

    private final BankAccountService bankAccountService;

    // GET /api/bank-accounts
    @GetMapping
    public ResponseEntity<ApiResponse<List<BankAccountResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(bankAccountService.getAll()));
    }

    // GET /api/bank-accounts/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BankAccountResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(bankAccountService.getById(id)));
    }

    // POST /api/bank-accounts
    @PostMapping
    public ResponseEntity<ApiResponse<BankAccountResponse>> create(
            @Valid @RequestBody BankAccountRequest request) {
        BankAccountResponse created = bankAccountService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Cuenta bancaria creada", created));
    }

    // PUT /api/bank-accounts/{id}
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BankAccountResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody BankAccountRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cuenta bancaria actualizada",
                bankAccountService.update(id, request)));
    }

    // DELETE /api/bank-accounts/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        bankAccountService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Cuenta bancaria eliminada", null));
    }

    // GET /api/bank-accounts/banks
    @GetMapping("/banks")
    public ResponseEntity<ApiResponse<List<BankResponse>>> getAllBanks() {
        return ResponseEntity.ok(ApiResponse.success(bankAccountService.getAllBanks()));
    }
}
```

#### Endpoint Summary

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/invoices/{invoiceId}/payments` | List all payments for an invoice |
| `GET` | `/api/invoices/{invoiceId}/payments/summary` | Get payment summary for an invoice |
| `POST` | `/api/invoices/{invoiceId}/payments` | Register a new payment |
| `PUT` | `/api/invoices/{invoiceId}/payments/{paymentId}` | Modify an existing payment |
| `DELETE` | `/api/invoices/{invoiceId}/payments/{paymentId}?performedBy={employeeId}` | Delete a payment |
| `GET` | `/api/bank-accounts` | List all bank accounts |
| `GET` | `/api/bank-accounts/{id}` | Get bank account by ID |
| `POST` | `/api/bank-accounts` | Create a bank account |
| `PUT` | `/api/bank-accounts/{id}` | Update a bank account |
| `DELETE` | `/api/bank-accounts/{id}` | Delete a bank account |
| `GET` | `/api/bank-accounts/banks` | List all available banks |

---

## 5. Frontend

### 5.1 Folder Structure

```
src/
├── api/
│   ├── payments.ts
│   └── bankAccounts.ts
├── features/
│   └── payments/
│       ├── components/
│       │   ├── PaymentsTab.tsx
│       │   ├── PaymentSummary.tsx
│       │   ├── CashPaymentDialog.tsx
│       │   ├── BankPaymentDialog.tsx
│       │   └── PaymentHistoryGrid.tsx
│       └── hooks/
│           ├── usePayments.ts
│           ├── usePaymentSummary.ts
│           └── useBankAccounts.ts
└── types/
    └── payment.ts
```

---

### 5.2 Types (`src/types/payment.ts`)

```ts
// ---- Payment Type ----

export type PaymentType = "EFECTIVO" | "CUENTA_BANCARIA";

// ---- Audit Action ----

export type AuditAction = "CREATED" | "MODIFIED" | "DELETED";

// ---- Payment ----

export interface PaymentRequest {
  paymentDate: string;          // ISO date "YYYY-MM-DD"
  amount: number;
  payerName: string | null;
  paymentType: PaymentType;
  bankAccountId: number | null; // required when paymentType = CUENTA_BANCARIA
  registeredByEmployeeId: number | null;
}

export interface PaymentResponse {
  id: number;
  invoiceId: number;
  paymentDate: string;          // ISO date "YYYY-MM-DD"
  createdAt: string;            // ISO datetime
  amount: number;
  payerName: string | null;
  paymentType: PaymentType;
  bankAccountId: number | null;
  bankAccountAlias: string | null;
  bankName: string | null;
  registeredByEmployeeId: number | null;
  registeredByEmployeeFullName: string | null;
}

// ---- Payment Summary ----

export interface PaymentSummaryResponse {
  totalServices: number;
  totalProducts: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  totalPaid: number;
  remaining: number;
}

// ---- Bank Account ----

export interface BankAccountRequest {
  bankId: number;
  alias: string;
  cbuCvu: string | null;
}

export interface BankAccountResponse {
  id: number;
  bankId: number;
  bankName: string;
  alias: string;
  cbuCvu: string | null;
  createdAt: string;
}

// ---- Bank ----

export interface BankResponse {
  id: number;
  name: string;
}
```

---

### 5.3 API Layer

#### `src/api/payments.ts`

```ts
import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type {
  PaymentRequest,
  PaymentResponse,
  PaymentSummaryResponse,
} from "@/types/payment";

export const paymentsApi = {
  getByInvoice: (invoiceId: number) =>
    apiClient.get<ApiResponse<PaymentResponse[]>>(
      `/invoices/${invoiceId}/payments`
    ),

  getSummary: (invoiceId: number) =>
    apiClient.get<ApiResponse<PaymentSummaryResponse>>(
      `/invoices/${invoiceId}/payments/summary`
    ),

  create: (invoiceId: number, data: PaymentRequest) =>
    apiClient.post<ApiResponse<PaymentResponse>>(
      `/invoices/${invoiceId}/payments`,
      data
    ),

  update: (invoiceId: number, paymentId: number, data: PaymentRequest) =>
    apiClient.put<ApiResponse<PaymentResponse>>(
      `/invoices/${invoiceId}/payments/${paymentId}`,
      data
    ),

  delete: (invoiceId: number, paymentId: number, performedBy: number) =>
    apiClient.delete<ApiResponse<void>>(
      `/invoices/${invoiceId}/payments/${paymentId}`,
      { params: { performedBy } }
    ),
};
```

#### `src/api/bankAccounts.ts`

```ts
import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type {
  BankAccountRequest,
  BankAccountResponse,
  BankResponse,
} from "@/types/payment";

export const bankAccountsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<BankAccountResponse[]>>("/bank-accounts"),

  getById: (id: number) =>
    apiClient.get<ApiResponse<BankAccountResponse>>(`/bank-accounts/${id}`),

  create: (data: BankAccountRequest) =>
    apiClient.post<ApiResponse<BankAccountResponse>>("/bank-accounts", data),

  update: (id: number, data: BankAccountRequest) =>
    apiClient.put<ApiResponse<BankAccountResponse>>(
      `/bank-accounts/${id}`,
      data
    ),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/bank-accounts/${id}`),

  getAllBanks: () =>
    apiClient.get<ApiResponse<BankResponse[]>>("/bank-accounts/banks"),
};
```

---

### 5.4 Hooks

#### `src/features/payments/hooks/usePayments.ts`

```ts
import { useState, useEffect, useCallback } from "react";
import { paymentsApi } from "@/api/payments";
import type { PaymentRequest, PaymentResponse } from "@/types/payment";

export function usePayments(invoiceId: number) {
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentsApi.getByInvoice(invoiceId);
      setPayments(res.data.data);
    } catch (err) {
      setError("Error al cargar los pagos");
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const createPayment = async (data: PaymentRequest) => {
    const res = await paymentsApi.create(invoiceId, data);
    fetchPayments();
    return res.data.data;
  };

  const updatePayment = async (paymentId: number, data: PaymentRequest) => {
    const res = await paymentsApi.update(invoiceId, paymentId, data);
    fetchPayments();
    return res.data.data;
  };

  const deletePayment = async (paymentId: number, performedBy: number) => {
    await paymentsApi.delete(invoiceId, paymentId, performedBy);
    fetchPayments();
  };

  return {
    payments,
    loading,
    error,
    createPayment,
    updatePayment,
    deletePayment,
    refetch: fetchPayments,
  };
}
```

#### `src/features/payments/hooks/usePaymentSummary.ts`

```ts
import { useState, useEffect, useCallback } from "react";
import { paymentsApi } from "@/api/payments";
import type { PaymentSummaryResponse } from "@/types/payment";

export function usePaymentSummary(invoiceId: number) {
  const [summary, setSummary] = useState<PaymentSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentsApi.getSummary(invoiceId);
      setSummary(res.data.data);
    } catch (err) {
      setError("Error al cargar el resumen de pagos");
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
  };
}
```

#### `src/features/payments/hooks/useBankAccounts.ts`

```ts
import { useState, useEffect, useCallback } from "react";
import { bankAccountsApi } from "@/api/bankAccounts";
import type { BankAccountResponse, BankResponse } from "@/types/payment";

export function useBankAccounts() {
  const [bankAccounts, setBankAccounts] = useState<BankAccountResponse[]>([]);
  const [banks, setBanks] = useState<BankResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBankAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const [accountsRes, banksRes] = await Promise.all([
        bankAccountsApi.getAll(),
        bankAccountsApi.getAllBanks(),
      ]);
      setBankAccounts(accountsRes.data.data);
      setBanks(banksRes.data.data);
    } catch (err) {
      setError("Error al cargar las cuentas bancarias");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBankAccounts();
  }, [fetchBankAccounts]);

  return {
    bankAccounts,
    banks,
    loading,
    error,
    refetch: fetchBankAccounts,
  };
}
```

---

### 5.5 Components

#### `PaymentsTab` (`src/features/payments/components/PaymentsTab.tsx`)

This component replaces the payments placeholder in the invoice detail view (both standalone at `/facturas/:id` and within the repair order "Factura" tab). It receives the `invoiceId` and `clientFullName` as props.

```tsx
interface PaymentsTabProps {
  invoiceId: number;
  clientFullName: string; // used as default placeholder for payer name
}

export function PaymentsTab({ invoiceId, clientFullName }: PaymentsTabProps) {
  const { payments, loading, error, createPayment, updatePayment, deletePayment, refetch } =
    usePayments(invoiceId);
  const { summary, loading: summaryLoading, refetch: refetchSummary } =
    usePaymentSummary(invoiceId);

  const [cashDialogOpen, setCashDialogOpen] = useState(false);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentResponse | null>(null);

  const isFullyPaid = summary?.remaining === 0;

  const handlePaymentCreated = () => {
    refetch();
    refetchSummary();
    setCashDialogOpen(false);
    setBankDialogOpen(false);
  };

  const handlePaymentUpdated = () => {
    refetch();
    refetchSummary();
    setEditingPayment(null);
  };

  const handlePaymentDeleted = () => {
    refetch();
    refetchSummary();
  };

  if (summaryLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      {/* Payment Summary */}
      <PaymentSummary summary={summary} />

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} sx={{ my: 2 }}>
        <Button
          variant="contained"
          startIcon={<AttachMoneyIcon />}
          onClick={() => setCashDialogOpen(true)}
          disabled={isFullyPaid}
        >
          Agregar pago en efectivo
        </Button>
        <Button
          variant="contained"
          startIcon={<AccountBalanceIcon />}
          onClick={() => setBankDialogOpen(true)}
          disabled={isFullyPaid}
        >
          Agregar pago a cuenta bancaria
        </Button>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={() => window.print()}
        >
          Imprimir factura
        </Button>
      </Stack>

      {/* Payment History Grid */}
      <PaymentHistoryGrid
        payments={payments}
        loading={loading}
        onEdit={(payment) => setEditingPayment(payment)}
        onDelete={(paymentId, performedBy) => {
          deletePayment(paymentId, performedBy);
          handlePaymentDeleted();
        }}
      />

      {/* Cash Payment Dialog */}
      <CashPaymentDialog
        open={cashDialogOpen || (editingPayment?.paymentType === "EFECTIVO")}
        onClose={() => { setCashDialogOpen(false); setEditingPayment(null); }}
        invoiceId={invoiceId}
        remaining={summary?.remaining ?? 0}
        clientFullName={clientFullName}
        editingPayment={editingPayment?.paymentType === "EFECTIVO" ? editingPayment : null}
        onCreated={handlePaymentCreated}
        onUpdated={handlePaymentUpdated}
      />

      {/* Bank Payment Dialog */}
      <BankPaymentDialog
        open={bankDialogOpen || (editingPayment?.paymentType === "CUENTA_BANCARIA")}
        onClose={() => { setBankDialogOpen(false); setEditingPayment(null); }}
        invoiceId={invoiceId}
        remaining={summary?.remaining ?? 0}
        clientFullName={clientFullName}
        editingPayment={editingPayment?.paymentType === "CUENTA_BANCARIA" ? editingPayment : null}
        onCreated={handlePaymentCreated}
        onUpdated={handlePaymentUpdated}
      />
    </Box>
  );
}
```

---

#### `PaymentSummary` (`src/features/payments/components/PaymentSummary.tsx`)

Displays the payment summary as a read-only section.

```tsx
import { Box, Typography, Divider, Paper } from "@mui/material";
import type { PaymentSummaryResponse } from "@/types/payment";

interface PaymentSummaryProps {
  summary: PaymentSummaryResponse | null;
}

export function PaymentSummary({ summary }: PaymentSummaryProps) {
  if (!summary) return null;

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Resumen de pagos</Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography>Total en servicios:</Typography>
          <Typography>{formatCurrency(summary.totalServices)}</Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography>Total en partes:</Typography>
          <Typography>{formatCurrency(summary.totalProducts)}</Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography>Impuestos:</Typography>
          <Typography>{formatCurrency(summary.taxAmount)}</Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography>Descuento:</Typography>
          <Typography>-{formatCurrency(summary.discountAmount)}</Typography>
        </Box>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="subtitle1" fontWeight="bold">Total:</Typography>
          <Typography variant="subtitle1" fontWeight="bold">{formatCurrency(summary.total)}</Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography>Total pagado a la fecha:</Typography>
          <Typography color="success.main">{formatCurrency(summary.totalPaid)}</Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="subtitle1" fontWeight="bold">Restante por pagar:</Typography>
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            color={summary.remaining > 0 ? "error.main" : "success.main"}
          >
            {formatCurrency(summary.remaining)}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
```

---

#### `CashPaymentDialog` (`src/features/payments/components/CashPaymentDialog.tsx`)

Modal dialog for registering/editing a cash payment.

```tsx
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Alert,
} from "@mui/material";
import type { PaymentRequest, PaymentResponse } from "@/types/payment";

interface CashPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceId: number;
  remaining: number;
  clientFullName: string;
  editingPayment: PaymentResponse | null; // null = create mode, non-null = edit mode
  onCreated: () => void;
  onUpdated: () => void;
}

export function CashPaymentDialog({
  open, onClose, invoiceId, remaining, clientFullName,
  editingPayment, onCreated, onUpdated,
}: CashPaymentDialogProps) {
  const isEditing = editingPayment !== null;
  const { createPayment, updatePayment } = usePayments(invoiceId);

  // State
  const [paymentDate, setPaymentDate] = useState<string>(
    editingPayment?.paymentDate ?? new Date().toISOString().split("T")[0]
  );
  const [amount, setAmount] = useState<number>(editingPayment?.amount ?? 0);
  const [payerName, setPayerName] = useState<string>(editingPayment?.payerName ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Fill amount with remaining when user clicks the remaining display
  const handleRemainingClick = () => {
    setAmount(remaining);
  };

  const handleSubmit = () => {
    setConfirmOpen(true); // show confirmation alert
  };

  const handleConfirm = async () => {
    const request: PaymentRequest = {
      paymentDate,
      amount,
      payerName: payerName || null,
      paymentType: "EFECTIVO",
      bankAccountId: null,
      registeredByEmployeeId: null, // set from auth context in actual implementation
    };

    if (isEditing) {
      await updatePayment(editingPayment.id, request);
      onUpdated();
    } else {
      await createPayment(request);
      onCreated();
    }
    setConfirmOpen(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? "Modificar pago en efectivo" : "Agregar pago en efectivo"}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            type="date"
            label="Fecha de pago"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Restante por pagar"
            value={`$${remaining.toFixed(2)}`}
            InputProps={{ readOnly: true }}
            onClick={handleRemainingClick}
            sx={{ cursor: "pointer" }}
            fullWidth
          />
          <TextField
            type="number"
            label="Monto a pagar"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            inputProps={{ min: 0.01, max: remaining, step: 0.01 }}
            fullWidth
          />
          <TextField
            label="Nombre de la persona que realizó el pago"
            value={payerName}
            onChange={(e) => setPayerName(e.target.value)}
            placeholder={clientFullName}
            fullWidth
          />
        </Box>

        {/* Confirmation Alert */}
        {confirmOpen && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            ¿Está seguro que desea {isEditing ? "modificar" : "registrar"} este pago?
            <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
              <Button size="small" variant="contained" onClick={handleConfirm}>
                Confirmar
              </Button>
              <Button size="small" variant="outlined" onClick={() => setConfirmOpen(false)}>
                Cancelar
              </Button>
            </Box>
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={amount <= 0}>
          Aceptar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

---

#### `BankPaymentDialog` (`src/features/payments/components/BankPaymentDialog.tsx`)

Modal dialog for registering/editing a bank payment. Same as `CashPaymentDialog` plus a bank account selector.

```tsx
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Alert, Autocomplete,
} from "@mui/material";
import type { PaymentRequest, PaymentResponse } from "@/types/payment";
import { useBankAccounts } from "../hooks/useBankAccounts";

interface BankPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceId: number;
  remaining: number;
  clientFullName: string;
  editingPayment: PaymentResponse | null;
  onCreated: () => void;
  onUpdated: () => void;
}

export function BankPaymentDialog({
  open, onClose, invoiceId, remaining, clientFullName,
  editingPayment, onCreated, onUpdated,
}: BankPaymentDialogProps) {
  const isEditing = editingPayment !== null;
  const { createPayment, updatePayment } = usePayments(invoiceId);
  const { bankAccounts, loading: bankAccountsLoading } = useBankAccounts();

  // State
  const [paymentDate, setPaymentDate] = useState<string>(
    editingPayment?.paymentDate ?? new Date().toISOString().split("T")[0]
  );
  const [amount, setAmount] = useState<number>(editingPayment?.amount ?? 0);
  const [payerName, setPayerName] = useState<string>(editingPayment?.payerName ?? "");
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<number | null>(
    editingPayment?.bankAccountId ?? null
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleRemainingClick = () => {
    setAmount(remaining);
  };

  const handleSubmit = () => {
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    const request: PaymentRequest = {
      paymentDate,
      amount,
      payerName: payerName || null,
      paymentType: "CUENTA_BANCARIA",
      bankAccountId: selectedBankAccountId,
      registeredByEmployeeId: null, // set from auth context in actual implementation
    };

    if (isEditing) {
      await updatePayment(editingPayment.id, request);
      onUpdated();
    } else {
      await createPayment(request);
      onCreated();
    }
    setConfirmOpen(false);
    onClose();
  };

  const selectedAccount = bankAccounts.find((a) => a.id === selectedBankAccountId) ?? null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditing ? "Modificar pago a cuenta bancaria" : "Agregar pago a cuenta bancaria"}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            type="date"
            label="Fecha de pago"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Restante por pagar"
            value={`$${remaining.toFixed(2)}`}
            InputProps={{ readOnly: true }}
            onClick={handleRemainingClick}
            sx={{ cursor: "pointer" }}
            fullWidth
          />
          <TextField
            type="number"
            label="Monto a pagar"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            inputProps={{ min: 0.01, max: remaining, step: 0.01 }}
            fullWidth
          />
          <TextField
            label="Nombre de la persona que realizó el pago"
            value={payerName}
            onChange={(e) => setPayerName(e.target.value)}
            placeholder={clientFullName}
            fullWidth
          />
          <Autocomplete
            options={bankAccounts}
            getOptionLabel={(option) => `${option.bankName} - ${option.alias}`}
            value={selectedAccount}
            onChange={(_, value) => setSelectedBankAccountId(value?.id ?? null)}
            loading={bankAccountsLoading}
            renderInput={(params) => (
              <TextField {...params} label="Cuenta bancaria" required />
            )}
          />
        </Box>

        {/* Confirmation Alert */}
        {confirmOpen && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            ¿Está seguro que desea {isEditing ? "modificar" : "registrar"} este pago?
            <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
              <Button size="small" variant="contained" onClick={handleConfirm}>
                Confirmar
              </Button>
              <Button size="small" variant="outlined" onClick={() => setConfirmOpen(false)}>
                Cancelar
              </Button>
            </Box>
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={amount <= 0 || selectedBankAccountId === null}
        >
          Aceptar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

---

#### `PaymentHistoryGrid` (`src/features/payments/components/PaymentHistoryGrid.tsx`)

Displays the list of payments for an invoice as a DataGrid.

```tsx
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Box, IconButton, Chip, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { PaymentResponse } from "@/types/payment";

interface PaymentHistoryGridProps {
  payments: PaymentResponse[];
  loading: boolean;
  onEdit: (payment: PaymentResponse) => void;
  onDelete: (paymentId: number, performedBy: number) => void;
}

export function PaymentHistoryGrid({
  payments, loading, onEdit, onDelete,
}: PaymentHistoryGridProps) {
  const columns: GridColDef[] = [
    {
      field: "createdAt",
      headerName: "Fecha y hora",
      width: 180,
      valueFormatter: (value) =>
        new Date(value).toLocaleString("es-AR", {
          dateStyle: "short",
          timeStyle: "short",
        }),
    },
    {
      field: "payerName",
      headerName: "Nombre del pagador",
      flex: 1,
      valueFormatter: (value) => value ?? "—",
    },
    {
      field: "registeredByEmployeeFullName",
      headerName: "Registrado por",
      flex: 1,
      valueFormatter: (value) => value ?? "—",
    },
    {
      field: "amount",
      headerName: "Monto",
      width: 130,
      valueFormatter: (value) => `$${Number(value).toFixed(2)}`,
    },
    {
      field: "paymentType",
      headerName: "Tipo de pago",
      width: 170,
      renderCell: (params) => (
        <Chip
          label={params.value === "EFECTIVO" ? "Efectivo" : "Cuenta bancaria"}
          color={params.value === "EFECTIVO" ? "default" : "primary"}
          size="small"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <>
          <IconButton
            onClick={(e) => { e.stopPropagation(); onEdit(params.row); }}
            size="small"
            color="primary"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              // performedBy should be the current user's employee ID (from auth context)
              onDelete(params.row.id, params.row.registeredByEmployeeId);
            }}
            size="small"
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  if (payments.length === 0 && !loading) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>Historial de pagos</Typography>
        <Typography color="text.secondary">
          No se registraron pagos para esta factura.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>Historial de pagos</Typography>
      <DataGrid
        rows={payments}
        columns={columns}
        loading={loading}
        autoHeight
        disableRowSelectionOnClick
        pageSizeOptions={[5, 10, 20]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
        }}
      />
    </Box>
  );
}
```

---

### 5.6 Routes

No new routes are added. Payments live within:

1. **Standalone invoice detail** (`/facturas/:id`) — The "Pagos" tab renders `<PaymentsTab invoiceId={id} clientFullName={...} />`.
2. **Repair order detail** (`/ordenes-de-trabajo/:id`) — The "Factura" tab renders `<PaymentsTab invoiceId={...} clientFullName={...} />` using the invoice linked to the repair order.

---

## 6. Business Rules

| # | Rule | Implementation |
|---|---|---|
| 1 | **Amount cannot exceed remaining** | `PaymentServiceImpl.create()` and `update()` check that `request.amount() <= remaining`. On update, the remaining is recalculated by adding back the current payment's amount before comparing. Throws `BusinessRuleException` if exceeded. |
| 2 | **No payments if remaining = 0** | `create()` checks `summary.remaining() > 0` before proceeding. On the frontend, the "Agregar pago" buttons are disabled when `remaining === 0`. |
| 3 | **Payment type drives bank account requirement** | If `paymentType == CUENTA_BANCARIA`, then `bankAccountId` is required. Validated in `validateBankAccountRequirement()`. If `paymentType == EFECTIVO`, `bankAccountId` is ignored/set to null. |
| 4 | **Audit log on every mutation** | Every `create()`, `update()`, and `delete()` call writes a record to `payment_audit_log` with `action` (CREATED/MODIFIED/DELETED), JSONB `old_values` and `new_values` snapshots, and the `performed_by_employee_id`. For CREATED: `old_values = null`, `new_values = snapshot`. For MODIFIED: both set. For DELETED: `old_values = snapshot`, `new_values = null`. |
| 5 | **Invoice auto-status to PAGADA** | After creating or updating a payment, `PaymentServiceImpl` recalculates the total paid. If `totalPaid >= total`, it calls `invoiceService.updateStatusToPagada(invoiceId)` to set the invoice status to `PAGADA`. |
| 6 | **Invoice reverts to PENDIENTE on delete/modify** | If a payment is deleted or modified such that `totalPaid < total`, `invoiceService.updateStatusToPendiente(invoiceId)` is called to revert the invoice status. |
| 7 | **Payment amount must be > 0** | Validated via `@DecimalMin("0.01")` on `PaymentRequest.amount`. |
| 8 | **Payment date defaults to today** | On the frontend, the date field defaults to today's date. |
| 9 | **Payer name is optional** | Defaults to empty. The frontend shows the client's full name as a placeholder. |
| 10 | **Confirmation alert before submission** | Both `CashPaymentDialog` and `BankPaymentDialog` show a confirmation alert when the user clicks "Aceptar", requiring a second click to confirm the action. |
| 11 | **Payments tab disabled during invoice creation** | The "Pagos" tab is disabled until the invoice has been saved (i.e., it has an ID). This is enforced in the parent invoice detail component. |
| 12 | **Audit log ON DELETE SET NULL** | When a payment is deleted, `payment_audit_log.payment_id` is set to NULL (DB constraint), but the audit record is preserved with the JSONB snapshots of the deleted payment's data. |

---

## 7. Testing

### 7.1 Backend — Unit Tests

#### Service layer tests (JUnit 5 + Mockito)

| Test Class | Test Methods |
|---|---|
| `PaymentServiceImplTest` | `getByInvoiceId_returnsPaymentList()`, `getByInvoiceId_emptyList_returnsEmpty()`, `getById_existingId_returnsPaymentResponse()`, `getById_nonExistingId_throwsResourceNotFoundException()`, `getSummary_calculatesAllFieldsCorrectly()`, `getSummary_noPayments_remainingEqualsTotal()`, `getSummary_fullyPaid_remainingIsZero()`, `create_validRequest_returnsPaymentResponse()`, `create_cashPayment_setsPaymentTypeEfectivo()`, `create_bankPayment_setsBankAccount()`, `create_bankPayment_withoutBankAccountId_throwsBusinessRuleException()`, `create_amountExceedsRemaining_throwsBusinessRuleException()`, `create_invoiceFullyPaid_throwsBusinessRuleException()`, `create_createsAuditLogWithCreatedAction()`, `create_fullyPaysInvoice_updatesStatusToPagada()`, `update_validRequest_returnsUpdatedPaymentResponse()`, `update_nonExistingId_throwsResourceNotFoundException()`, `update_amountExceedsRemaining_throwsBusinessRuleException()`, `update_createsAuditLogWithModifiedAction()`, `update_changeAmount_rechecksInvoiceStatus()`, `delete_existingId_deletesSuccessfully()`, `delete_nonExistingId_throwsResourceNotFoundException()`, `delete_createsAuditLogWithDeletedAction()`, `delete_revertsInvoiceStatusToPendiente()` |
| `BankAccountServiceImplTest` | `getAll_returnsSortedList()`, `getById_existingId_returnsBankAccountResponse()`, `getById_nonExistingId_throwsResourceNotFoundException()`, `create_validRequest_returnsBankAccountResponse()`, `create_invalidBankId_throwsResourceNotFoundException()`, `update_validRequest_returnsUpdatedResponse()`, `update_nonExistingId_throwsResourceNotFoundException()`, `delete_existingId_deletesSuccessfully()`, `delete_nonExistingId_throwsResourceNotFoundException()`, `getAllBanks_returnsSortedList()`, `findEntityById_existingId_returnsEntity()`, `findEntityById_nonExistingId_throwsResourceNotFoundException()` |

#### Controller layer tests (MockMvc + `@WebMvcTest`)

| Test Class | Test Methods |
|---|---|
| `PaymentControllerTest` | `getByInvoice_returns200()`, `getSummary_returns200()`, `create_validRequest_returns201()`, `create_invalidRequest_returns400()`, `create_amountExceedsRemaining_returns400()`, `update_returns200()`, `update_notFound_returns404()`, `delete_returns200()`, `delete_notFound_returns404()` |
| `BankAccountControllerTest` | `getAll_returns200()`, `getById_returns200()`, `getById_notFound_returns404()`, `create_validRequest_returns201()`, `create_invalidRequest_returns400()`, `update_returns200()`, `delete_returns200()`, `getAllBanks_returns200()` |

#### Mapper tests

| Test Class | Test Methods |
|---|---|
| `PaymentMapperTest` | `toResponse_mapsAllFieldsIncludingEmployeeFullName()`, `toResponse_nullBankAccount_mapsNulls()`, `toEntity_ignoresRelationships()` |
| `BankAccountMapperTest` | `toResponse_mapsAllFieldsIncludingBankName()`, `toBankResponse_mapsAllFields()`, `toEntity_ignoresRelationships()` |

### 7.2 Frontend — Unit Tests (Vitest + React Testing Library)

| Test File | What it covers |
|---|---|
| `PaymentsTab.test.tsx` | Renders summary and history grid, "Agregar pago en efectivo" button opens CashPaymentDialog, "Agregar pago a cuenta bancaria" button opens BankPaymentDialog, both buttons disabled when remaining = 0, "Imprimir factura" button calls window.print(), creating a payment refreshes summary and history, deleting a payment refreshes summary and history |
| `PaymentSummary.test.tsx` | Displays all summary fields correctly (totalServices, totalProducts, taxAmount, discountAmount, total, totalPaid, remaining), remaining shows red when > 0 and green when = 0, handles null summary gracefully |
| `CashPaymentDialog.test.tsx` | Opens with default date (today), shows remaining as readonly, clicking remaining fills amount field, payer name shows client name as placeholder, "Aceptar" button shows confirmation alert, confirming alert calls createPayment API, amount clamped to remaining, edit mode pre-fills existing payment values, form validation (amount > 0), "Cancelar" closes dialog |
| `BankPaymentDialog.test.tsx` | Same as CashPaymentDialog tests plus: bank account Autocomplete loads options, bank account is required, selecting account sets bankAccountId, "Aceptar" disabled when no bank account selected, edit mode pre-selects bank account |
| `PaymentHistoryGrid.test.tsx` | Renders columns correctly (date/time, payer name, registered by, amount, payment type chip, actions), shows empty state message when no payments, edit button opens editing dialog, delete button calls onDelete callback, payment type chip shows correct label and color |
| `usePayments.test.ts` | Fetches payments on mount, createPayment triggers refetch, updatePayment triggers refetch, deletePayment triggers refetch, handles loading and error states |
| `usePaymentSummary.test.ts` | Fetches summary on mount, refetch updates summary, handles loading and error states |
| `useBankAccounts.test.ts` | Fetches bank accounts and banks on mount, handles loading and error states |

---

## 8. Implementation Checklist

> **Instructions for AI agents**: Check off each item as you complete it. Do not remove items. If an item is not applicable, mark it with `[x]` and add "(N/A)" next to it.

### 8.1 Backend

- [ ] Create `PaymentType` enum (`EFECTIVO`, `CUENTA_BANCARIA`)
- [ ] Create `AuditAction` enum (`CREATED`, `MODIFIED`, `DELETED`)
- [ ] Create `Bank` entity
- [ ] Create `BankAccount` entity (relationship: `Bank`)
- [ ] Create `Payment` entity (relationships: `Invoice`, `BankAccount`, `Employee`)
- [ ] Create `PaymentAuditLog` entity (relationships: `Payment`, `Employee`) — does NOT extend `BaseEntity`
- [ ] Create `BankRepository` with method: `findAllByOrderByNameAsc`
- [ ] Create `BankAccountRepository` with methods: `findAllByOrderByAliasAsc`, `findWithBankById`, `findByBankId`
- [ ] Create `PaymentRepository` with methods: `findByInvoiceIdOrderByPaymentDateDesc`, `findWithDetailsById`, `sumAmountByInvoiceId` (custom `@Query`)
- [ ] Create `PaymentAuditLogRepository` with method: `findByPaymentIdOrderByCreatedAtDesc`
- [ ] Create `PaymentRequest` record with Jakarta Validation annotations (`@NotNull`, `@DecimalMin`, `@Digits`, `@Size`)
- [ ] Create `BankAccountRequest` record with Jakarta Validation annotations (`@NotNull`, `@NotBlank`, `@Size`)
- [ ] Create `PaymentResponse` record (payment history grid DTO)
- [ ] Create `PaymentSummaryResponse` record (totalServices, totalProducts, taxAmount, discountAmount, total, totalPaid, remaining)
- [ ] Create `BankAccountResponse` record
- [ ] Create `BankResponse` record
- [ ] Create `PaymentMapper` as a manual `@Component` class (NOT MapStruct — see AGENTS.md)
  - [ ] `toResponse(Payment)` → `PaymentResponse`
  - [ ] `toEntity(PaymentRequest)` → `Payment`
- [ ] Create `BankAccountMapper` as a manual `@Component` class (NOT MapStruct — see AGENTS.md)
  - [ ] `toResponse(BankAccount)` → `BankAccountResponse`
  - [ ] `toBankResponse(Bank)` → `BankResponse`
  - [ ] `toEntity(BankAccountRequest)` → `BankAccount`
- [ ] Create `PaymentService` interface
- [ ] Create `PaymentServiceImpl` implementation
  - [ ] `getByInvoiceId(Long)` — list payments for an invoice
  - [ ] `getById(Long)` — single payment detail
  - [ ] `getSummary(Long)` — calculate payment summary (services total, products total, tax, discount, total, paid, remaining)
  - [ ] `create(Long invoiceId, PaymentRequest)` — register payment, validate remaining > 0, validate amount ≤ remaining, validate bank account for CUENTA_BANCARIA, create audit log, auto-update invoice to PAGADA if fully paid
  - [ ] `update(Long paymentId, PaymentRequest)` — modify payment, recalculate remaining excluding current, validate amount, create audit log, re-check invoice status
  - [ ] `delete(Long paymentId, Long performedByEmployeeId)` — delete payment, create audit log before deletion, re-check invoice status (may revert to PENDIENTE)
- [ ] Create `BankAccountService` interface
- [ ] Create `BankAccountServiceImpl` implementation
  - [ ] `getAll()` — list all bank accounts sorted by alias
  - [ ] `getById(Long)` — single bank account
  - [ ] `create(BankAccountRequest)` — create bank account
  - [ ] `update(Long, BankAccountRequest)` — update bank account
  - [ ] `delete(Long)` — delete bank account
  - [ ] `getAllBanks()` — list all banks sorted by name
  - [ ] `findEntityById(Long)` — internal method for PaymentService
- [ ] Create `PaymentController` with all endpoints:
  - [ ] `GET /api/invoices/{invoiceId}/payments` — list payments for invoice
  - [ ] `GET /api/invoices/{invoiceId}/payments/summary` — payment summary
  - [ ] `POST /api/invoices/{invoiceId}/payments` — register payment
  - [ ] `PUT /api/invoices/{invoiceId}/payments/{paymentId}` — modify payment
  - [ ] `DELETE /api/invoices/{invoiceId}/payments/{paymentId}?performedBy={employeeId}` — delete payment
- [ ] Create `BankAccountController` with all endpoints:
  - [ ] `GET /api/bank-accounts` — list all bank accounts
  - [ ] `GET /api/bank-accounts/{id}` — get by ID
  - [ ] `POST /api/bank-accounts` — create
  - [ ] `PUT /api/bank-accounts/{id}` — update
  - [ ] `DELETE /api/bank-accounts/{id}` — delete
  - [ ] `GET /api/bank-accounts/banks` — list all banks
- [ ] Verify backend compiles: `./mvnw clean compile`
- [ ] Verify backend starts: `./mvnw clean spring-boot:run`

### 8.2 Frontend

- [ ] Create types file `src/types/payment.ts` (`PaymentType`, `AuditAction`, `PaymentRequest`, `PaymentResponse`, `PaymentSummaryResponse`, `BankAccountRequest`, `BankAccountResponse`, `BankResponse`)
- [ ] Create API layer `src/api/payments.ts` (all payment API methods)
- [ ] Create API layer `src/api/bankAccounts.ts` (all bank account API methods)
- [ ] Create `usePayments` hook — list payments, create, update, delete with auto-refetch
- [ ] Create `usePaymentSummary` hook — fetch and refetch payment summary
- [ ] Create `useBankAccounts` hook — fetch bank accounts and banks
- [ ] Create `PaymentsTab` component — replaces PaymentsTabPlaceholder in invoice detail, with summary, action buttons (cash/bank), and history grid
- [ ] Create `PaymentSummary` component — read-only summary display (totalServices, totalProducts, tax, discount, total, totalPaid, remaining with color coding)
- [ ] Create `CashPaymentDialog` component — modal for cash payment (date, remaining display, amount, payer name, confirmation alert)
- [ ] Create `BankPaymentDialog` component — modal for bank payment (same as cash + bank account Autocomplete selector)
- [ ] Create `PaymentHistoryGrid` component — DataGrid with columns (date/time, payer name, registered by, amount, payment type chip, edit/delete actions)
- [ ] Replace `PaymentsTabPlaceholder` with `PaymentsTab` in invoice detail views
- [ ] Verify frontend compiles
- [ ] Verify frontend runs

### 8.3 Business Rules Verification

- [ ] Amount cannot exceed remaining balance
- [ ] No payments allowed if remaining = 0 (buttons disabled)
- [ ] CUENTA_BANCARIA payment type requires bankAccountId
- [ ] Audit log created on every mutation (CREATED/MODIFIED/DELETED) with JSONB old/new value snapshots
- [ ] Invoice auto-transitions to PAGADA when fully paid (totalPaid >= total)
- [ ] Invoice reverts to PENDIENTE when payment deleted/modified and totalPaid < total
- [ ] Payment amount must be > 0 (validated with @DecimalMin("0.01"))
- [ ] Payment date defaults to today on frontend
- [ ] Payer name is optional (client full name shown as placeholder)
- [ ] Confirmation alert before submitting payment (create/edit)
- [ ] Payments tab disabled during invoice creation (no invoiceId yet)
- [ ] Audit log preserves records even after payment deletion (ON DELETE SET NULL)

### 8.4 Testing

- [ ] `PaymentServiceImplTest` — all service layer test methods (getByInvoiceId, getSummary, create cash/bank, amount validation, audit log creation, invoice auto-status, update, delete with status revert)
- [ ] `BankAccountServiceImplTest` — all service layer test methods (CRUD, getAllBanks, findEntityById)
- [ ] `PaymentControllerTest` — all controller layer test methods (list, summary, create, update, delete)
- [ ] `BankAccountControllerTest` — all controller layer test methods (CRUD, banks list)
- [ ] `PaymentMapperTest` — toResponse (with/without bank account), toEntity
- [ ] `BankAccountMapperTest` — toResponse, toBankResponse, toEntity
- [ ] `PaymentsTab.test.tsx` — summary rendering, action buttons, button disabling when fully paid, payment create/delete refreshes
- [ ] `PaymentSummary.test.tsx` — displays all fields, remaining color coding, handles null summary
- [ ] `CashPaymentDialog.test.tsx` — date defaulting, remaining display, amount clamping, payer name placeholder, confirmation alert, create/edit modes
- [ ] `BankPaymentDialog.test.tsx` — same as cash tests plus bank account Autocomplete, required validation, edit mode pre-selection
- [ ] `PaymentHistoryGrid.test.tsx` — column rendering, empty state, edit/delete actions, payment type chip
- [ ] `usePayments.test.ts` — fetch, create/update/delete with refetch, loading/error states
- [ ] `usePaymentSummary.test.ts` — fetch, refetch, loading/error states
- [ ] `useBankAccounts.test.ts` — fetch accounts and banks, loading/error states
