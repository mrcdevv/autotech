# Database Migration Rules

1. All schema changes must go through Flyway migration scripts.
2. Never rely on `hibernate.ddl-auto` for schema creation in production. Always set it to `validate`.
3. Migration files follow the naming convention: `V{version}__{description}.sql` (e.g., `V1__create_clients_table.sql`).
4. Migrations are immutable — never edit an already-applied migration. Create a new one.
5. Always use snake_case for table and column names.

## Example

```sql
-- V1__create_clients_table.sql
CREATE TABLE clients (
    id          BIGSERIAL PRIMARY KEY,
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    phone       VARCHAR(20),
    email       VARCHAR(255),
    client_type VARCHAR(20) NOT NULL DEFAULT 'REGISTERED',
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
```
