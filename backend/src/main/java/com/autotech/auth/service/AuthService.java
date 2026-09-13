package com.autotech.auth.service;

import com.autotech.auth.dto.ChangePasswordRequest;

public interface AuthService {

    void changePassword(ChangePasswordRequest request, String currentUserEmail);

    void requestPasswordRecovery(String email);
}
