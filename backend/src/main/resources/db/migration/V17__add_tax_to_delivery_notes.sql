-- Delivery notes carry IVA again: copied from the estimate (or the global default for standalone notes).
-- Existing delivery notes keep 0% so their stored totals stay unchanged.
ALTER TABLE delivery_notes ADD COLUMN tax_percentage NUMERIC(5,2) NOT NULL DEFAULT 0;
