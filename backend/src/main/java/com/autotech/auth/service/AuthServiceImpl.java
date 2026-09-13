package com.autotech.auth.service;

import com.autotech.auth.dto.ChangePasswordRequest;
import com.autotech.email.service.EmailNotificationService;
import com.autotech.employee.model.Employee;
import com.autotech.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final String TEMP_PASSWORD_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailNotificationService emailNotificationService;

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request, String currentUserEmail) {
        Employee employee = employeeRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Empleado no encontrado"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), employee.getPassword())) {
            throw new IllegalArgumentException("La contraseña actual es incorrecta");
        }

        employee.setPassword(passwordEncoder.encode(request.getNewPassword()));
        employee.setMustChangePassword(false);
        employeeRepository.save(employee);

        log.info("Password changed for employee id: {}", employee.getId());
    }

    @Override
    @Transactional
    public void requestPasswordRecovery(String email) {
        employeeRepository.findByEmail(email).ifPresent(employee -> {
            String tempPassword = generateTempPassword();
            employee.setPassword(passwordEncoder.encode(tempPassword));
            employee.setMustChangePassword(true);
            employeeRepository.save(employee);
            emailNotificationService.notifyPasswordRecovery(employee, tempPassword);
            log.info("Password recovery requested for employee id: {}", employee.getId());
        });
    }

    private String generateTempPassword() {
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++) {
            sb.append(TEMP_PASSWORD_CHARS.charAt(random.nextInt(TEMP_PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }
}
