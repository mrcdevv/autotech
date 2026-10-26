-- Client approval of estimates through a personal link, and traceability of who decided and how.
ALTER TABLE estimates
    ADD COLUMN approval_token            VARCHAR(64),
    ADD COLUMN approval_token_expires_at TIMESTAMP,
    ADD COLUMN decision_channel          VARCHAR(20),
    ADD COLUMN decided_at                TIMESTAMP,
    ADD COLUMN decided_by_employee_id    BIGINT REFERENCES employees(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX uq_estimates_approval_token ON estimates(approval_token);
