package com.autotech.common.audit;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    // The actor is a lazy many-to-one; the entity graph fetches it in one join
    // so rendering N history rows never triggers N extra selects.
    @EntityGraph(attributePaths = "performedByEmployee")
    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(AuditEntityType entityType, Long entityId);
}
