package com.autotech.email.service;

import com.autotech.common.exception.BusinessException;
import com.autotech.email.config.EmailProperties;
import com.autotech.email.dto.EmailMessage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class EmailServiceImplTest {

    @Mock
    private EmailSender emailSender;

    @Mock
    private AsyncEmailDispatcher dispatcher;

    private EmailProperties properties;
    private EmailServiceImpl emailService;

    private final EmailMessage message = new EmailMessage("cliente@test.com", "Asunto", "<p>Hola</p>", "Hola", List.of());

    @BeforeEach
    void setUp() {
        properties = new EmailProperties();
        properties.setEnabled(true);
        emailService = new EmailServiceImpl(properties, emailSender, dispatcher);
    }

    @AfterEach
    void tearDown() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void givenMailDisabled_whenSend_thenNothingIsDispatched() {
        // Arrange
        properties.setEnabled(false);

        // Act
        emailService.send(message);

        // Assert
        verifyNoInteractions(dispatcher, emailSender);
    }

    @Test
    void givenBlankRecipient_whenSend_thenNothingIsDispatched() {
        // Act
        emailService.send(new EmailMessage(" ", "Asunto", "<p>x</p>", "x", null));

        // Assert
        verifyNoInteractions(dispatcher);
    }

    @Test
    void givenNoTransaction_whenSend_thenDispatchImmediately() {
        // Act
        emailService.send(message);

        // Assert
        verify(dispatcher).dispatch(message);
    }

    @Test
    void givenActiveTransaction_whenSend_thenDispatchOnlyAfterCommit() {
        // Arrange
        TransactionSynchronizationManager.initSynchronization();

        // Act
        emailService.send(message);

        // Assert
        verify(dispatcher, never()).dispatch(any());
        List<TransactionSynchronization> synchronizations = TransactionSynchronizationManager.getSynchronizations();
        synchronizations.forEach(TransactionSynchronization::afterCommit);
        verify(dispatcher).dispatch(message);
    }

    @Test
    void givenMailDisabled_whenSendNow_thenThrowBusinessException() {
        // Arrange
        properties.setEnabled(false);

        // Act & Assert
        assertThatThrownBy(() -> emailService.sendNow(message))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("deshabilitado");
    }

    @Test
    void givenMailEnabled_whenSendNow_thenDeliverSynchronously() {
        // Act
        emailService.sendNow(message);

        // Assert
        verify(emailSender).deliver(message);
    }
}
