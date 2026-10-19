package com.autotech.auth.controller;

import com.autotech.auth.dto.ChangePasswordRequest;
import com.autotech.auth.dto.CurrentUserResponse;
import com.autotech.auth.dto.LoginRequest;
import com.autotech.auth.dto.LoginResponse;
import com.autotech.auth.dto.PasswordRecoveryRequest;
import com.autotech.auth.dto.PasswordResetRequest;
import com.autotech.auth.service.AuthService;
import com.autotech.common.dto.ApiResponse;
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
import org.springframework.web.bind.annotation.GetMapping;
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

        CurrentUserResponse currentUser = authService.getCurrentUser(authentication.getName());

        LoginResponse response = LoginResponse.builder()
                .accessToken(jwt)
                .tokenType("Bearer")
                .mustChangePassword(currentUser.mustChangePassword())
                .email(currentUser.email())
                .firstName(currentUser.firstName())
                .lastName(currentUser.lastName())
                .roles(currentUser.roles())
                .permissions(currentUser.permissions())
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<CurrentUserResponse>> me(@AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(ApiResponse.success(authService.getCurrentUser(currentUser.getUsername())));
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
                "Si el email corresponde a una cuenta activa, te enviamos un enlace para restablecer la contraseña",
                null));
    }

    @PostMapping("/password-reset")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody PasswordResetRequest request) {
        authService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.ok(ApiResponse.<Void>success("Contraseña restablecida. Ya podés iniciar sesión.", null));
    }
}
