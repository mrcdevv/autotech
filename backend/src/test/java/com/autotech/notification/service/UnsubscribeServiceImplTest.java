package com.autotech.notification.service;

import com.autotech.client.model.Client;
import com.autotech.client.repository.ClientRepository;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.notification.dto.PublicUnsubscribeResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UnsubscribeServiceImplTest {

    @Mock
    private ClientRepository clientRepository;

    @InjectMocks
    private UnsubscribeServiceImpl unsubscribeService;

    @Test
    void givenValidToken_whenUnsubscribe_thenMarkClientOptedOut() {
        // Arrange
        Client client = Client.builder().firstName("Ana").lastName("Paz").phone("1").emailOptOut(false).build();
        when(clientRepository.findByUnsubscribeToken("tok")).thenReturn(Optional.of(client));

        // Act
        PublicUnsubscribeResponse result = unsubscribeService.unsubscribe("tok");

        // Assert
        assertThat(client.getEmailOptOut()).isTrue();
        assertThat(result.optedOut()).isTrue();
        assertThat(result.clientFirstName()).isEqualTo("Ana");
        verify(clientRepository).save(client);
    }

    @Test
    void givenUnknownToken_whenGetByToken_thenThrowResourceNotFoundException() {
        // Arrange
        when(clientRepository.findByUnsubscribeToken("nope")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> unsubscribeService.getByToken("nope"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
