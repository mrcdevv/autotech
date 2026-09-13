package com.autotech.appointment.repository;

import com.autotech.appointment.model.CalendarConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CalendarConfigRepository extends JpaRepository<CalendarConfig, Long> {

    default CalendarConfig getConfig() {
        return findAll().stream().findFirst()
                .orElseGet(() -> save(CalendarConfig.builder().build()));
    }
}
