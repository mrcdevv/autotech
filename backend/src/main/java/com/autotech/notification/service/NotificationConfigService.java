package com.autotech.notification.service;

import com.autotech.notification.dto.NotificationConfigRequest;
import com.autotech.notification.dto.NotificationConfigResponse;
import com.autotech.notification.model.NotificationConfig;

public interface NotificationConfigService {

    NotificationConfigResponse getConfig();

    NotificationConfigResponse updateConfig(NotificationConfigRequest request);

    /** Current settings for internal use (reminders job). */
    NotificationConfig getCurrent();
}
