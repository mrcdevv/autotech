ALTER TABLE appointments
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED'
    CHECK (status IN ('SCHEDULED', 'CANCELLED', 'COMPLETED'));

CREATE INDEX idx_appointments_status ON appointments (status);
