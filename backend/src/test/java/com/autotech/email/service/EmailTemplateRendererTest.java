package com.autotech.email.service;

import com.autotech.config.AppProperties;
import com.autotech.email.config.EmailProperties;
import com.autotech.email.dto.EmailDetailRow;
import com.autotech.email.dto.EmailIssue;
import com.autotech.email.dto.RenderedEmail;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class EmailTemplateRendererTest {

    private EmailTemplateRenderer renderer;

    static EmailTemplateRenderer buildRenderer() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding(StandardCharsets.UTF_8.name());
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);

        EmailProperties emailProperties = new EmailProperties();
        emailProperties.setWorkshopName("Autotech");
        emailProperties.setWorkshopAddress("Av. Colón 1234, Córdoba");
        emailProperties.setWorkshopPhone("351 555-1234");
        AppProperties appProperties = new AppProperties();
        appProperties.setPublicUrl("http://localhost:3000");
        return new EmailTemplateRenderer(engine, emailProperties, appProperties);
    }

    @BeforeEach
    void setUp() {
        renderer = buildRenderer();
    }

    @Test
    void givenEstimateWithLinks_whenRender_thenHtmlHasLayoutButtonsAndTextFallbackHasUrls() {
        // Arrange
        Map<String, Object> vars = new HashMap<>();
        vars.put("name", "Martín");
        vars.put("estimateNumber", "#0318");
        vars.put("vehicle", "Toyota Corolla (AB 123 CD)");
        vars.put("items", List.of(new EmailDetailRow("Alineación y balanceo", "$ 32.000,00")));
        vars.put("total", "$ 175.400,00");
        vars.put("issues", List.of(new EmailIssue("Urgente", "bad", "Bujes de parrilla con juego excesivo")));
        vars.put("chipLabel", "Esperando tu aprobación");
        vars.put("chipTone", "warn");
        vars.put("approveUrl", "http://localhost:3000/presupuesto/tok?decision=aprobar");
        vars.put("rejectUrl", "http://localhost:3000/presupuesto/tok?decision=rechazar");
        vars.put("expiresDays", 7);

        // Act
        RenderedEmail email = renderer.render("estimate-approval", vars);

        // Assert
        assertThat(email.html()).contains("AUTOTECH").contains("Presupuesto #0318")
                .contains("#FF7A1A").contains("Esperando tu aprobación")
                .contains("Autotech · Av. Colón 1234, Córdoba · 351 555-1234");
        assertThat(email.text()).contains("Aprobar presupuesto: http://localhost:3000/presupuesto/tok?decision=aprobar")
                .contains("Alineación y balanceo $ 32.000,00")
                .contains("Urgente Bujes de parrilla con juego excesivo")
                .contains("Este es un mensaje automático");
    }

    @Test
    void givenEstimateWithoutLinks_whenRender_thenNoApprovalButtons() {
        // Arrange
        Map<String, Object> vars = new HashMap<>();
        vars.put("name", "Martín");
        vars.put("estimateNumber", "#0318");
        vars.put("vehicle", "Toyota Corolla");
        vars.put("items", List.of());
        vars.put("total", "$ 0,00");
        vars.put("issues", List.of());
        vars.put("chipLabel", "Esperando tu aprobación");
        vars.put("chipTone", "warn");
        vars.put("approveUrl", null);
        vars.put("rejectUrl", null);

        // Act
        RenderedEmail email = renderer.render("estimate-approval", vars);

        // Assert
        assertThat(email.html()).doesNotContain("Aprobar presupuesto").doesNotContain("Informe de inspección");
    }

    @Test
    void givenUnsubscribeUrl_whenRender_thenFooterShowsUnsubscribeLink() {
        // Arrange
        Map<String, Object> vars = new HashMap<>();
        vars.put("sentAt", "17/10/2026 18:00");
        vars.put("unsubscribeUrl", "http://localhost:3000/baja/xyz");

        // Act
        RenderedEmail email = renderer.render("test-email", vars);

        // Assert
        assertThat(email.text()).contains("Darme de baja: http://localhost:3000/baja/xyz")
                .doesNotContain("Este es un mensaje automático");
    }

    @Test
    void givenUserProvidedText_whenRender_thenHtmlIsEscaped() {
        // Arrange
        Map<String, Object> vars = new HashMap<>();
        vars.put("name", "<script>alert(1)</script>");
        vars.put("orderNumber", "#0001");
        vars.put("rows", List.of(new EmailDetailRow("Vehículo", "Fiat <b>Uno</b>")));

        // Act
        RenderedEmail email = renderer.render("vehicle-ready", vars);

        // Assert
        assertThat(email.html()).doesNotContain("<script>").contains("&lt;script&gt;")
                .doesNotContain("<b>Uno</b>");
    }

    @Test
    void givenEachSimpleTemplate_whenRender_thenRendersWithoutErrors() {
        // Arrange
        Map<String, Map<String, Object>> samples = new LinkedHashMap<>();
        samples.put("employee-welcome", vars("name", "Lucía", "loginUrl", "http://x/login",
                        "rows", List.of(new EmailDetailRow("Contraseña temporal", "Abc123"))));
        samples.put("password-temporary", vars("name", "Lucía", "email", "l@t.com", "loginUrl", "http://x/login",
                        "rows", List.of(new EmailDetailRow("Contraseña temporal", "Abc123"))));
        samples.put("estimate-decision", vars("chipLabel", "Aprobado", "chipTone", "ok", "estimateNumber", "#0001",
                        "statusLabel", "aprobado", "clientName", "Martín", "detailUrl", "http://x/presupuestos/1",
                        "rows", List.of(new EmailDetailRow("Canal", "WhatsApp"))));
        samples.put("delivery-note", vars("name", "Martín", "number", "#0001", "vehicle", "Fiat Uno",
                        "items", List.of(), "total", "$ 1,00", "hasAttachment", true));
        samples.put("password-recovery", vars("name", "Lucía", "email", "l@t.com",
                        "resetUrl", "http://x/restablecer?token=abc", "expiresMinutes", 30));
        samples.put("appointment-confirm", vars("name", "Martín", "confirmUrl", "http://x/turno/t?respuesta=confirmar",
                        "declineUrl", "http://x/turno/t?respuesta=no-puedo",
                        "rows", List.of(new EmailDetailRow("Fecha", "Jueves 23 de octubre"))));
        samples.put("appointment-rescheduled", vars("name", "Martín", "vehicle", "Fiat Uno", "oldDate", "Jueves 23/10",
                        "oldTime", "09:00 a 10:00", "newDate", "Viernes 24/10", "newTime", "11:00 a 12:00",
                        "purpose", "Service", "confirmUrl", "http://x/c", "declineUrl", "http://x/d"));
        samples.put("appointment-cancelled", vars("name", "Martín", "dateTime", "Jueves 23/10 · 09:00",
                        "rows", List.of(new EmailDetailRow("Vehículo", "Fiat Uno"))));
        samples.put("vehicle-received", vars("name", "Martín", "rows", List.of(new EmailDetailRow("Orden de trabajo", "#1042"))));
        samples.put("appointment-reminder", vars("name", "Martín", "monthShort", "OCT", "day", 23, "dayName", "Jueves",
                "timeRange", "09:00 a 10:00", "vehicle", "Fiat Uno", "purpose", null, "primaryLabel", "Confirmar turno",
                "primaryUrl", "http://x/c", "declineUrl", "http://x/d", "unsubscribeUrl", "http://x/baja/t"));
        samples.put("service-reminder", vars("name", "Martín", "months", "6 meses", "vehicle", "Fiat Uno",
                "lastServiceDate", "17/04/2026", "orderNumber", "Orden #0987", "lastWorks", null,
                "unsubscribeUrl", "http://x/baja/t"));
        samples.put("balance-due", vars("name", "Martín", "number", "#0556", "vehicle", "Fiat Uno", "date", "02/10/2026",
                "total", "$ 10,00", "paid", "$ 4,00", "remaining", "$ 6,00", "percentPaid", 40, "hasAttachment", true,
                "unsubscribeUrl", "http://x/baja/t"));
        samples.put("vehicle-not-picked-up", vars("name", "Martín", "vehicle", "Fiat Uno", "days", 5L, "daysLabel", "días",
                "readySince", "Sábado 11/10", "orderNumber", "#1042", "unsubscribeUrl", "http://x/baja/t"));
        samples.put("payment-registered", vars("name", "Martín", "number", "#0001", "chipLabel", "Pago parcial",
                        "chipTone", "warn", "rows", List.of(new EmailDetailRow("Monto", "$ 1,00"))));

        samples.forEach((template, vars) -> {
            // Act
            RenderedEmail email = renderer.render(template, vars);

            // Assert
            assertThat(email.html()).as(template).contains("AUTOTECH");
            assertThat(email.text()).as(template).isNotBlank();
        });
    }

    static Map<String, Object> vars(Object... keyValues) {
        Map<String, Object> vars = new HashMap<>();
        for (int i = 0; i < keyValues.length; i += 2) {
            vars.put((String) keyValues[i], keyValues[i + 1]);
        }
        return vars;
    }
}
