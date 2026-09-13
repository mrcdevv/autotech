package com.autotech.auth.controller;

import com.autotech.auth.dto.ChangePasswordRequest;
import com.autotech.auth.dto.LoginRequest;
import com.autotech.auth.dto.LoginResponse;
import com.autotech.auth.dto.PasswordRecoveryRequest;
import com.autotech.auth.service.AuthService;
import com.autotech.common.dto.ApiResponse;
import com.autotech.employee.model.Employee;
import com.autotech.employee.repository.EmployeeRepository;
import com.autotech.security.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final EmployeeRepository employeeRepository;
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        Employee employee = employeeRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("Empleado no encontrado"));

        LoginResponse response = LoginResponse.builder()
                .accessToken(jwt)
                .tokenType("Bearer")
                .mustChangePassword(employee.getMustChangePassword())
                .email(employee.getEmail())
                .firstName(employee.getFirstName())
                .lastName(employee.getLastName())
                .build();

        return ResponseEntity.ok(response);
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {

        authService.changePassword(request, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.<Void>success("Contraseña actualizada correctamente", null));
    }

    @PostMapping("/password-recovery")
    public ResponseEntity<ApiResponse<Void>> requestPasswordRecovery(
            @Valid @RequestBody PasswordRecoveryRequest request) {
        authService.requestPasswordRecovery(request.getEmail());
        return ResponseEntity.ok(ApiResponse.<Void>success(
                "Si el email existe, se enviaron instrucciones para recuperar la contraseña",
                null));
    }
}
