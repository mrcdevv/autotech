-- =============================================
-- Autotech - One invoice per repair order
-- =============================================

-- Partial unique index: a repair order can have at most one invoice.
-- It is partial (WHERE repair_order_id IS NOT NULL) because the column is
-- nullable and standalone invoices without a repair order must stay legal.
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_repair_order_id
    ON invoices (repair_order_id)
    WHERE repair_order_id IS NOT NULL;
