package com.autotech.employee.dto;

import com.autotech.employee.model.EmployeeStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record EmployeeRequest(

        @NotBlank(message = "El nombre es obligatorio") @Size(max = 100, message = "El nombre no debe superar los 100 caracteres") String firstName,

        @NotBlank(message = "El apellido es obligatorio") @Size(max = 100, message = "El apellido no debe superar los 100 caracteres") String lastName,

        @NotBlank(message = "El DNI es obligatorio") @Size(max = 20, message = "El DNI no debe superar los 20 caracteres") String dni,

        @NotBlank(message = "El correo electrónico es obligatorio") @Email(message = "El formato del correo electrónico no es válido") @Size(max = 255, message = "El correo no debe superar los 255 caracteres") String email,

        @NotBlank(message = "El teléfono es obligatorio") @Size(max = 20, message = "El teléfono no debe superar los 20 caracteres") String phone,

        @NotBlank(message = "La dirección es obligatoria") @Size(max = 255, message = "La dirección no debe superar los 255 caracteres") String address,

        @NotBlank(message = "La provincia es obligatoria") @Size(max = 100, message = "La provincia no debe superar los 100 caracteres") String province,

        @NotBlank(message = "La ciudad es obligatoria") @Size(max = 100, message = "La ciudad no debe superar los 100 caracteres") String city,

        @NotBlank(message = "El país es obligatorio") @Size(max = 100, message = "El país no debe superar los 100 caracteres") String country,

        @NotBlank(message = "El estado civil es obligatorio") @Size(max = 20, message = "El estado civil no debe superar los 20 caracteres") String maritalStatus,

        @NotNull(message = "La cantidad de hijos es obligatoria") @Min(value = 0, message = "La cantidad de hijos no puede ser negativa") Integer childrenCount,

        @NotNull(message = "La fecha de entrada es obligatoria") LocalDate entryDate,

        @NotNull(message = "El estado es obligatorio") EmployeeStatus status,

        @NotEmpty(message = "Debe asignar al menos un rol") List<Long> roleIds) {
}
