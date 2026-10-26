package com.autotech.notification.repository;

import com.autotech.notification.model.NotificationLog;
import com.autotech.notification.model.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {

    boolean existsByTypeAndReferenceId(NotificationType type, Long referenceId);
}
