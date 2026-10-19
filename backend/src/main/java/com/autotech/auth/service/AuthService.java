package com.autotech.auth.service;

import com.autotech.auth.dto.ChangePasswordRequest;
import com.autotech.auth.dto.CurrentUserResponse;

public interface AuthService {

    void changePassword(ChangePasswordRequest request, String currentUserEmail);

    void requestPasswordRecovery(String email);

    CurrentUserResponse getCurrentUser(String email);
}
