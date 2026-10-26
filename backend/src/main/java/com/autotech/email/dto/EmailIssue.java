package com.autotech.email.dto;

/**
 * An inspection finding shown with a colored label (tone: bad / warn).
 */
public record EmailIssue(
        String label,
        String tone,
        String text
) {}
