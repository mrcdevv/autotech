-- Align the audit vocabulary with the renamed document: invoices no longer
-- exist, the document is a delivery note (remito). No audit_log row references
-- INVOICE (verified before this migration: the table was empty of that value),
-- so dropping and re-adding the CHECK keeps every existing row valid.
ALTER TABLE audit_log DROP CONSTRAINT audit_log_entity_type_check;

ALTER TABLE audit_log ADD CONSTRAINT audit_log_entity_type_check
    CHECK (entity_type IN ('REPAIR_ORDER', 'ESTIMATE', 'DELIVERY_NOTE'));
