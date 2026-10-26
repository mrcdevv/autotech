-- Scheduled reminders: workshop-wide settings, a send log used for deduplication and client opt-out.
CREATE TABLE notification_config (
    id                           BIGSERIAL PRIMARY KEY,
    reminders_enabled            BOOLEAN   NOT NULL DEFAULT TRUE,
    appointment_reminder_enabled BOOLEAN   NOT NULL DEFAULT TRUE,
    service_reminder_enabled     BOOLEAN   NOT NULL DEFAULT TRUE,
    service_reminder_months      INTEGER   NOT NULL DEFAULT 6,
    balance_due_enabled          BOOLEAN   NOT NULL DEFAULT TRUE,
    balance_due_days             INTEGER   NOT NULL DEFAULT 7,
    pickup_reminder_enabled      BOOLEAN   NOT NULL DEFAULT TRUE,
    pickup_reminder_days         INTEGER   NOT NULL DEFAULT 3,
    created_at                   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at                   TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO notification_config DEFAULT VALUES;

CREATE TABLE notification_log (
    id           BIGSERIAL PRIMARY KEY,
    type         VARCHAR(40)  NOT NULL,
    reference_id BIGINT       NOT NULL,
    recipient    VARCHAR(255) NOT NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_notification_log_type_reference UNIQUE (type, reference_id)
);

ALTER TABLE clients
    ADD COLUMN email_opt_out     BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN unsubscribe_token VARCHAR(64);

UPDATE clients
SET unsubscribe_token = replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
WHERE unsubscribe_token IS NULL;

ALTER TABLE clients ALTER COLUMN unsubscribe_token SET NOT NULL;

CREATE UNIQUE INDEX uq_clients_unsubscribe_token ON clients(unsubscribe_token);
