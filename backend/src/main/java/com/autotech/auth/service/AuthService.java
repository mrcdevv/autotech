package com.autotech.auth.service;

import com.autotech.auth.dto.ChangePasswordRequest;

public interface AuthService {

    void changePassword(ChangePasswordRequest request, String currentUserEmail);

    /**
     * Emails a single-use recovery link when the email belongs to an active employee.
     * Does nothing otherwise, so callers must always answer the same way.
     */
    void requestPasswordRecovery(String email);

    void resetPassword(String token, String newPassword);
}
