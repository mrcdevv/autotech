-- Additional demo data to give the reports charts variety.
-- Additive seed: uses existing clients, vehicles, brands, employees and catalog.

-- Repair orders spread across the last ~9 months (2 per month) and across all brands.
INSERT INTO repair_orders
    (title, client_id, vehicle_id, reason, client_source, status, mechanic_notes, created_at, updated_at)
SELECT d.title, v.client_id, v.id, d.reason, d.client_source, d.status, d.notes, d.created_at, NOW()
FROM (VALUES
    ('OT-2001', 'AB123CD', 'Service completo y control de frenos.', 'Turno web', 'ENTREGADO', 'Aceite y filtros renovados. Pastillas al limite.', CURRENT_DATE - INTERVAL '250 days' + TIME '09:15'),
    ('OT-2002', 'AC456EF', 'Golpe en tren delantero en camino irregular.', 'Telefono', 'ENTREGADO', 'Se reemplazaron bujes y se alineo.', CURRENT_DATE - INTERVAL '235 days' + TIME '10:40'),
    ('OT-2003', 'AD789GH', 'Service preventivo de 40.000 km.', 'Mostrador', 'ENTREGADO', 'Service realizado sin observaciones.', CURRENT_DATE - INTERVAL '215 days' + TIME '08:30'),
    ('OT-2004', 'AE321IJ', 'Control de frenos y niveles de flota.', 'Cuenta corriente', 'ENTREGADO', 'Cambio de aceite y revision de frenos.', CURRENT_DATE - INTERVAL '200 days' + TIME '11:20'),
    ('OT-2005', 'AF654KL', 'Diagnostico por testigo de motor encendido.', 'Cuenta corriente', 'ENTREGADO', 'Escaneo realizado, sin fallas activas.', CURRENT_DATE - INTERVAL '185 days' + TIME '15:05'),
    ('OT-2006', 'AG987MN', 'Perdida de aceite por reten.', 'Walk-in', 'ENTREGADO', 'Reten de bancada reemplazado.', CURRENT_DATE - INTERVAL '170 days' + TIME '09:50'),
    ('OT-2007', 'AB123CD', 'Ruido al frenar y vibracion en el pedal.', 'Turno web', 'ENTREGADO', 'Discos y pastillas delanteras cambiados.', CURRENT_DATE - INTERVAL '155 days' + TIME '14:10'),
    ('OT-2008', 'AC456EF', 'Service de aceite y filtros.', 'Telefono', 'ENTREGADO', 'Service basico finalizado.', CURRENT_DATE - INTERVAL '140 days' + TIME '10:25'),
    ('OT-2009', 'AD789GH', 'Service preventivo y control general.', 'Mostrador', 'ENTREGADO', 'Aceite, filtro y revision de tren.', CURRENT_DATE - INTERVAL '125 days' + TIME '16:00'),
    ('OT-2010', 'AE321IJ', 'Cambio de pastillas delanteras de unidad de flota.', 'Cuenta corriente', 'LISTO_PARA_ENTREGAR', 'Trabajo finalizado, pendiente retiro.', CURRENT_DATE - INTERVAL '110 days' + TIME '09:05'),
    ('OT-2011', 'AF654KL', 'Diagnostico y alineacion de unidad de reparto.', 'Cuenta corriente', 'ENTREGADO', 'Alineacion 3D realizada.', CURRENT_DATE - INTERVAL '95 days' + TIME '11:45'),
    ('OT-2012', 'AG987MN', 'Service y ruido en tren delantero.', 'Turno web', 'ENTREGADO', 'Aceite, pastillas y control de suspension.', CURRENT_DATE - INTERVAL '80 days' + TIME '08:55'),
    ('OT-2013', 'AB123CD', 'Revision de tren delantero por vibracion.', 'Telefono', 'ENTREGADO', 'Rotulas y extremos revisados.', CURRENT_DATE - INTERVAL '65 days' + TIME '13:30'),
    ('OT-2014', 'AC456EF', 'Service completo previo a viaje.', 'Mostrador', 'ENTREGADO', 'Aceite, frenos y alineacion.', CURRENT_DATE - INTERVAL '50 days' + TIME '09:40'),
    ('OT-2015', 'AD789GH', 'Perdida de refrigerante y service.', 'Walk-in', 'REPARACION', 'En revision de mangueras y niveles.', CURRENT_DATE - INTERVAL '40 days' + TIME '10:15'),
    ('OT-2016', 'AE321IJ', 'Frenos y suspension de flota.', 'Cuenta corriente', 'ENTREGADO', 'Pastillas y tren delantero reparados.', CURRENT_DATE - INTERVAL '25 days' + TIME '08:45'),
    ('OT-2017', 'AF654KL', 'Alineacion y control de luces.', 'Cuenta corriente', 'LISTO_PARA_ENTREGAR', 'Alineacion realizada, en espera de retiro.', CURRENT_DATE - INTERVAL '12 days' + TIME '15:20'),
    ('OT-2018', 'AG987MN', 'Service y cambio de reten.', 'Turno web', 'ENTREGADO', 'Aceite y reten reemplazados.', CURRENT_DATE - INTERVAL '3 days' + TIME '09:30')
) AS d(title, plate, reason, client_source, status, notes, created_at)
JOIN vehicles v ON v.plate = d.plate;

-- Invoices for most of the new repair orders (some paid, some pending).
INSERT INTO invoices
    (client_id, vehicle_id, repair_order_id, discount_percentage, tax_percentage, total, status, created_at, updated_at)
SELECT ro.client_id, ro.vehicle_id, ro.id, 0, 21, NULL, d.status, ro.created_at, NOW()
FROM (VALUES
    ('OT-2001', 'PAGADA'),
    ('OT-2002', 'PAGADA'),
    ('OT-2004', 'PAGADA'),
    ('OT-2005', 'PAGADA'),
    ('OT-2006', 'PAGADA'),
    ('OT-2007', 'PAGADA'),
    ('OT-2008', 'PENDIENTE'),
    ('OT-2009', 'PAGADA'),
    ('OT-2010', 'PENDIENTE'),
    ('OT-2011', 'PAGADA'),
    ('OT-2012', 'PAGADA'),
    ('OT-2013', 'PENDIENTE'),
    ('OT-2014', 'PAGADA'),
    ('OT-2015', 'PENDIENTE'),
    ('OT-2016', 'PAGADA'),
    ('OT-2017', 'PENDIENTE'),
    ('OT-2018', 'PENDIENTE')
) AS d(title, status)
JOIN repair_orders ro ON ro.title = d.title;

-- Invoiced services (drives the "servicios realizados" and "ingresos por servicio" charts).
INSERT INTO invoice_services (invoice_id, service_name, price)
SELECT i.id, d.service_name, d.price
FROM (VALUES
    ('OT-2001', 'Cambio de aceite y filtro', 22000.00),
    ('OT-2001', 'Cambio de pastillas delanteras', 28000.00),
    ('OT-2002', 'Revision tren delantero', 26000.00),
    ('OT-2002', 'Alineacion y balanceo', 32000.00),
    ('OT-2004', 'Cambio de aceite y filtro', 22000.00),
    ('OT-2005', 'Diagnostico computarizado', 18500.00),
    ('OT-2005', 'Cambio de aceite y filtro', 22000.00),
    ('OT-2006', 'Cambio de reten', 42000.00),
    ('OT-2007', 'Cambio de pastillas delanteras', 28000.00),
    ('OT-2007', 'Alineacion y balanceo', 32000.00),
    ('OT-2008', 'Cambio de aceite y filtro', 22000.00),
    ('OT-2009', 'Cambio de aceite y filtro', 22000.00),
    ('OT-2009', 'Revision tren delantero', 26000.00),
    ('OT-2010', 'Cambio de pastillas delanteras', 28000.00),
    ('OT-2011', 'Diagnostico computarizado', 18500.00),
    ('OT-2011', 'Alineacion y balanceo', 32000.00),
    ('OT-2012', 'Cambio de aceite y filtro', 22000.00),
    ('OT-2012', 'Cambio de pastillas delanteras', 28000.00),
    ('OT-2013', 'Revision tren delantero', 26000.00),
    ('OT-2014', 'Cambio de aceite y filtro', 22000.00),
    ('OT-2014', 'Cambio de pastillas delanteras', 28000.00),
    ('OT-2014', 'Alineacion y balanceo', 32000.00),
    ('OT-2015', 'Cambio de aceite y filtro', 22000.00),
    ('OT-2016', 'Cambio de pastillas delanteras', 28000.00),
    ('OT-2016', 'Revision tren delantero', 26000.00),
    ('OT-2017', 'Alineacion y balanceo', 32000.00),
    ('OT-2018', 'Cambio de aceite y filtro', 22000.00),
    ('OT-2018', 'Cambio de reten', 42000.00)
) AS d(title, service_name, price)
JOIN repair_orders ro ON ro.title = d.title
JOIN invoices i ON i.repair_order_id = ro.id;

-- Keep invoice totals consistent with their service lines (plus 21% tax).
UPDATE invoices i
SET total = ROUND(
        (SELECT COALESCE(SUM(s.price), 0) FROM invoice_services s WHERE s.invoice_id = i.id) * 1.21,
        2),
    updated_at = NOW()
WHERE i.repair_order_id IN (SELECT id FROM repair_orders WHERE title LIKE 'OT-2%');

-- Inspections for a subset of the new repair orders (drives the "averías" chart).
INSERT INTO inspections (repair_order_id, template_id, created_at, updated_at)
SELECT ro.id, t.id, ro.created_at + INTERVAL '30 minutes', NOW()
FROM (VALUES
    ('OT-2001'), ('OT-2002'), ('OT-2004'), ('OT-2006'), ('OT-2007'), ('OT-2009'),
    ('OT-2011'), ('OT-2012'), ('OT-2013'), ('OT-2015'), ('OT-2016'), ('OT-2017')
) AS d(title)
JOIN repair_orders ro ON ro.title = d.title
JOIN inspection_templates t ON t.title = 'Inspeccion general vehicular';

-- Items reported as PROBLEMA or REVISAR.
INSERT INTO inspection_items (inspection_id, template_item_id, status, comment)
SELECT insp.id, ti.id, d.status, d.comment
FROM (VALUES
    ('OT-2001', 'Frenos delanteros y traseros', 'PROBLEMA', 'Pastillas delanteras al limite.'),
    ('OT-2001', 'Direccion y suspension', 'REVISAR', 'Juego leve en rotula.'),
    ('OT-2002', 'Direccion y suspension', 'PROBLEMA', 'Bujes de parrilla con juego.'),
    ('OT-2002', 'Correas auxiliares', 'REVISAR', 'Presenta microfisuras.'),
    ('OT-2004', 'Nivel de aceite', 'REVISAR', 'Nivel bajo, completar.'),
    ('OT-2004', 'Frenos delanteros y traseros', 'REVISAR', 'Pastillas con desgaste irregular.'),
    ('OT-2006', 'Refrigerante y mangueras', 'PROBLEMA', 'Manguera reseca con perdida.'),
    ('OT-2006', 'Correas auxiliares', 'REVISAR', 'Correa con desgaste.'),
    ('OT-2007', 'Frenos delanteros y traseros', 'PROBLEMA', 'Discos rayados.'),
    ('OT-2007', 'Cubiertas y presion', 'PROBLEMA', 'Cubierta delantera deformada.'),
    ('OT-2009', 'Cubiertas y presion', 'REVISAR', 'Presion baja en rueda trasera.'),
    ('OT-2009', 'Luces exteriores', 'PROBLEMA', 'Faro delantero sin funcionar.'),
    ('OT-2011', 'Testigos de tablero', 'PROBLEMA', 'Testigo de motor encendido.'),
    ('OT-2011', 'Nivel de aceite', 'REVISAR', 'Nivel en minimo.'),
    ('OT-2012', 'Direccion y suspension', 'PROBLEMA', 'Buje de parrilla vencido.'),
    ('OT-2012', 'Cubiertas y presion', 'REVISAR', 'Desgaste desparejo.'),
    ('OT-2013', 'Frenos delanteros y traseros', 'REVISAR', 'Pastillas al 30%.'),
    ('OT-2015', 'Refrigerante y mangueras', 'REVISAR', 'Manguera con sudoracion.'),
    ('OT-2015', 'Nivel de aceite', 'PROBLEMA', 'Consumo elevado de aceite.'),
    ('OT-2016', 'Frenos delanteros y traseros', 'PROBLEMA', 'Pastillas y discos gastados.'),
    ('OT-2016', 'Direccion y suspension', 'PROBLEMA', 'Extremos de direccion con juego.'),
    ('OT-2017', 'Luces exteriores', 'REVISAR', 'Luz de posicion intermitente.'),
    ('OT-2017', 'Testigos de tablero', 'REVISAR', 'Testigo de ABS intermitente.')
) AS d(title, item_name, status, comment)
JOIN repair_orders ro ON ro.title = d.title
JOIN inspections insp ON insp.repair_order_id = ro.id
JOIN inspection_template_items ti ON ti.name = d.item_name
JOIN inspection_template_groups g ON g.id = ti.group_id
WHERE g.template_id = insp.template_id;

-- Mark every remaining template item of the new inspections as OK.
INSERT INTO inspection_items (inspection_id, template_item_id, status, comment)
SELECT insp.id, ti.id, 'OK', 'Sin observaciones.'
FROM inspections insp
JOIN inspection_template_items ti ON ti.group_id IN (
    SELECT id FROM inspection_template_groups WHERE template_id = insp.template_id
)
WHERE insp.repair_order_id IN (SELECT id FROM repair_orders WHERE title LIKE 'OT-2%')
  AND NOT EXISTS (
      SELECT 1 FROM inspection_items ii
      WHERE ii.inspection_id = insp.id AND ii.template_item_id = ti.id
  );
