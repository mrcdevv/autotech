-- =============================================
-- Autotech - Add CANCELADO status to repair orders
-- =============================================

-- Drop the existing CHECK constraint on repair_orders.status (looked up by
-- definition so the migration does not depend on the generated name), then
-- recreate it including the new CANCELADO status.
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    WHERE con.conrelid = 'repair_orders'::regclass
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%status%INGRESO_VEHICULO%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE repair_orders DROP CONSTRAINT %I', constraint_name);
    END IF;
END $$;

ALTER TABLE repair_orders
    ADD CONSTRAINT repair_orders_status_check
    CHECK (status IN (
        'INGRESO_VEHICULO',
        'ESPERANDO_APROBACION_PRESUPUESTO',
        'ESPERANDO_REPUESTOS',
        'REPARACION',
        'PRUEBAS',
        'LISTO_PARA_ENTREGAR',
        'ENTREGADO',
        'CANCELADO'
    ));
