package com.autotech.email.service;

import com.autotech.appointment.model.Appointment;
import com.autotech.appointment.model.AppointmentConfirmationStatus;
import com.autotech.appointment.model.VehicleDeliveryMethod;
import com.autotech.client.model.Client;
import com.autotech.common.exception.BusinessException;
import com.autotech.config.AppProperties;
import com.autotech.deliverynote.dto.DeliveryNoteDetailResponse;
import com.autotech.deliverynote.model.DeliveryNote;
import com.autotech.deliverynote.service.DeliveryNotePdfService;
import com.autotech.email.dto.EmailAttachment;
import com.autotech.email.dto.EmailDetailRow;
import com.autotech.email.dto.EmailIssue;
import com.autotech.email.dto.EmailMessage;
import com.autotech.email.dto.RenderedEmail;
import com.autotech.employee.model.Employee;
import com.autotech.employee.model.EmployeeStatus;
import com.autotech.employee.repository.EmployeeRepository;
import com.autotech.estimate.dto.EstimateDetailResponse;
import com.autotech.estimate.dto.InspectionIssueResponse;
import com.autotech.estimate.model.Estimate;
import com.autotech.estimate.model.EstimateDecisionChannel;
import com.autotech.estimate.model.EstimateServiceItem;
import com.autotech.estimate.model.EstimateStatus;
import com.autotech.estimate.repository.EstimateRepository;
import com.autotech.payment.dto.PaymentSummaryResponse;
import com.autotech.payment.model.Payment;
import com.autotech.payment.model.PaymentType;
import com.autotech.repairorder.model.RepairOrder;
import com.autotech.vehicle.model.Vehicle;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailNotificationServiceImpl implements EmailNotificationService {

    private static final List<String> INTERNAL_NOTIFICATION_ROLES = List.of("ADMINISTRADOR", "RECEPCIONISTA");

    private final EmailService emailService;
    private final EmailTemplateRenderer renderer;
    private final AppProperties appProperties;
    private final EmployeeRepository employeeRepository;
    private final EstimateRepository estimateRepository;
    // Lazy lookup: DeliveryNotePdfService -> DeliveryNoteService -> EmailNotificationService would be a cycle
    private final ObjectProvider<DeliveryNotePdfService> deliveryNotePdfService;

    @Override
    public void notifyEmployeeCreated(Employee employee, String temporaryPassword) {
        if (!hasEmail(employee)) {
            return;
        }
        Map<String, Object> vars = new HashMap<>();
        vars.put("name", employee.getFirstName());
        vars.put("rows", List.of(
                new EmailDetailRow("Email", employee.getEmail()),
                new EmailDetailRow("Contraseña temporal", temporaryPassword)));
        vars.put("loginUrl", appProperties.publicLink("/login"));
        send(employee.getEmail(), "Tu cuenta de " + workshopName() + " fue creada", "employee-welcome", vars);
    }

    @Override
    public void notifyPasswordReset(Employee employee, String temporaryPassword) {
        if (!hasEmail(employee)) {
            return;
        }
        Map<String, Object> vars = new HashMap<>();
        vars.put("name", employee.getFirstName());
        vars.put("email", employee.getEmail());
        vars.put("rows", List.of(new EmailDetailRow("Contraseña temporal", temporaryPassword)));
        vars.put("loginUrl", appProperties.publicLink("/login"));
        send(employee.getEmail(), "Tu contraseña de " + workshopName() + " fue restablecida", "password-temporary", vars);
    }

    @Override
    public void notifyPasswordRecovery(Employee employee, String resetUrl, int expiresMinutes) {
        if (!hasEmail(employee)) {
            return;
        }
        Map<String, Object> vars = new HashMap<>();
        vars.put("name", employee.getFirstName());
        vars.put("email", employee.getEmail());
        vars.put("resetUrl", resetUrl);
        vars.put("expiresMinutes", expiresMinutes);
        send(employee.getEmail(), "Restablecé tu contraseña de " + workshopName(), "password-recovery", vars);
    }

    @Override
    public void notifyEstimateCreated(EstimateDetailResponse estimate, String approvalPageUrl, int linkValidDays) {
        if (isBlank(estimate.clientEmail())) {
            return;
        }
        Map<String, Object> vars = new HashMap<>();
        vars.put("name", firstName(estimate.clientFullName()));
        vars.put("estimateNumber", EmailFormats.number(estimate.id()));
        vars.put("vehicle", EmailFormats.vehicleLabel(estimate.vehicleBrand(), estimate.vehicleModel(), estimate.vehiclePlate()));
        vars.put("items", estimateItems(estimate));
        vars.put("total", EmailFormats.money(estimate.total()));
        vars.put("issues", inspectionIssues(estimate.inspectionIssues()));
        vars.put("chipLabel", "Esperando tu aprobación");
        vars.put("chipTone", "warn");
        vars.put("approveUrl", approvalPageUrl != null ? approvalPageUrl + "?decision=aprobar" : null);
        vars.put("rejectUrl", approvalPageUrl != null ? approvalPageUrl + "?decision=rechazar" : null);
        vars.put("expiresDays", linkValidDays);
        send(estimate.clientEmail(),
                "Presupuesto " + EmailFormats.number(estimate.id()) + " para tu "
                        + EmailFormats.vehicleName(estimate.vehicleBrand(), estimate.vehicleModel()),
                "estimate-approval", vars);
    }

    @Override
    public void notifyEstimateStatusChanged(EstimateDetailResponse estimate) {
        List<String> recipients = internalNotificationRecipients();
        if (recipients.isEmpty()) {
            return;
        }
        boolean approved = estimate.status() == EstimateStatus.ACEPTADO;
        String statusLabel = approved ? "aprobado" : "rechazado";

        List<EmailDetailRow> rows = new ArrayList<>();
        rows.add(new EmailDetailRow("Cliente", estimate.clientFullName()));
        rows.add(new EmailDetailRow("Vehículo",
                EmailFormats.vehicleLabel(estimate.vehicleBrand(), estimate.vehicleModel(), estimate.vehiclePlate())));
        rows.add(new EmailDetailRow("Total", EmailFormats.money(estimate.total())));
        if (estimate.decisionChannel() != null) {
            rows.add(new EmailDetailRow("Respondió por", decisionChannelLabel(estimate.decisionChannel())));
        }
        if (estimate.decidedByEmployeeName() != null) {
            rows.add(new EmailDetailRow("Registrado por", estimate.decidedByEmployeeName()));
        }

        Map<String, Object> vars = new HashMap<>();
        vars.put("chipLabel", approved ? "Aprobado" : "Rechazado");
        vars.put("chipTone", approved ? "ok" : "bad");
        vars.put("estimateNumber", EmailFormats.number(estimate.id()));
        vars.put("statusLabel", statusLabel);
        vars.put("clientName", estimate.clientFullName());
        vars.put("rows", rows);
        vars.put("detailUrl", appProperties.publicLink("/presupuestos/" + estimate.id()));

        RenderedEmail rendered = renderer.render("estimate-decision", vars);
        String subject = "Presupuesto " + EmailFormats.number(estimate.id()) + " " + statusLabel;
        recipients.stream().distinct().forEach(recipient ->
                emailService.send(new EmailMessage(recipient, subject, rendered.html(), rendered.text(), List.of())));
    }

    @Override
    public void notifyDeliveryNoteCreated(DeliveryNoteDetailResponse deliveryNote) {
        if (isBlank(deliveryNote.clientEmail())) {
            return;
        }
        List<EmailDetailRow> items = new ArrayList<>();
        if (deliveryNote.services() != null) {
            deliveryNote.services().forEach(service ->
                    items.add(new EmailDetailRow(service.serviceName(), EmailFormats.money(service.price()))));
        }
        if (deliveryNote.products() != null) {
            deliveryNote.products().forEach(product ->
                    items.add(new EmailDetailRow(product.productName() + " x" + product.quantity(),
                            EmailFormats.money(product.totalPrice()))));
        }
        List<EmailAttachment> attachments = deliveryNotePdf(deliveryNote.id(), deliveryNote.number()).stream().toList();
        String number = EmailFormats.number(deliveryNote.number());

        Map<String, Object> vars = new HashMap<>();
        vars.put("name", firstName(deliveryNote.clientFullName()));
        vars.put("number", number);
        vars.put("vehicle", EmailFormats.vehicleLabel(deliveryNote.vehicleBrand(), deliveryNote.vehicleModel(), deliveryNote.vehiclePlate()));
        vars.put("items", items);
        vars.put("total", EmailFormats.money(deliveryNote.total()));
        vars.put("hasAttachment", !attachments.isEmpty());
        send(deliveryNote.clientEmail(), "Remito " + number + " - " + workshopName(), "delivery-note", vars, attachments);
    }

    @Override
    public void notifyPaymentRegistered(Payment payment, PaymentSummaryResponse summary) {
        Client client = payment.getDeliveryNote() != null ? payment.getDeliveryNote().getClient() : null;
        if (client == null || isBlank(client.getEmail())) {
            return;
        }
        boolean fullyPaid = summary != null && summary.remaining().compareTo(BigDecimal.ZERO) <= 0;
        String number = EmailFormats.number(payment.getDeliveryNote().getNumber());

        List<EmailDetailRow> rows = new ArrayList<>();
        rows.add(new EmailDetailRow("Fecha", EmailFormats.date(payment.getPaymentDate())));
        rows.add(new EmailDetailRow("Monto", EmailFormats.money(payment.getAmount())));
        rows.add(new EmailDetailRow("Medio de pago", paymentTypeLabel(payment.getPaymentType())));
        if (summary != null) {
            rows.add(new EmailDetailRow("Total del remito", EmailFormats.money(summary.total())));
            rows.add(new EmailDetailRow("Saldo pendiente", EmailFormats.money(summary.remaining())));
        }

        Map<String, Object> vars = new HashMap<>();
        vars.put("name", client.getFirstName());
        vars.put("number", number);
        vars.put("rows", rows);
        vars.put("chipLabel", fullyPaid ? "Remito pagado" : "Pago parcial");
        vars.put("chipTone", fullyPaid ? "ok" : "warn");
        send(client.getEmail(), "Pago registrado - Remito " + number, "payment-registered", vars);
    }

    @Override
    public void notifyVehicleReceived(RepairOrder order) {
        Client client = order.getClient();
        if (client == null || isBlank(client.getEmail())) {
            return;
        }
        List<EmailDetailRow> rows = new ArrayList<>();
        rows.add(new EmailDetailRow("Orden de trabajo", EmailFormats.number(order.getId())));
        rows.add(new EmailDetailRow("Vehículo", vehicleLabel(order.getVehicle())));
        LocalDateTime receivedAt = appProperties.workshopNow();
        rows.add(new EmailDetailRow("Ingreso", EmailFormats.shortDateTime(receivedAt)));
        if (!isBlank(order.getReason())) {
            rows.add(new EmailDetailRow("Motivo", order.getReason()));
        }

        Map<String, Object> vars = new HashMap<>();
        vars.put("name", client.getFirstName());
        vars.put("rows", rows);
        send(client.getEmail(), "Recibimos tu " + vehicleName(order.getVehicle()) + " en el taller",
                "vehicle-received", vars);
    }

    @Override
    public void notifyVehicleReadyForPickup(RepairOrder order) {
        Client client = order.getClient();
        if (client == null || isBlank(client.getEmail())) {
            return;
        }
        Vehicle vehicle = order.getVehicle();
        List<EmailDetailRow> rows = new ArrayList<>();
        rows.add(new EmailDetailRow("Vehículo", vehicleLabel(vehicle)));
        acceptedEstimate(order.getId()).ifPresent(estimate -> {
            String works = estimate.getServices().stream()
                    .map(EstimateServiceItem::getServiceName)
                    .sorted()
                    .collect(Collectors.joining(", "));
            if (!works.isBlank()) {
                rows.add(new EmailDetailRow("Trabajos realizados", works));
            }
            rows.add(new EmailDetailRow("Total", EmailFormats.money(estimate.getTotal())));
        });

        Map<String, Object> vars = new HashMap<>();
        vars.put("name", client.getFirstName());
        vars.put("orderNumber", EmailFormats.number(order.getId()));
        vars.put("rows", rows);
        send(client.getEmail(), "Tu " + vehicleName(vehicle) + " está listo para retirar", "vehicle-ready", vars);
    }

    @Override
    public void notifyAppointmentScheduled(Appointment appointment) {
        Client client = appointment.getClient();
        if (client == null || isBlank(client.getEmail())) {
            return;
        }
        List<EmailDetailRow> rows = new ArrayList<>();
        rows.add(new EmailDetailRow("Fecha", EmailFormats.longDate(appointment.getStartTime())));
        rows.add(new EmailDetailRow("Horario", EmailFormats.timeRange(appointment.getStartTime(), appointment.getEndTime())));
        if (appointment.getVehicle() != null) {
            rows.add(new EmailDetailRow("Vehículo", vehicleLabel(appointment.getVehicle())));
        }
        if (!isBlank(appointment.getPurpose())) {
            rows.add(new EmailDetailRow("Motivo", appointment.getPurpose()));
        }
        if (appointment.getVehicleDeliveryMethod() != null) {
            rows.add(new EmailDetailRow("Llegada del vehículo", deliveryMethodLabel(appointment.getVehicleDeliveryMethod())));
        }

        Map<String, Object> vars = new HashMap<>();
        vars.put("name", client.getFirstName());
        vars.put("rows", rows);
        putAppointmentLinks(vars, appointment);
        send(client.getEmail(), "Confirmá tu turno del " + shortDayDate(appointment.getStartTime()),
                "appointment-confirm", vars);
    }

    @Override
    public void notifyAppointmentRescheduled(Appointment appointment, LocalDateTime previousStart, LocalDateTime previousEnd) {
        Client client = appointment.getClient();
        if (client == null || isBlank(client.getEmail())) {
            return;
        }
        Map<String, Object> vars = new HashMap<>();
        vars.put("name", client.getFirstName());
        vars.put("vehicle", appointment.getVehicle() != null ? vehicleLabel(appointment.getVehicle()) : null);
        vars.put("oldDate", EmailFormats.shortDate(previousStart));
        vars.put("oldTime", EmailFormats.timeRange(previousStart, previousEnd));
        vars.put("newDate", EmailFormats.shortDate(appointment.getStartTime()));
        vars.put("newTime", EmailFormats.timeRange(appointment.getStartTime(), appointment.getEndTime()));
        vars.put("purpose", isBlank(appointment.getPurpose()) ? null : appointment.getPurpose());
        putAppointmentLinks(vars, appointment);
        send(client.getEmail(), "Cambiamos tu turno al " + shortDayDate(appointment.getStartTime()),
                "appointment-rescheduled", vars);
    }

    @Override
    public void notifyAppointmentCancelled(Appointment appointment) {
        Client client = appointment.getClient();
        if (client == null || isBlank(client.getEmail())) {
            return;
        }
        List<EmailDetailRow> rows = new ArrayList<>();
        if (appointment.getVehicle() != null) {
            rows.add(new EmailDetailRow("Vehículo", vehicleLabel(appointment.getVehicle())));
        }
        if (!isBlank(appointment.getPurpose())) {
            rows.add(new EmailDetailRow("Motivo del turno", appointment.getPurpose()));
        }
        Map<String, Object> vars = new HashMap<>();
        vars.put("name", client.getFirstName());
        vars.put("dateTime", EmailFormats.shortDateTime(appointment.getStartTime()));
        vars.put("rows", rows);
        send(client.getEmail(), "Tu turno del " + shortDayDate(appointment.getStartTime()) + " fue cancelado",
                "appointment-cancelled", vars);
    }

    // ---------------------------------------------------------------------------------------------
    // Scheduled reminders
    // ---------------------------------------------------------------------------------------------

    @Override
    public void sendAppointmentReminder(Appointment appointment) {
        Client client = appointment.getClient();
        LocalDate date = appointment.getStartTime().toLocalDate();
        boolean pending = appointment.getConfirmationStatus() == AppointmentConfirmationStatus.PENDING;
        String pageUrl = appProperties.publicLink("/turno/" + appointment.getConfirmationToken());

        Map<String, Object> vars = new HashMap<>();
        vars.put("name", client.getFirstName());
        vars.put("monthShort", EmailFormats.monthShort(date));
        vars.put("day", date.getDayOfMonth());
        vars.put("dayName", EmailFormats.dayName(date));
        vars.put("timeRange", EmailFormats.timeRange(appointment.getStartTime(), appointment.getEndTime()));
        vars.put("vehicle", appointment.getVehicle() != null ? vehicleLabel(appointment.getVehicle()) : null);
        vars.put("purpose", isBlank(appointment.getPurpose()) ? null : appointment.getPurpose());
        vars.put("primaryLabel", pending ? "Confirmar turno" : "Ver cómo llegar");
        vars.put("primaryUrl", pending ? pageUrl + "?respuesta=confirmar" : blankToNull(renderer.workshopMapsUrl()));
        vars.put("declineUrl", pageUrl + "?respuesta=no-puedo");
        vars.put("unsubscribeUrl", unsubscribeUrl(client));
        send(client.getEmail(), "Te esperamos mañana a las " + EmailFormats.time(appointment.getStartTime()),
                "appointment-reminder", vars);
    }

    @Override
    public void sendServiceReminder(RepairOrder lastDeliveredOrder, int monthsSinceService) {
        Client client = lastDeliveredOrder.getClient();
        Vehicle vehicle = lastDeliveredOrder.getVehicle();
        LocalDateTime lastService = lastDeliveredOrder.getDeliveredAt() != null
                ? lastDeliveredOrder.getDeliveredAt() : lastDeliveredOrder.getUpdatedAt();
        String months = monthsSinceService == 1 ? "1 mes" : monthsSinceService + " meses";

        Map<String, Object> vars = new HashMap<>();
        vars.put("name", client.getFirstName());
        vars.put("months", months);
        vars.put("vehicle", vehicleLabel(vehicle));
        vars.put("lastServiceDate", EmailFormats.date(lastService));
        vars.put("orderNumber", "Orden " + EmailFormats.number(lastDeliveredOrder.getId()));
        vars.put("lastWorks", isBlank(lastDeliveredOrder.getReason()) ? null : lastDeliveredOrder.getReason());
        vars.put("unsubscribeUrl", unsubscribeUrl(client));
        send(client.getEmail(), "Ya pasaron " + months + " del último service de tu " + vehicleName(vehicle),
                "service-reminder", vars);
    }

    @Override
    public void sendBalanceDueReminder(DeliveryNote deliveryNote, PaymentSummaryResponse summary) {
        Client client = deliveryNote.getClient();
        String number = EmailFormats.number(deliveryNote.getNumber());
        int percentPaid = summary.total().signum() > 0
                ? summary.totalPaid().multiply(BigDecimal.valueOf(100))
                        .divide(summary.total(), 0, java.math.RoundingMode.DOWN).intValue()
                : 0;
        List<EmailAttachment> attachments = deliveryNotePdf(deliveryNote.getId(), deliveryNote.getNumber()).stream().toList();

        Map<String, Object> vars = new HashMap<>();
        vars.put("name", client.getFirstName());
        vars.put("number", number);
        vars.put("vehicle", deliveryNote.getVehicle() != null ? vehicleLabel(deliveryNote.getVehicle()) : null);
        vars.put("date", EmailFormats.date(deliveryNote.getCreatedAt()));
        vars.put("total", EmailFormats.money(summary.total()));
        vars.put("paid", EmailFormats.money(summary.totalPaid()));
        vars.put("remaining", EmailFormats.money(summary.remaining()));
        vars.put("percentPaid", Math.max(0, Math.min(100, percentPaid)));
        vars.put("hasAttachment", !attachments.isEmpty());
        vars.put("unsubscribeUrl", unsubscribeUrl(client));
        send(client.getEmail(), "Tenés un saldo pendiente en el remito " + number, "balance-due", vars, attachments);
    }

    @Override
    public void sendPickupReminder(RepairOrder order, long daysWaiting) {
        Client client = order.getClient();
        String readySince = order.getReadyForPickupAt() != null
                ? EmailFormats.shortDate(order.getReadyForPickupAt()) : "-";

        Map<String, Object> vars = new HashMap<>();
        vars.put("name", client.getFirstName());
        vars.put("vehicle", vehicleLabel(order.getVehicle()));
        vars.put("days", daysWaiting);
        vars.put("daysLabel", daysWaiting == 1 ? "día" : "días");
        vars.put("readySince", readySince);
        vars.put("orderNumber", EmailFormats.number(order.getId()));
        vars.put("unsubscribeUrl", unsubscribeUrl(client));
        send(client.getEmail(), "Tu " + vehicleName(order.getVehicle()) + " te espera en el taller",
                "vehicle-not-picked-up", vars);
    }

    @Override
    public void sendTestEmail(String to) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("sentAt", EmailFormats.date(appProperties.workshopNow()) + " "
                + EmailFormats.time(appProperties.workshopNow()));
        RenderedEmail rendered = renderer.render("test-email", vars);
        try {
            emailService.sendNow(new EmailMessage(to, "Email de prueba - " + workshopName(),
                    rendered.html(), rendered.text(), List.of()));
        } catch (MailException ex) {
            log.warn("Test email to {} failed", to, ex);
            throw new BusinessException("No se pudo enviar el email de prueba: " + ex.getMostSpecificCause().getMessage());
        }
    }

    // ---------------------------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------------------------

    private void send(String to, String subject, String template, Map<String, Object> vars) {
        send(to, subject, template, vars, List.of());
    }

    private void send(String to, String subject, String template, Map<String, Object> vars,
                      List<EmailAttachment> attachments) {
        RenderedEmail rendered = renderer.render(template, vars);
        emailService.send(new EmailMessage(to, subject, rendered.html(), rendered.text(), attachments));
    }

    private Optional<EmailAttachment> deliveryNotePdf(Long deliveryNoteId, Long number) {
        try {
            byte[] pdf = deliveryNotePdfService.getObject().generate(deliveryNoteId);
            String filename = "remito-" + (number != null ? String.format("%08d", number) : deliveryNoteId) + ".pdf";
            return Optional.of(new EmailAttachment(filename, "application/pdf", pdf));
        } catch (RuntimeException ex) {
            log.warn("Could not generate PDF for delivery note {}; sending email without attachment", deliveryNoteId, ex);
            return Optional.empty();
        }
    }

    private Optional<Estimate> acceptedEstimate(Long repairOrderId) {
        return estimateRepository.findAllByRepairOrderId(repairOrderId).stream()
                .filter(estimate -> estimate.getStatus() == EstimateStatus.ACEPTADO)
                .findFirst();
    }

    private List<EmailDetailRow> estimateItems(EstimateDetailResponse estimate) {
        List<EmailDetailRow> items = new ArrayList<>();
        if (estimate.services() != null) {
            estimate.services().forEach(service ->
                    items.add(new EmailDetailRow(service.serviceName(), EmailFormats.money(service.price()))));
        }
        if (estimate.products() != null) {
            estimate.products().forEach(product ->
                    items.add(new EmailDetailRow(product.productName() + " x" + product.quantity(),
                            EmailFormats.money(product.totalPrice()))));
        }
        if (estimate.discountPercentage() != null && estimate.discountPercentage().signum() > 0) {
            items.add(new EmailDetailRow("Descuento", estimate.discountPercentage().stripTrailingZeros().toPlainString() + " %"));
        }
        if (estimate.taxPercentage() != null && estimate.taxPercentage().signum() > 0) {
            items.add(new EmailDetailRow("IVA", estimate.taxPercentage().stripTrailingZeros().toPlainString() + " %"));
        }
        return items;
    }

    private List<EmailIssue> inspectionIssues(List<InspectionIssueResponse> issues) {
        if (issues == null) {
            return List.of();
        }
        return issues.stream()
                .map(issue -> {
                    boolean urgent = "PROBLEMA".equals(issue.status());
                    String text = isBlank(issue.comment()) ? issue.itemName() : issue.itemName() + ": " + issue.comment();
                    return new EmailIssue(urgent ? "Urgente" : "Puede esperar", urgent ? "bad" : "warn", text);
                })
                .toList();
    }

    private List<String> internalNotificationRecipients() {
        return employeeRepository.findActiveEmailsByRoleNames(INTERNAL_NOTIFICATION_ROLES, EmployeeStatus.ACTIVO);
    }

    private String unsubscribeUrl(Client client) {
        return client.getUnsubscribeToken() != null
                ? appProperties.publicLink("/baja/" + client.getUnsubscribeToken())
                : null;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private void putAppointmentLinks(Map<String, Object> vars, Appointment appointment) {
        String pageUrl = appProperties.publicLink("/turno/" + appointment.getConfirmationToken());
        vars.put("confirmUrl", pageUrl + "?respuesta=confirmar");
        vars.put("declineUrl", pageUrl + "?respuesta=no-puedo");
    }

    /** "jueves 23/10" (lower case, used inside subjects) */
    private String shortDayDate(LocalDateTime dateTime) {
        return EmailFormats.shortDate(dateTime).toLowerCase(java.util.Locale.forLanguageTag("es-AR"));
    }

    private String deliveryMethodLabel(VehicleDeliveryMethod method) {
        return switch (method) {
            case PROPIO -> "Lo trae el cliente";
            case GRUA -> "Llega en grúa";
            case TERCERO -> "Lo trae un tercero";
        };
    }

    private String decisionChannelLabel(EstimateDecisionChannel channel) {
        return switch (channel) {
            case WHATSAPP -> "WhatsApp";
            case PHONE -> "Teléfono";
            case IN_PERSON -> "En persona";
            case EMAIL_LINK -> "Enlace del email (el cliente)";
        };
    }

    private String paymentTypeLabel(PaymentType type) {
        if (type == null) {
            return "-";
        }
        return switch (type) {
            case EFECTIVO -> "Efectivo";
            case CUENTA_BANCARIA -> "Transferencia bancaria";
        };
    }

    private String vehicleLabel(Vehicle vehicle) {
        if (vehicle == null) {
            return "Vehículo";
        }
        return EmailFormats.vehicleLabel(vehicle.getBrand() != null ? vehicle.getBrand().getName() : null,
                vehicle.getModel(), vehicle.getPlate());
    }

    private String vehicleName(Vehicle vehicle) {
        if (vehicle == null) {
            return "vehículo";
        }
        return EmailFormats.vehicleName(vehicle.getBrand() != null ? vehicle.getBrand().getName() : null, vehicle.getModel());
    }

    private String workshopName() {
        return renderer.workshopName();
    }

    private boolean hasEmail(Employee employee) {
        return employee != null && !isBlank(employee.getEmail());
    }

    private static String firstName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "";
        }
        return fullName.trim().split("\\s+")[0];
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
