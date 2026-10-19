package com.autotech.email.service;

import com.autotech.email.config.EmailProperties;
import com.autotech.email.dto.EmailAttachment;
import com.autotech.email.dto.EmailMessage;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailPreparationException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

/**
 * Builds a multipart MIME message (plain text + HTML alternative, plus attachments) and hands it to SMTP.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmailSender {

    private final JavaMailSender mailSender;
    private final EmailProperties properties;

    public void deliver(EmailMessage message) {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(
                    mimeMessage, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());
            helper.setFrom(properties.getFrom(), properties.getWorkshopName());
            helper.setTo(message.to());
            helper.setSubject(message.subject());
            helper.setText(message.textBody(), message.htmlBody());
            for (EmailAttachment attachment : message.attachments()) {
                helper.addAttachment(attachment.filename(),
                        new ByteArrayResource(attachment.content()), attachment.contentType());
            }
        } catch (MessagingException | java.io.UnsupportedEncodingException ex) {
            throw new MailPreparationException("No se pudo preparar el email", ex);
        }
        mailSender.send(mimeMessage);
        log.info("Sent '{}' email to {}", message.subject(), message.to());
    }
}
