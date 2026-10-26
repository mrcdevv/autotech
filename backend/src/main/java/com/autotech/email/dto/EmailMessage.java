package com.autotech.email.dto;

import java.util.List;

public record EmailMessage(
        String to,
        String subject,
        String htmlBody,
        String textBody,
        List<EmailAttachment> attachments
) {

    public EmailMessage {
        attachments = attachments == null ? List.of() : List.copyOf(attachments);
    }
}
