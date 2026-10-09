package com.autotech.invoice.service;

public interface InvoicePdfService {

    byte[] generate(Long invoiceId);
}
