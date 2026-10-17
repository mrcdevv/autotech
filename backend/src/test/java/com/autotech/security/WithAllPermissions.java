package com.autotech.security;

import org.springframework.security.test.context.support.WithMockUser;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Mock user holding every permission code (the ADMINISTRADOR set), for controller
 * slice tests that exercise behavior rather than authorization.
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@WithMockUser(authorities = {
        "ROLE_ADMINISTRADOR",
        "create_client", "read_client", "update_client", "delete_client",
        "create_employee", "read_employee", "update_employee", "delete_employee",
        "create_vehicle", "read_vehicle", "update_vehicle", "delete_vehicle",
        "create_order", "read_order", "update_order", "delete_order",
        "create_inspection", "read_inspection", "update_inspection", "delete_inspection",
        "create_estimate", "read_estimate", "update_estimate", "delete_estimate",
        "create_delivery_note", "read_delivery_note", "update_delivery_note", "delete_delivery_note",
        "create_payment", "read_payment", "update_payment", "delete_payment",
        "create_appointment", "read_appointment", "update_appointment", "delete_appointment",
        "view_reports", "manage_config", "manage_services", "manage_products", "manage_roles"
})
public @interface WithAllPermissions {
}
