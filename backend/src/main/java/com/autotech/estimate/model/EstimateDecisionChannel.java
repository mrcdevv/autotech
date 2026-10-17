package com.autotech.estimate.model;

/**
 * How the client communicated the approval / rejection of an estimate.
 * EMAIL_LINK is set automatically when the client uses the link sent by email.
 */
public enum EstimateDecisionChannel {
    WHATSAPP,
    PHONE,
    IN_PERSON,
    EMAIL_LINK
}
