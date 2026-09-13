package com.autotech.email.service;

import java.util.Collection;

public interface EmailService {

    void send(String recipient, String subject, String body);

    void send(Collection<String> recipients, String subject, String body);
}
