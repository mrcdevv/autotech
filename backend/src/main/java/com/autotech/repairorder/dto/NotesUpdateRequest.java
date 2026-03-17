package com.autotech.repairorder.dto;

public record NotesUpdateRequest(
        String reason,
        String mechanicNotes
) {}
