-- Confirmation links expire, mirroring estimate approval links.
ALTER TABLE appointments
    ADD COLUMN confirmation_token_expires_at TIMESTAMP;
