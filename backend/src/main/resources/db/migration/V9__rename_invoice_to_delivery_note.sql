ALTER TABLE invoices RENAME TO delivery_notes;
ALTER TABLE invoice_services RENAME TO delivery_note_services;
ALTER TABLE invoice_products RENAME TO delivery_note_products;

ALTER TABLE delivery_note_services RENAME COLUMN invoice_id TO delivery_note_id;
ALTER TABLE delivery_note_products RENAME COLUMN invoice_id TO delivery_note_id;
ALTER TABLE payments RENAME COLUMN invoice_id TO delivery_note_id;

ALTER INDEX idx_invoices_client_id RENAME TO idx_delivery_notes_client_id;
ALTER INDEX idx_invoices_repair_order_id RENAME TO idx_delivery_notes_repair_order_id;
ALTER INDEX idx_invoice_services_invoice_id RENAME TO idx_delivery_note_services_delivery_note_id;
ALTER INDEX idx_invoice_products_invoice_id RENAME TO idx_delivery_note_products_delivery_note_id;
ALTER INDEX idx_payments_invoice_id RENAME TO idx_payments_delivery_note_id;

UPDATE permissions SET code = 'create_delivery_note', description = 'Crear remitos' WHERE code = 'create_invoice';
UPDATE permissions SET code = 'read_delivery_note', description = 'Ver remitos' WHERE code = 'read_invoice';
UPDATE permissions SET code = 'update_delivery_note', description = 'Modificar remitos' WHERE code = 'update_invoice';
UPDATE permissions SET code = 'delete_delivery_note', description = 'Eliminar remitos' WHERE code = 'delete_invoice';
UPDATE roles SET description = 'Gestiona la atencion al cliente, altas de vehiculos, remitos y cobros.' WHERE name = 'RECEPCIONISTA';
