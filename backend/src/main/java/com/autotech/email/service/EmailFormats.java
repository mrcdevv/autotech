package com.autotech.email.service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;

/**
 * Spanish (Argentina) formatting helpers for email content.
 */
public final class EmailFormats {

    private static final Locale LOCALE_AR = Locale.forLanguageTag("es-AR");
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter SHORT_DATE = DateTimeFormatter.ofPattern("dd/MM");
    private static final DateTimeFormatter FULL_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private EmailFormats() {
    }

    public static String money(BigDecimal value) {
        NumberFormat formatter = NumberFormat.getCurrencyInstance(LOCALE_AR);
        return formatter.format(value != null ? value : BigDecimal.ZERO);
    }

    /** "Jueves" */
    public static String dayName(LocalDate date) {
        return capitalize(date.getDayOfWeek().getDisplayName(TextStyle.FULL, LOCALE_AR));
    }

    /** "OCT" */
    public static String monthShort(LocalDate date) {
        return date.getMonth().getDisplayName(TextStyle.SHORT, LOCALE_AR).replace(".", "").toUpperCase(LOCALE_AR);
    }

    /** "Jueves 23 de octubre" */
    public static String longDate(LocalDateTime dateTime) {
        LocalDate date = dateTime.toLocalDate();
        return dayName(date) + " " + date.getDayOfMonth() + " de "
                + date.getMonth().getDisplayName(TextStyle.FULL, LOCALE_AR);
    }

    /** "Jueves 23/10" */
    public static String shortDate(LocalDateTime dateTime) {
        return dayName(dateTime.toLocalDate()) + " " + dateTime.format(SHORT_DATE);
    }

    /** "Jueves 23/10 · 09:00" */
    public static String shortDateTime(LocalDateTime dateTime) {
        return shortDate(dateTime) + " · " + time(dateTime);
    }

    /** "23/10/2026" */
    public static String date(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(FULL_DATE) : "";
    }

    /** "23/10/2026" */
    public static String date(LocalDate date) {
        return date != null ? date.format(FULL_DATE) : "";
    }

    public static String time(LocalDateTime dateTime) {
        return dateTime.format(TIME);
    }

    /** "09:00 a 10:00" */
    public static String timeRange(LocalDateTime start, LocalDateTime end) {
        return time(start) + " a " + time(end);
    }

    /** "Toyota Corolla (AB 123 CD)" */
    public static String vehicleLabel(String brand, String model, String plate) {
        String vehicle = String.join(" ", List.of(
                brand != null ? brand : "",
                model != null ? model : ""
        )).trim();
        if (vehicle.isBlank()) {
            vehicle = "Vehículo";
        }
        return plate != null && !plate.isBlank() ? vehicle + " (" + plate + ")" : vehicle;
    }

    /** "Toyota Corolla" (falls back to "vehículo") */
    public static String vehicleName(String brand, String model) {
        String vehicle = String.join(" ", List.of(
                brand != null ? brand : "",
                model != null ? model : ""
        )).trim();
        return vehicle.isBlank() ? "vehículo" : vehicle;
    }

    /** "#0042" */
    public static String number(Long value) {
        return value != null ? "#" + String.format("%04d", value) : "";
    }

    private static String capitalize(String value) {
        return value.isEmpty() ? value : value.substring(0, 1).toUpperCase(LOCALE_AR) + value.substring(1);
    }
}
