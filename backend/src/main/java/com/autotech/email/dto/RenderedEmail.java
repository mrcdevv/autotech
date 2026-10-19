package com.autotech.email.dto;

public record RenderedEmail(
        String html,
        String text
) {}
