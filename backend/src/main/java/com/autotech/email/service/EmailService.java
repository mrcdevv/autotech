package com.autotech.email.service;

import com.autotech.email.dto.EmailMessage;

public interface EmailService {

    /**
     * Queues the email for asynchronous delivery. When called inside a transaction, delivery
     * happens only after a successful commit. Failures are logged, never propagated.
     */
    void send(EmailMessage message);

    /**
     * Delivers the email synchronously and propagates any failure (used for the test email).
     */
    void sendNow(EmailMessage message);

    boolean isEnabled();
}
