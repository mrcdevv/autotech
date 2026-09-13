CREATE TABLE dashboard_config (
    id                      BIGSERIAL PRIMARY KEY,
    stale_threshold_days    INTEGER NOT NULL DEFAULT 5,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO dashboard_config (stale_threshold_days) VALUES (5);
