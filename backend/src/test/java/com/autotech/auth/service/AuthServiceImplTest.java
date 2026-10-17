package com.autotech.auth.service;

import com.autotech.auth.model.PasswordResetToken;
import com.autotech.auth.repository.PasswordResetTokenRepository;
import com.autotech.common.exception.BusinessException;
import com.autotech.common.util.SecureTokens;
import com.autotech.config.AppProperties;
import com.autotech.email.service.EmailNotificationService;
import com.autotech.employee.model.Employee;
import com.autotech.employee.model.EmployeeStatus;
import com.autotech.employee.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailNotificationService emailNotificationService;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    private AuthServiceImpl authService;

    private Employee employee;

    @BeforeEach
    void setUp() {
        AppProperties appProperties = new AppProperties();
        appProperties.setPublicUrl("http://localhost:3000");
        authService = new AuthServiceImpl(employeeRepository, passwordEncoder, emailNotificationService,
                passwordResetTokenRepository, appProperties);

        employee = Employee.builder().firstName("Lucía").lastName("Fernández").email("lucia@taller.com")
                .status(EmployeeStatus.ACTIVO).password("old-hash").mustChangePassword(false).build();
        employee.setId(5L);
    }

    @Test
    void givenUnknownEmail_whenRequestPasswordRecovery_thenNoTokenAndNoEmail() {
        // Arrange
        when(employeeRepository.findByEmail("nadie@taller.com")).thenReturn(Optional.empty());

        // Act
        authService.requestPasswordRecovery("nadie@taller.com");

        // Assert
        verify(passwordResetTokenRepository, never()).save(any());
        verify(emailNotificationService, never()).notifyPasswordRecovery(any(), anyString(), anyInt());
    }

    @Test
    void givenInactiveEmployee_whenRequestPasswordRecovery_thenNoTokenAndNoEmail() {
        // Arrange
        employee.setStatus(EmployeeStatus.INACTIVO);
        when(employeeRepository.findByEmail("lucia@taller.com")).thenReturn(Optional.of(employee));

        // Act
        authService.requestPasswordRecovery("lucia@taller.com");

        // Assert
        verify(passwordResetTokenRepository, never()).save(any());
    }

    @Test
    void givenActiveEmployee_whenRequestPasswordRecovery_thenStoreHashedTokenEmailLinkAndKeepPassword() {
        // Arrange
        when(employeeRepository.findByEmail("lucia@taller.com")).thenReturn(Optional.of(employee));

        // Act
        authService.requestPasswordRecovery("lucia@taller.com");

        // Assert
        verify(passwordResetTokenRepository).invalidateActiveTokens(eq(5L), any(LocalDateTime.class));
        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(passwordResetTokenRepository).save(tokenCaptor.capture());
        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailNotificationService).notifyPasswordRecovery(eq(employee), urlCaptor.capture(), eq(30));

        String url = urlCaptor.getValue();
        assertThat(url).startsWith("http://localhost:3000/restablecer?token=");
        String rawToken = url.substring(url.indexOf("token=") + 6);
        PasswordResetToken saved = tokenCaptor.getValue();
        assertThat(saved.getTokenHash()).isEqualTo(SecureTokens.sha256(rawToken)).isNotEqualTo(rawToken);
        assertThat(saved.getExpiresAt()).isAfter(LocalDateTime.now().plusMinutes(29))
                .isBefore(LocalDateTime.now().plusMinutes(31));
        assertThat(employee.getPassword()).isEqualTo("old-hash");
    }

    @Test
    void givenValidToken_whenResetPassword_thenUpdatePasswordAndMarkTokenUsed() {
        // Arrange
        PasswordResetToken token = PasswordResetToken.builder().employee(employee)
                .tokenHash(SecureTokens.sha256("raw")).expiresAt(LocalDateTime.now().plusMinutes(10)).build();
        when(passwordResetTokenRepository.findByTokenHash(SecureTokens.sha256("raw"))).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("nueva123")).thenReturn("new-hash");

        // Act
        authService.resetPassword("raw", "nueva123");

        // Assert
        assertThat(employee.getPassword()).isEqualTo("new-hash");
        assertThat(employee.getMustChangePassword()).isFalse();
        assertThat(token.getUsedAt()).isNotNull();
        verify(employeeRepository).save(employee);
    }

    @Test
    void givenExpiredToken_whenResetPassword_thenThrowBusinessException() {
        // Arrange
        PasswordResetToken token = PasswordResetToken.builder().employee(employee)
                .tokenHash(SecureTokens.sha256("raw")).expiresAt(LocalDateTime.now().minusMinutes(1)).build();
        when(passwordResetTokenRepository.findByTokenHash(SecureTokens.sha256("raw"))).thenReturn(Optional.of(token));

        // Act & Assert
        assertThatThrownBy(() -> authService.resetPassword("raw", "nueva123"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("inválido o venció");
        assertThat(employee.getPassword()).isEqualTo("old-hash");
    }

    @Test
    void givenUsedToken_whenResetPassword_thenThrowBusinessException() {
        // Arrange
        PasswordResetToken token = PasswordResetToken.builder().employee(employee)
                .tokenHash(SecureTokens.sha256("raw")).expiresAt(LocalDateTime.now().plusMinutes(10))
                .usedAt(LocalDateTime.now().minusMinutes(1)).build();
        when(passwordResetTokenRepository.findByTokenHash(SecureTokens.sha256("raw"))).thenReturn(Optional.of(token));

        // Act & Assert
        assertThatThrownBy(() -> authService.resetPassword("raw", "nueva123"))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void givenUnknownToken_whenResetPassword_thenThrowBusinessException() {
        // Arrange
        when(passwordResetTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> authService.resetPassword("nope", "nueva123"))
                .isInstanceOf(BusinessException.class);
    }
}
