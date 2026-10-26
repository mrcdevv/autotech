package com.autotech.email.service;

import com.autotech.config.AppProperties;
import com.autotech.email.config.EmailProperties;
import com.autotech.email.dto.RenderedEmail;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.thymeleaf.ITemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Renders the Thymeleaf templates under {@code templates/email/} into HTML plus a plain-text fallback.
 */
@Component
@RequiredArgsConstructor
public class EmailTemplateRenderer {

    private static final Locale LOCALE_AR = Locale.forLanguageTag("es-AR");

    /** Chip / note colors, mirroring the frontend status tokens. */
    private static final Map<String, Map<String, String>> TONES = Map.of(
            "warn", Map.of("bg", "#F6EBD1", "fg", "#7A570E"),
            "parts", Map.of("bg", "#FBE7D2", "fg", "#8A4B12"),
            "ok", Map.of("bg", "#DFEEE3", "fg", "#1E6B41"),
            "bad", Map.of("bg", "#F8E2DC", "fg", "#A6371F"),
            "info", Map.of("bg", "#E2EAF7", "fg", "#2C5CB0"),
            "neutral", Map.of("bg", "#EAE8E1", "fg", "#4E545E")
    );

    private final ITemplateEngine templateEngine;
    private final EmailProperties emailProperties;
    private final AppProperties appProperties;

    public RenderedEmail render(String template, Map<String, Object> variables) {
        Context context = new Context(LOCALE_AR);
        context.setVariable("workshopName", emailProperties.getWorkshopName());
        context.setVariable("workshopAddress", emailProperties.getWorkshopAddress());
        context.setVariable("workshopPhone", emailProperties.getWorkshopPhone());
        context.setVariable("workshopMapsUrl", emailProperties.getWorkshopMapsUrl());
        context.setVariable("workshopContactUrl", emailProperties.getWorkshopContactUrl());
        context.setVariable("publicUrl", appProperties.getPublicUrl());
        context.setVariable("tones", TONES);
        context.setVariable("footerLine", footerLine());
        context.setVariable("unsubscribeUrl", null);
        context.setVariables(variables);

        String html = templateEngine.process("email/" + template, context);
        return new RenderedEmail(html, HtmlToText.convert(html));
    }

    public String workshopName() {
        return emailProperties.getWorkshopName();
    }

    public String workshopMapsUrl() {
        return emailProperties.getWorkshopMapsUrl();
    }

    private String footerLine() {
        return Stream.of(emailProperties.getWorkshopName(), emailProperties.getWorkshopAddress(), emailProperties.getWorkshopPhone())
                .filter(value -> value != null && !value.isBlank())
                .collect(Collectors.joining(" · "));
    }
}
