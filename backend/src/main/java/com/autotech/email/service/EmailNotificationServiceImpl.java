package com.autotech.email.service;

import com.autotech.email.config.EmailProperties;
import com.autotech.employee.model.Employee;
import com.autotech.employee.model.EmployeeStatus;
import com.autotech.employee.repository.EmployeeRepository;
import com.autotech.estimate.dto.EstimateDetailResponse;
import com.autotech.estimate.dto.EstimateProductResponse;
import com.autotech.estimate.dto.EstimateServiceItemResponse;
import com.autotech.estimate.dto.InspectionIssueResponse;
import com.autotech.invoice.dto.InvoiceDetailResponse;
import com.autotech.invoice.dto.InvoiceProductResponse;
import com.autotech.invoice.dto.InvoiceServiceItemResponse;
import com.autotech.payment.model.Payment;
import com.autotech.repairorder.model.RepairOrder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class EmailNotificationServiceImpl implements EmailNotificationService {

    private static final List<String> INTERNAL_NOTIFICATION_ROLES = List.of("ADMINISTRADOR", "RECEPCIONISTA");

    private final EmailService emailService;
    private final EmailProperties properties;
    private final EmployeeRepository employeeRepository;

    @Override
    public void notifyEmployeeCreated(Employee employee, String temporaryPassword) {
        if (!hasEmail(employee)) {
            return;
        }

        String subject = "Tu cuenta de " + properties.getWorkshopName() + " fue creada";
        String body = """
                Hola %s,

                Se creó tu cuenta en %s.

                Email: %s
                Contraseña temporal: %s

                Por seguridad, el sistema te pedirá cambiar la contraseña en el primer ingreso.

                Saludos,
                %s
                """.formatted(
                fullName(employee),
                properties.getWorkshopName(),
                employee.getEmail(),
                temporaryPassword,
                properties.getWorkshopName());

        emailService.send(employee.getEmail(), subject, body);
    }

    @Override
    public void notifyPasswordReset(Employee employee, String temporaryPassword) {
        sendTemporaryPassword(employee, temporaryPassword, "Tu contraseña fue restablecida");
    }

    @Override
    public void notifyPasswordRecovery(Employee employee, String temporaryPassword) {
        sendTemporaryPassword(employee, temporaryPassword, "Recuperación de contraseña");
    }

    @Override
    public void notifyEstimateCreated(EstimateDetailResponse estimate) {
        if (estimate.clientEmail() == null || estimate.clientEmail().isBlank()) {
            return;
        }

        String subject = "Presupuesto #" + estimate.id() + " - " + properties.getWorkshopName();
        String body = """
                Hola %s,

                Te enviamos el presupuesto #%d para el vehículo %s.

                Total: %s

                Servicios:
                %s

                Repuestos / productos:
                %s

                Informe de inspección:
                %s

                Saludos,
                %s
                """.formatted(
                estimate.clientFullName(),
                estimate.id(),
                vehicleLabel(estimate.vehicleBrand(), estimate.vehicleModel(), estimate.vehiclePlate()),
                money(estimate.total()),
                estimateServices(estimate.services()),
                estimateProducts(estimate.products()),
                inspectionIssues(estimate.inspectionIssues()),
                properties.getWorkshopName());

        emailService.send(estimate.clientEmail(), subject, body);
    }

    @Override
    public void notifyEstimateStatusChanged(EstimateDetailResponse estimate) {
        List<String> recipients = internalNotificationRecipients();
        if (recipients.isEmpty()) {
            return;
        }

        String subject = "Presupuesto #" + estimate.id() + " " + estimate.status().name().toLowerCase(Locale.ROOT);
        String body = """
                El presupuesto #%d fue marcado como %s.

                Cliente: %s
                Vehículo: %s
                Total: %s
                """.formatted(
                estimate.id(),
                estimate.status(),
                estimate.clientFullName(),
                vehicleLabel(estimate.vehicleBrand(), estimate.vehicleModel(), estimate.vehiclePlate()),
                money(estimate.total()));

        emailService.send(recipients, subject, body);
    }

    @Override
    public void notifyInvoiceCreated(InvoiceDetailResponse invoice) {
        if (invoice.clientEmail() == null || invoice.clientEmail().isBlank()) {
            return;
        }

        String subject = "Factura #" + invoice.id() + " - " + properties.getWorkshopName();
        String body = """
                Hola %s,

                Se emitió la factura #%d.

                Vehículo: %s
                Total: %s

                Servicios:
                %s

                Productos:
                %s

                Saludos,
                %s
                """.formatted(
                invoice.clientFullName(),
                invoice.id(),
                vehicleLabel(invoice.vehicleBrand(), invoice.vehicleModel(), invoice.vehiclePlate()),
                money(invoice.total()),
                invoiceServices(invoice.services()),
                invoiceProducts(invoice.products()),
                properties.getWorkshopName());

        emailService.send(invoice.clientEmail(), subject, body);
    }

    @Override
    public void notifyPaymentRegistered(Payment payment) {
        if (payment.getInvoice() == null
                || payment.getInvoice().getClient() == null
                || payment.getInvoice().getClient().getEmail() == null
                || payment.getInvoice().getClient().getEmail().isBlank()) {
            return;
        }

        String subject = "Pago registrado - Factura #" + payment.getInvoice().getId();
        String body = """
                Hola %s,

                Registramos un nuevo pago para la factura #%d.

                Fecha: %s
                Monto: %s
                Medio de pago: %s

                Saludos,
                %s
                """.formatted(
                clientFullName(payment),
                payment.getInvoice().getId(),
                payment.getPaymentDate(),
                money(payment.getAmount()),
                payment.getPaymentType(),
                properties.getWorkshopName());

        emailService.send(payment.getInvoice().getClient().getEmail(), subject, body);
    }

    @Override
    public void notifyVehicleReadyForPickup(RepairOrder order) {
        if (order.getClient() == null || order.getClient().getEmail() == null || order.getClient().getEmail().isBlank()) {
            return;
        }

        String subject = "Tu vehículo está listo para retirar";
        String body = """
                Hola %s %s,

                Tu vehículo %s está listo para retirar.

                Orden de trabajo: %s

                Saludos,
                %s
                """.formatted(
                order.getClient().getFirstName(),
                order.getClient().getLastName(),
                vehicleLabel(
                        order.getVehicle().getBrand() != null ? order.getVehicle().getBrand().getName() : null,
                        order.getVehicle().getModel(),
                        order.getVehicle().getPlate()),
                order.getTitle() != null ? order.getTitle() : "#" + order.getId(),
                properties.getWorkshopName());

        emailService.send(order.getClient().getEmail(), subject, body);
    }

    private void sendTemporaryPassword(Employee employee, String temporaryPassword, String subject) {
        if (!hasEmail(employee)) {
            return;
        }

        String body = """
                Hola %s,

                Se generó una contraseña temporal para tu cuenta de %s.

                Contraseña temporal: %s

                Por seguridad, el sistema te pedirá cambiarla en el próximo ingreso.

                Saludos,
                %s
                """.formatted(fullName(employee), properties.getWorkshopName(), temporaryPassword, properties.getWorkshopName());

        emailService.send(employee.getEmail(), subject, body);
    }

    private List<String> internalNotificationRecipients() {
        return employeeRepository.findActiveEmailsByRoleNames(INTERNAL_NOTIFICATION_ROLES, EmployeeStatus.ACTIVO);
    }

    private boolean hasEmail(Employee employee) {
        return employee != null && employee.getEmail() != null && !employee.getEmail().isBlank();
    }

    private String fullName(Employee employee) {
        return employee.getFirstName() + " " + employee.getLastName();
    }

    private String clientFullName(Payment payment) {
        return payment.getInvoice().getClient().getFirstName() + " " + payment.getInvoice().getClient().getLastName();
    }

    private String money(BigDecimal value) {
        if (value == null) {
            return "$0,00";
        }
        NumberFormat formatter = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("es-AR"));
        return formatter.format(value);
    }

    private String vehicleLabel(String brand, String model, String plate) {
        String vehicle = String.join(" ", List.of(
                brand != null ? brand : "",
                model != null ? model : ""
        )).trim();
        if (vehicle.isBlank()) {
            vehicle = "Vehículo";
        }
        return plate != null && !plate.isBlank() ? vehicle + " (" + plate + ")" : vehicle;
    }

    private String estimateServices(List<EstimateServiceItemResponse> services) {
        if (services == null || services.isEmpty()) {
            return "- Sin servicios cargados";
        }
        return services.stream()
                .map(service -> "- " + service.serviceName() + ": " + money(service.price()))
                .reduce((left, right) -> left + "\n" + right)
                .orElse("- Sin servicios cargados");
    }

    private String estimateProducts(List<EstimateProductResponse> products) {
        if (products == null || products.isEmpty()) {
            return "- Sin productos cargados";
        }
        return products.stream()
                .map(product -> "- " + product.productName() + " x" + product.quantity() + ": " + money(product.totalPrice()))
                .reduce((left, right) -> left + "\n" + right)
                .orElse("- Sin productos cargados");
    }

    private String invoiceServices(List<InvoiceServiceItemResponse> services) {
        if (services == null || services.isEmpty()) {
            return "- Sin servicios cargados";
        }
        return services.stream()
                .map(service -> "- " + service.serviceName() + ": " + money(service.price()))
                .reduce((left, right) -> left + "\n" + right)
                .orElse("- Sin servicios cargados");
    }

    private String invoiceProducts(List<InvoiceProductResponse> products) {
        if (products == null || products.isEmpty()) {
            return "- Sin productos cargados";
        }
        return products.stream()
                .map(product -> "- " + product.productName() + " x" + product.quantity() + ": " + money(product.totalPrice()))
                .reduce((left, right) -> left + "\n" + right)
                .orElse("- Sin productos cargados");
    }

    private String inspectionIssues(List<InspectionIssueResponse> issues) {
        if (issues == null || issues.isEmpty()) {
            return "- No se registraron observaciones relevantes";
        }
        return issues.stream()
                .map(issue -> "- " + issue.itemName() + " (" + issue.status() + "): " + nullToDash(issue.comment()))
                .reduce((left, right) -> left + "\n" + right)
                .orElse("- No se registraron observaciones relevantes");
    }

    private String nullToDash(String value) {
        return value == null || value.isBlank() ? "Sin comentario" : value;
    }
}
