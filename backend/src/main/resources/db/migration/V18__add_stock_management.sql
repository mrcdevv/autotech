-- Stock management: line items link to catalog products, products track reserved stock and a
-- minimum, and every stock change is recorded as a movement.

-- 1. Product stock fields
ALTER TABLE products
    ADD COLUMN min_stock         INTEGER,
    ADD COLUMN reserved_quantity INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN version           BIGINT  NOT NULL DEFAULT 0;

-- 2. Optional link from line items to the catalog product (free-text lines keep product_id NULL)
ALTER TABLE estimate_products
    ADD COLUMN product_id BIGINT REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE delivery_note_products
    ADD COLUMN product_id BIGINT REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE canned_job_products
    ADD COLUMN product_id BIGINT REFERENCES products(id) ON DELETE SET NULL;

CREATE INDEX idx_estimate_products_product_id ON estimate_products (product_id);
CREATE INDEX idx_delivery_note_products_product_id ON delivery_note_products (product_id);
CREATE INDEX idx_canned_job_products_product_id ON canned_job_products (product_id);

-- 3. Stock movement ledger
CREATE TABLE stock_movements (
    id                     BIGSERIAL PRIMARY KEY,
    product_id             BIGINT       NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type                   VARCHAR(20)  NOT NULL,
    quantity               INTEGER      NOT NULL,
    source_type            VARCHAR(20)  NOT NULL,
    source_id              BIGINT,
    reason                 VARCHAR(500),
    created_by_employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    created_at             TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_stock_movements_type
        CHECK (type IN ('INITIAL', 'ADJUSTMENT', 'RESERVE', 'RELEASE', 'CONSUME', 'RETURN')),
    CONSTRAINT chk_stock_movements_source_type
        CHECK (source_type IN ('MANUAL', 'REPAIR_ORDER', 'DELIVERY_NOTE'))
);

CREATE INDEX idx_stock_movements_product_created ON stock_movements (product_id, created_at DESC);
CREATE INDEX idx_stock_movements_source ON stock_movements (source_type, source_id);

-- 4. Existing on-hand quantities become the opening balance of the ledger
INSERT INTO stock_movements (product_id, type, quantity, source_type, reason)
SELECT id, 'INITIAL', quantity, 'MANUAL', 'Stock inicial'
FROM products
WHERE quantity <> 0;

-- 5. Canned jobs: link lines whose name matches exactly one catalog product (no stock effect).
-- Estimate and delivery note lines are not backfilled: linking them would retroactively reserve
-- or consume stock for documents created before the ledger existed.
UPDATE canned_job_products cjp
SET product_id = p.id
FROM products p
WHERE lower(trim(cjp.product_name)) = lower(trim(p.name))
  AND (SELECT count(*) FROM products p2 WHERE lower(trim(p2.name)) = lower(trim(p.name))) = 1;
