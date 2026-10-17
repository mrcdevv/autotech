package com.autotech.email.dto;

public record EmailAttachment(
        String filename,
        String contentType,
        byte[] content
) {}
