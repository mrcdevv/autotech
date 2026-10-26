-- Milestone timestamps used by the pickup and service reminders.
ALTER TABLE repair_orders
    ADD COLUMN ready_for_pickup_at TIMESTAMP,
    ADD COLUMN delivered_at        TIMESTAMP;

-- Best-effort backfill for existing orders: the last update is the closest known time of the status change
UPDATE repair_orders SET ready_for_pickup_at = updated_at WHERE status = 'LISTO_PARA_ENTREGAR';
UPDATE repair_orders SET delivered_at = updated_at WHERE status = 'ENTREGADO';
