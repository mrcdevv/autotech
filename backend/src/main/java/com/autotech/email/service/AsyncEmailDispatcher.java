package com.autotech.email.service;

import com.autotech.email.dto.EmailMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AsyncEmailDispatcher {

    private final EmailSender emailSender;

    @Async
    public void dispatch(EmailMessage message) {
        try {
            emailSender.deliver(message);
        } catch (MailException ex) {
            log.error("Failed to send '{}' email to {}", message.subject(), message.to(), ex);
        }
    }
}
