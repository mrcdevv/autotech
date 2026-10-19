package com.autotech.email.service;

import com.autotech.email.config.EmailProperties;
import com.autotech.email.dto.EmailAttachment;
import com.autotech.email.dto.EmailMessage;
import jakarta.mail.BodyPart;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.javamail.JavaMailSender;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EmailSenderTest {

    @Test
    void givenMessageWithAttachment_whenDeliver_thenSendMultipartWithHtmlTextAndAttachment() throws Exception {
        // Arrange
        JavaMailSender mailSender = mock(JavaMailSender.class);
        when(mailSender.createMimeMessage()).thenReturn(new MimeMessage(Session.getInstance(new Properties())));
        EmailProperties properties = new EmailProperties();
        properties.setFrom("taller@test.com");
        EmailSender sender = new EmailSender(mailSender, properties);
        EmailMessage message = new EmailMessage("cliente@test.com", "Remito #0001",
                "<p>Hola <b>Martín</b></p>", "Hola Martín",
                List.of(new EmailAttachment("remito.pdf", "application/pdf", new byte[]{1, 2, 3})));

        // Act
        sender.deliver(message);

        // Assert
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(captor.capture());
        MimeMessage sent = captor.getValue();
        sent.saveChanges();
        assertThat(sent.getSubject()).isEqualTo("Remito #0001");
        assertThat(sent.getAllRecipients()[0].toString()).isEqualTo("cliente@test.com");
        assertThat(sent.getFrom()[0].toString()).contains("taller@test.com");

        ByteArrayOutputStream raw = new ByteArrayOutputStream();
        sent.writeTo(raw);
        String mime = raw.toString(StandardCharsets.UTF_8);
        assertThat(mime).contains("text/plain").contains("text/html").contains("multipart/alternative");
        assertThat(findAttachmentName((Multipart) sent.getContent())).isEqualTo("remito.pdf");
    }

    private String findAttachmentName(Multipart multipart) throws Exception {
        for (int i = 0; i < multipart.getCount(); i++) {
            BodyPart part = multipart.getBodyPart(i);
            if (Part.ATTACHMENT.equalsIgnoreCase(part.getDisposition())) {
                return part.getFileName();
            }
            if (part.getContent() instanceof Multipart nested) {
                String name = findAttachmentName(nested);
                if (name != null) {
                    return name;
                }
            }
        }
        return null;
    }
}
