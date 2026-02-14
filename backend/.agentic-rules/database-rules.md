# Database Performance Rules

## Index Management

### When to Add an Index

1. **Foreign keys**: Always add an index on foreign key columns. PostgreSQL does NOT auto-create indexes on FK columns (only on PK). Without them, JOIN operations and cascading deletes become full table scans.
2. **Frequent WHERE clauses**: If a column appears regularly in `WHERE`, `ORDER BY`, or `GROUP BY` clauses across queries, it is a strong candidate for indexing.
3. **Unique constraints**: Columns with a uniqueness requirement (e.g., email, license plate) should use a unique index (`CREATE UNIQUE INDEX`), which also enforces the constraint at the DB level.
4. **Composite queries**: When queries filter on multiple columns together (e.g., `WHERE client_id = ? AND status = ?`), consider a composite index. Column order matters — place the most selective column first.

### When NOT to Add an Index

1. **Small tables**: Tables with fewer than a few hundred rows rarely benefit from indexes. A sequential scan is often faster.
2. **Low-cardinality columns**: Columns with very few distinct values (e.g., a boolean `active` flag or a status with 3 possible values) usually don't benefit from a standalone index. Exception: if combined with a high-cardinality column in a composite index.
3. **Write-heavy tables with few reads**: Every index slows down `INSERT`, `UPDATE`, and `DELETE` operations because the index must be maintained. If a table is write-heavy and rarely queried by that column, skip the index.
4. **Columns that are rarely queried**: Don't index "just in case." Indexes consume disk space and memory. Add them when there is a real query pattern that needs them.

### Cost-Benefit Analysis

Before adding any index, consider:

- **Read vs. write ratio**: Indexes speed up reads but slow down writes. For tables with heavy inserts/updates, be selective.
- **Table size**: The larger the table, the more impactful a well-chosen index becomes. For small tables the overhead is not justified.
- **Query patterns**: Index columns that actually appear in your application's queries. Analyze repository methods and custom `@Query` annotations to determine what the real access patterns are.
- **Index maintenance cost**: Each additional index increases storage, slows down writes, and adds to vacuum/maintenance time. Keep only the indexes you need.

### Implementation in Migrations

Indexes must be created via Flyway migrations, never through JPA annotations like `@Index` on `@Table` (those are hints, not reliable). Always use explicit SQL:

```sql
-- Single column index
CREATE INDEX idx_vehicles_client_id ON vehicles (client_id);

-- Composite index (most selective column first)
CREATE INDEX idx_repair_orders_client_status ON repair_orders (client_id, status);

-- Unique index
CREATE UNIQUE INDEX idx_clients_email ON clients (email);

-- Partial index (index only rows matching a condition — useful for filtering on status)
CREATE INDEX idx_repair_orders_open ON repair_orders (created_at) WHERE status = 'OPEN';
```

### Naming Convention

- Single column: `idx_{table}_{column}`
- Composite: `idx_{table}_{col1}_{col2}`
- Unique: `idx_{table}_{column}` (the `CREATE UNIQUE INDEX` already conveys uniqueness)

## General Query Performance

1. **Avoid N+1 queries**: Use `@EntityGraph` or `JOIN FETCH` in JPQL to load related entities in a single query when you know they will be accessed. See `repository-rules.md`.
2. **Paginate large result sets**: Always use `Pageable` for list endpoints that could return many rows. Never load unbounded lists into memory.
3. **Use projections for read-only queries**: When you only need a few columns, consider using DTO projections (`SELECT new com.autotech...Dto(...)`) instead of loading full entities.
4. **Review execution plans**: When in doubt about a query's performance, use `EXPLAIN ANALYZE` in PostgreSQL to verify that indexes are being used and there are no unexpected sequential scans on large tables.

## Review Checklist

When creating or modifying a table or a query, ask:

1. Are all foreign key columns indexed?
2. Are there queries filtering on non-indexed columns against large tables?
3. Would a composite index serve the common query pattern better than multiple single-column indexes?
4. Is the new index justified by actual query patterns, or is it speculative?
5. For existing indexes: are there any unused indexes that should be removed to reduce write overhead?
