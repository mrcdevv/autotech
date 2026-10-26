package com.autotech.email.service;

import com.autotech.common.exception.BusinessException;
import com.autotech.email.config.EmailProperties;
import com.autotech.email.dto.EmailMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final EmailProperties properties;
    private final EmailSender emailSender;
    private final AsyncEmailDispatcher dispatcher;

    @Override
    public void send(EmailMessage message) {
        if (message.to() == null || message.to().isBlank()) {
            log.debug("Skipping email with empty recipient");
            return;
        }
        if (!properties.isEnabled()) {
            log.info("Email sending disabled. Skipping '{}' email to {}", message.subject(), message.to());
            return;
        }

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    dispatcher.dispatch(message);
                }
            });
        } else {
            dispatcher.dispatch(message);
        }
    }

    @Override
    public void sendNow(EmailMessage message) {
        if (!properties.isEnabled()) {
            throw new BusinessException("El envío de emails está deshabilitado (AUTOTECH_MAIL_ENABLED=false)");
        }
        emailSender.deliver(message);
    }

    @Override
    public boolean isEnabled() {
        return properties.isEnabled();
    }
}
