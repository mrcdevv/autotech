package com.autotech.notification.service;

import com.autotech.client.model.Client;
import com.autotech.client.repository.ClientRepository;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.notification.dto.PublicUnsubscribeResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UnsubscribeServiceImpl implements UnsubscribeService {

    private final ClientRepository clientRepository;

    @Override
    @Transactional(readOnly = true)
    public PublicUnsubscribeResponse getByToken(String token) {
        Client client = findByToken(token);
        return new PublicUnsubscribeResponse(client.getFirstName(), Boolean.TRUE.equals(client.getEmailOptOut()));
    }

    @Override
    @Transactional
    public PublicUnsubscribeResponse unsubscribe(String token) {
        Client client = findByToken(token);
        if (!Boolean.TRUE.equals(client.getEmailOptOut())) {
            client.setEmailOptOut(true);
            clientRepository.save(client);
            log.info("Client {} unsubscribed from reminder emails", client.getId());
        }
        return new PublicUnsubscribeResponse(client.getFirstName(), true);
    }

    private Client findByToken(String token) {
        return clientRepository.findByUnsubscribeToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("El enlace para darte de baja no es válido"));
    }
}
