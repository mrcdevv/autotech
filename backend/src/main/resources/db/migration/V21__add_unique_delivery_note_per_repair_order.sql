-- =============================================
-- Autotech - One delivery note per repair order
-- =============================================

-- Partial unique index: a repair order can have at most one delivery note.
-- It is partial (WHERE repair_order_id IS NOT NULL) because the column is
-- nullable and standalone delivery notes without a repair order must stay legal.
CREATE UNIQUE INDEX IF NOT EXISTS uq_delivery_notes_repair_order_id
    ON delivery_notes (repair_order_id)
    WHERE repair_order_id IS NOT NULL;
