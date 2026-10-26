-- Generic audit log (D8). One table for all audited entities.
-- entity_id deliberately has NO foreign key: an audit row must outlive the row it describes.
-- performed_by_employee_id keeps a plain FK with no ON DELETE, like payments (D10):
-- employees are never deleted, so the FK is a safety net.
CREATE TABLE audit_log (
    id                       BIGSERIAL PRIMARY KEY,
    entity_type              VARCHAR(50) NOT NULL
                             CHECK (entity_type IN ('REPAIR_ORDER', 'ESTIMATE', 'INVOICE')),
    entity_id                BIGINT NOT NULL,
    action                   VARCHAR(20) NOT NULL
                             CHECK (action IN ('CREATED', 'MODIFIED', 'DELETED')),
    old_values               JSONB,
    new_values               JSONB,
    performed_by_employee_id BIGINT REFERENCES employees(id),
    created_at               TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_entity ON audit_log (entity_type, entity_id);
