package com.autotech.notification.service;

import com.autotech.notification.dto.PublicUnsubscribeResponse;

public interface UnsubscribeService {

    PublicUnsubscribeResponse getByToken(String token);

    /** Stops reminder emails for the client that owns the token. */
    PublicUnsubscribeResponse unsubscribe(String token);
}
