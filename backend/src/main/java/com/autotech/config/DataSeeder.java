package com.autotech.config;

import com.autotech.employee.model.Employee;
import com.autotech.employee.model.EmployeeStatus;
import com.autotech.employee.repository.EmployeeRepository;
import com.autotech.role.model.Role;
import com.autotech.role.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final String ADMIN_EMAIL    = "admin@autotech.com";
    private static final String ADMIN_PASSWORD = "admin123";
    private static final String ADMIN_ROLE     = "ADMINISTRADOR";

    private final EmployeeRepository employeeRepository;
    private final RoleRepository     roleRepository;
    private final PasswordEncoder    passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedAdminEmployee();
    }

    private void seedAdminEmployee() {
        Role adminRole = roleRepository.findByName(ADMIN_ROLE)
                .orElseThrow(() -> new IllegalStateException(
                        "[DataSeeder] Role '" + ADMIN_ROLE + "' not found — aborting."));

        employeeRepository.findByEmail(ADMIN_EMAIL).ifPresentOrElse(
            existing -> {
                // Re-encode password with the app's BCryptPasswordEncoder
                existing.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
                existing.setStatus(EmployeeStatus.ACTIVO);
                existing.setMustChangePassword(true);
                if (existing.getRoles().isEmpty()) {
                    existing.getRoles().add(adminRole);
                }
                employeeRepository.save(existing);
                log.info("[DataSeeder] Admin '{}' password re-encoded with app BCrypt.", ADMIN_EMAIL);
            },
            () -> {
                Employee admin = Employee.builder()
                        .firstName("Admin")
                        .lastName("Autotech")
                        .dni("00000000")
                        .email(ADMIN_EMAIL)
                        .phone("000000000")
                        .entryDate(LocalDate.now())
                        .status(EmployeeStatus.ACTIVO)
                        .password(passwordEncoder.encode(ADMIN_PASSWORD))
                        .mustChangePassword(true)
                        .build();
                admin.getRoles().add(adminRole);
                employeeRepository.save(admin);
                log.info("[DataSeeder] Admin '{}' created with role '{}'.", ADMIN_EMAIL, ADMIN_ROLE);
            }
        );
    }
}
