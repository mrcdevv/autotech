package com.autotech.deliverynote.service;

public interface DeliveryNotePdfService {

    byte[] generate(Long deliveryNoteId);
}
