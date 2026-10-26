CREATE TABLE tax_config (
    id              BIGSERIAL PRIMARY KEY,
    tax_percentage  NUMERIC(5,2) NOT NULL DEFAULT 21,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO tax_config (tax_percentage) VALUES (21);
