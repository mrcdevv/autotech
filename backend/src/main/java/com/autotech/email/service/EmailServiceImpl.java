package com.autotech.email.service;

import com.autotech.email.config.EmailProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final EmailProperties properties;

    @Override
    @Async
    public void send(String recipient, String subject, String body) {
        if (recipient == null || recipient.isBlank()) {
            log.debug("Skipping email with empty recipient");
            return;
        }
        sendMessage(recipient, subject, body);
    }

    @Override
    @Async
    public void send(Collection<String> recipients, String subject, String body) {
        if (recipients == null || recipients.isEmpty()) {
            log.debug("Skipping email with no recipients");
            return;
        }
        recipients.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(email -> !email.isBlank())
                .distinct()
                .forEach(recipient -> sendMessage(recipient, subject, body));
    }

    private void sendMessage(String recipient, String subject, String body) {
        if (!properties.isEnabled()) {
            log.info("Email sending disabled. Skipping '{}' email to {}", subject, recipient);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(properties.getFrom());
            message.setTo(recipient);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Sent '{}' email to {}", subject, recipient);
        } catch (MailException ex) {
            log.error("Failed to send '{}' email to {}", subject, recipient, ex);
        }
    }
}
