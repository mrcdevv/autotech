-- Client self-service confirmation of appointments through a personal link sent by email.
ALTER TABLE appointments
    ADD COLUMN confirmation_token  VARCHAR(64),
    ADD COLUMN confirmation_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN confirmed_at        TIMESTAMP;

UPDATE appointments
SET confirmation_token = replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
WHERE confirmation_token IS NULL;

ALTER TABLE appointments ALTER COLUMN confirmation_token SET NOT NULL;

CREATE UNIQUE INDEX uq_appointments_confirmation_token ON appointments(confirmation_token);
