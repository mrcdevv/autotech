package com.autotech.common.exception;

/**
 * Signals that the request conflicts with the current state of a resource (HTTP 409),
 * e.g. attempting to modify a protected system record.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
