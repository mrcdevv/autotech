package com.autotech.auth.service;

import com.autotech.auth.dto.ChangePasswordRequest;
import com.autotech.auth.model.PasswordResetToken;
import com.autotech.auth.repository.PasswordResetTokenRepository;
import com.autotech.common.exception.BusinessException;
import com.autotech.common.util.SecureTokens;
import com.autotech.config.AppProperties;
import com.autotech.email.service.EmailNotificationService;
import com.autotech.employee.model.Employee;
import com.autotech.employee.model.EmployeeStatus;
import com.autotech.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    static final int RESET_TOKEN_MINUTES = 30;
    private static final String INVALID_TOKEN_MESSAGE =
            "El enlace para restablecer la contraseña es inválido o venció. Pedí uno nuevo.";

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailNotificationService emailNotificationService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final AppProperties appProperties;

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
        employeeRepository.findByEmail(email)
                .filter(employee -> employee.getStatus() == EmployeeStatus.ACTIVO)
                .ifPresent(employee -> {
                    LocalDateTime now = LocalDateTime.now();
                    passwordResetTokenRepository.invalidateActiveTokens(employee.getId(), now);

                    String rawToken = SecureTokens.generate();
                    passwordResetTokenRepository.save(PasswordResetToken.builder()
                            .employee(employee)
                            .tokenHash(SecureTokens.sha256(rawToken))
                            .expiresAt(now.plusMinutes(RESET_TOKEN_MINUTES))
                            .build());

                    String resetUrl = appProperties.publicLink("/restablecer?token=" + rawToken);
                    emailNotificationService.notifyPasswordRecovery(employee, resetUrl, RESET_TOKEN_MINUTES);
                    log.info("Password recovery link issued for employee id: {}", employee.getId());
                });
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        LocalDateTime now = LocalDateTime.now();
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(SecureTokens.sha256(token))
                .filter(candidate -> candidate.isUsable(now))
                .orElseThrow(() -> new BusinessException(INVALID_TOKEN_MESSAGE));

        Employee employee = resetToken.getEmployee();
        if (employee.getStatus() != EmployeeStatus.ACTIVO) {
            throw new BusinessException(INVALID_TOKEN_MESSAGE);
        }

        employee.setPassword(passwordEncoder.encode(newPassword));
        employee.setMustChangePassword(false);
        employeeRepository.save(employee);
        resetToken.setUsedAt(now);
        passwordResetTokenRepository.save(resetToken);

        log.info("Password reset via recovery link for employee id: {}", employee.getId());
    }
}
