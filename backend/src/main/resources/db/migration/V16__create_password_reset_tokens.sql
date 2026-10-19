-- Single-use password recovery tokens. Only the SHA-256 hash of the token is stored.
CREATE TABLE password_reset_tokens (
    id          BIGSERIAL PRIMARY KEY,
    employee_id BIGINT       NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64)  NOT NULL UNIQUE,
    expires_at  TIMESTAMP    NOT NULL,
    used_at     TIMESTAMP,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_employee_id ON password_reset_tokens(employee_id);
