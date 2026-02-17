package com.autotech.appointment.repository;

import com.autotech.appointment.model.Appointment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @EntityGraph(attributePaths = {"client", "vehicle", "employees", "tags"})
    Optional<Appointment> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"client", "vehicle", "employees", "tags"})
    Page<Appointment> findAll(Pageable pageable);

    @Query("""
            SELECT a FROM Appointment a
            WHERE a.startTime >= :rangeStart AND a.startTime < :rangeEnd
            ORDER BY a.startTime ASC
            """)
    @EntityGraph(attributePaths = {"client", "vehicle", "employees", "tags"})
    List<Appointment> findByDateRange(
            @Param("rangeStart") LocalDateTime rangeStart,
            @Param("rangeEnd") LocalDateTime rangeEnd
    );

    @Query("""
            SELECT DISTINCT a FROM Appointment a
            JOIN a.employees e
            WHERE e.id = :employeeId
              AND a.startTime >= :rangeStart
              AND a.startTime < :rangeEnd
            ORDER BY a.startTime ASC
            """)
    @EntityGraph(attributePaths = {"client", "vehicle", "employees", "tags"})
    List<Appointment> findByEmployeeAndDateRange(
            @Param("employeeId") Long employeeId,
            @Param("rangeStart") LocalDateTime rangeStart,
            @Param("rangeEnd") LocalDateTime rangeEnd
    );

    Long countByStartTimeBetween(LocalDateTime start, LocalDateTime end);
}
