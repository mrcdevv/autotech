package com.autotech.notification.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record NotificationConfigRequest(

        @NotNull(message = "Indicá si los recordatorios están activos")
        Boolean remindersEnabled,

        @NotNull(message = "Indicá si el recordatorio de turnos está activo")
        Boolean appointmentReminderEnabled,

        @NotNull(message = "Indicá si el recordatorio de service está activo")
        Boolean serviceReminderEnabled,

        @NotNull(message = "Los meses para el recordatorio de service son obligatorios")
        @Min(value = 1, message = "El recordatorio de service debe ser de al menos 1 mes")
        @Max(value = 36, message = "El recordatorio de service no puede superar los 36 meses")
        Integer serviceReminderMonths,

        @NotNull(message = "Indicá si el recordatorio de saldo pendiente está activo")
        Boolean balanceDueEnabled,

        @NotNull(message = "Los días para el recordatorio de saldo son obligatorios")
        @Min(value = 1, message = "El recordatorio de saldo debe ser de al menos 1 día")
        @Max(value = 180, message = "El recordatorio de saldo no puede superar los 180 días")
        Integer balanceDueDays,

        @NotNull(message = "Indicá si el recordatorio de retiro está activo")
        Boolean pickupReminderEnabled,

        @NotNull(message = "Los días para el recordatorio de retiro son obligatorios")
        @Min(value = 1, message = "El recordatorio de retiro debe ser de al menos 1 día")
        @Max(value = 60, message = "El recordatorio de retiro no puede superar los 60 días")
        Integer pickupReminderDays
) {}
