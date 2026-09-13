-- Demo data for local presentations.
-- Password for seeded users: admin123

-- Keep configuration rows deterministic for demos.
UPDATE calendar_config
SET default_appointment_duration_minutes = 45,
    start_time = '08:00',
    end_time = '18:30',
    updated_at = NOW()
WHERE id = (SELECT MIN(id) FROM calendar_config);

UPDATE dashboard_config
SET stale_threshold_days = 5,
    updated_at = NOW()
WHERE id = (SELECT MIN(id) FROM dashboard_config);

-- Employees
INSERT INTO employees (
    first_name, last_name, dni, email, phone, address, province, city, country,
    marital_status, children_count, entry_date, status, password, must_change_password
) VALUES
    ('Usuario', 'Demo', '99000001', 'user@autotech.com', '3516000001', 'Av. Colon 1200', 'Cordoba', 'Cordoba', 'Argentina', 'SOLTERO', 0, CURRENT_DATE - INTERVAL '2 years', 'ACTIVO', '$2a$10$0uMavxZUB5vp92Bg5P7u.OmA7bnSvZXGgUClPCE72gE3lr7Eml0Ee', FALSE),
    ('Marcela', 'Rivas', '99000002', 'marcela.rivas@autotech.com', '3516000002', 'Bv. San Juan 450', 'Cordoba', 'Cordoba', 'Argentina', 'CASADO', 2, CURRENT_DATE - INTERVAL '5 years', 'ACTIVO', '$2a$10$0uMavxZUB5vp92Bg5P7u.OmA7bnSvZXGgUClPCE72gE3lr7Eml0Ee', FALSE),
    ('Tomas', 'Pereyra', '99000003', 'tomas.pereyra@autotech.com', '3516000003', 'Duarte Quiros 980', 'Cordoba', 'Cordoba', 'Argentina', 'SOLTERO', 0, CURRENT_DATE - INTERVAL '4 years', 'ACTIVO', '$2a$10$0uMavxZUB5vp92Bg5P7u.OmA7bnSvZXGgUClPCE72gE3lr7Eml0Ee', FALSE),
    ('Lucia', 'Gomez', '99000004', 'lucia.gomez@autotech.com', '3516000004', 'Chacabuco 310', 'Cordoba', 'Cordoba', 'Argentina', 'SOLTERO', 1, CURRENT_DATE - INTERVAL '3 years', 'ACTIVO', '$2a$10$0uMavxZUB5vp92Bg5P7u.OmA7bnSvZXGgUClPCE72gE3lr7Eml0Ee', FALSE),
    ('Diego', 'Soria', '99000005', 'diego.soria@autotech.com', '3516000005', 'Santa Rosa 2100', 'Cordoba', 'Cordoba', 'Argentina', 'CASADO', 3, CURRENT_DATE - INTERVAL '6 years', 'ACTIVO', '$2a$10$0uMavxZUB5vp92Bg5P7u.OmA7bnSvZXGgUClPCE72gE3lr7Eml0Ee', FALSE),
    ('Nicolas', 'Farias', '99000006', 'nicolas.farias@autotech.com', '3516000006', 'Rondeau 760', 'Cordoba', 'Cordoba', 'Argentina', 'SOLTERO', 0, CURRENT_DATE - INTERVAL '1 years', 'INACTIVO', '$2a$10$0uMavxZUB5vp92Bg5P7u.OmA7bnSvZXGgUClPCE72gE3lr7Eml0Ee', TRUE);

INSERT INTO employee_roles (employee_id, role_id)
SELECT e.id, r.id
FROM employees e
JOIN roles r ON r.name = 'ADMINISTRADOR'
WHERE e.email = 'user@autotech.com';

INSERT INTO employee_roles (employee_id, role_id)
SELECT e.id, r.id
FROM employees e
JOIN roles r ON r.name = 'JEFE_TALLER'
WHERE e.email IN ('marcela.rivas@autotech.com', 'diego.soria@autotech.com');

INSERT INTO employee_roles (employee_id, role_id)
SELECT e.id, r.id
FROM employees e
JOIN roles r ON r.name = 'MECANICO'
WHERE e.email IN ('tomas.pereyra@autotech.com', 'diego.soria@autotech.com', 'nicolas.farias@autotech.com');

INSERT INTO employee_roles (employee_id, role_id)
SELECT e.id, r.id
FROM employees e
JOIN roles r ON r.name = 'RECEPCIONISTA'
WHERE e.email = 'lucia.gomez@autotech.com';

-- Clients
INSERT INTO clients (
    first_name, last_name, dni, commercial_name, email, phone, address, province, country, client_type, entry_date
) VALUES
    ('Carolina', 'Mendez', '30111222', NULL, 'carolina.mendez@example.com', '3517010001', 'Obispo Trejo 125', 'Cordoba', 'Argentina', 'PERSONAL', CURRENT_DATE - INTERVAL '18 months'),
    ('Javier', 'Quiroga', '28777888', NULL, 'javier.quiroga@example.com', '3517010002', 'Av. Rafael Nunez 4200', 'Cordoba', 'Argentina', 'PERSONAL', CURRENT_DATE - INTERVAL '14 months'),
    ('Sofia', 'Aguirre', '32999888', NULL, 'sofia.aguirre@example.com', '3517010003', 'Ituzaingo 830', 'Cordoba', 'Argentina', 'PERSONAL', CURRENT_DATE - INTERVAL '10 months'),
    ('Logistica', 'Norte', '30700111223', 'Logistica Norte SRL', 'flota@logisticanorte.com', '3517010004', 'Camino Interfabricas 1550', 'Cordoba', 'Argentina', 'EMPRESA', CURRENT_DATE - INTERVAL '2 years'),
    ('Martin', 'Sin DNI', NULL, NULL, NULL, '3517010005', NULL, 'Cordoba', 'Argentina', 'TEMPORAL', CURRENT_DATE - INTERVAL '3 days');

-- Vehicles and catalog basics
INSERT INTO brands (name) VALUES
    ('Toyota'), ('Ford'), ('Volkswagen'), ('Chevrolet'), ('Fiat'), ('Renault');

INSERT INTO vehicles (
    client_id, plate, chassis_number, engine_number, brand_id, model, year, vehicle_type_id, observations
) VALUES
    ((SELECT id FROM clients WHERE dni = '30111222'), 'AB123CD', '9BRK19BT0N000001', '2ZR000001', (SELECT id FROM brands WHERE name = 'Toyota'), 'Corolla XEI', 2021, (SELECT id FROM vehicle_types WHERE name = 'AUTO'), 'Cliente solicita revisar ruido al frenar.'),
    ((SELECT id FROM clients WHERE dni = '28777888'), 'AC456EF', '8AFAR23N0M000002', 'PUMA00002', (SELECT id FROM brands WHERE name = 'Ford'), 'Ranger XLS', 2020, (SELECT id FROM vehicle_types WHERE name = 'CAMIONETA'), 'Uso rural, revisar tren delantero.'),
    ((SELECT id FROM clients WHERE dni = '32999888'), 'AD789GH', '9BWAB45U0P000003', 'MSI000003', (SELECT id FROM brands WHERE name = 'Volkswagen'), 'Polo Highline', 2022, (SELECT id FROM vehicle_types WHERE name = 'AUTO'), 'Service de 30.000 km.'),
    ((SELECT id FROM clients WHERE dni = '30700111223'), 'AE321IJ', '8AGCB48X0L000004', 'S10D00004', (SELECT id FROM brands WHERE name = 'Chevrolet'), 'S10 Cabina Doble', 2019, (SELECT id FROM vehicle_types WHERE name = 'CAMIONETA'), 'Unidad de flota 12.'),
    ((SELECT id FROM clients WHERE dni = '30700111223'), 'AF654KL', '9BD265000R000005', 'DUC000005', (SELECT id FROM brands WHERE name = 'Fiat'), 'Ducato Cargo', 2023, (SELECT id FROM vehicle_types WHERE name = 'UTILITARIO'), 'Unidad de reparto urbano.'),
    ((SELECT id FROM clients WHERE phone = '3517010005'), 'AG987MN', '8A1LZB000J000006', 'K4M000006', (SELECT id FROM brands WHERE name = 'Renault'), 'Kangoo Express', 2018, (SELECT id FROM vehicle_types WHERE name = 'UTILITARIO'), 'Ingreso walk-in por perdida de aceite.');

INSERT INTO tags (name, color) VALUES
    ('Urgente', '#D32F2F'),
    ('Garantia', '#1976D2'),
    ('Flota', '#455A64'),
    ('Esperando repuesto', '#F9A825'),
    ('Cliente espera', '#388E3C');

-- Appointments
INSERT INTO appointments (
    title, client_id, vehicle_id, purpose, start_time, end_time, vehicle_delivery_method,
    vehicle_arrived_at, vehicle_picked_up_at, client_arrived, status
) VALUES
    ('Diagnostico de frenos', (SELECT id FROM clients WHERE dni = '30111222'), (SELECT id FROM vehicles WHERE plate = 'AB123CD'), 'Ruido al frenar y vibracion leve en pedal.', CURRENT_DATE + TIME '09:00', CURRENT_DATE + TIME '10:00', 'PROPIO', CURRENT_DATE + TIME '08:55', NULL, TRUE, 'SCHEDULED'),
    ('Service programado 30.000 km', (SELECT id FROM clients WHERE dni = '32999888'), (SELECT id FROM vehicles WHERE plate = 'AD789GH'), 'Cambio de aceite, filtros y escaneo preventivo.', CURRENT_DATE + TIME '11:00', CURRENT_DATE + TIME '12:00', 'PROPIO', NULL, NULL, FALSE, 'SCHEDULED'),
    ('Reparacion tren delantero', (SELECT id FROM clients WHERE dni = '28777888'), (SELECT id FROM vehicles WHERE plate = 'AC456EF'), 'Inspeccion por ruidos en camino irregular.', CURRENT_DATE - INTERVAL '1 day' + TIME '14:00', CURRENT_DATE - INTERVAL '1 day' + TIME '16:00', 'GRUA', CURRENT_DATE - INTERVAL '1 day' + TIME '13:45', NULL, TRUE, 'COMPLETED'),
    ('Ingreso flota reparto', (SELECT id FROM clients WHERE dni = '30700111223'), (SELECT id FROM vehicles WHERE plate = 'AF654KL'), 'Control general previo a reparto semanal.', CURRENT_DATE + INTERVAL '1 day' + TIME '08:30', CURRENT_DATE + INTERVAL '1 day' + TIME '09:30', 'TERCERO', NULL, NULL, FALSE, 'SCHEDULED'),
    ('Turno cancelado cambio bateria', (SELECT id FROM clients WHERE phone = '3517010005'), (SELECT id FROM vehicles WHERE plate = 'AG987MN'), 'Cliente cancelo por reprogramacion.', CURRENT_DATE - INTERVAL '2 day' + TIME '10:30', CURRENT_DATE - INTERVAL '2 day' + TIME '11:00', 'PROPIO', NULL, NULL, FALSE, 'CANCELLED');

INSERT INTO appointment_employees (appointment_id, employee_id)
SELECT a.id, e.id
FROM appointments a
JOIN employees e ON e.email IN ('lucia.gomez@autotech.com', 'tomas.pereyra@autotech.com')
WHERE a.title IN ('Diagnostico de frenos', 'Service programado 30.000 km');

INSERT INTO appointment_employees (appointment_id, employee_id)
SELECT a.id, e.id
FROM appointments a
JOIN employees e ON e.email IN ('marcela.rivas@autotech.com', 'diego.soria@autotech.com')
WHERE a.title IN ('Reparacion tren delantero', 'Ingreso flota reparto');

INSERT INTO appointment_tags (appointment_id, tag_id)
SELECT a.id, t.id FROM appointments a JOIN tags t ON t.name = 'Cliente espera' WHERE a.title = 'Diagnostico de frenos';

INSERT INTO appointment_tags (appointment_id, tag_id)
SELECT a.id, t.id FROM appointments a JOIN tags t ON t.name = 'Flota' WHERE a.title = 'Ingreso flota reparto';

-- Repair orders
INSERT INTO repair_orders (
    title, client_id, vehicle_id, appointment_id, reason, client_source, status, mechanic_notes, created_at, updated_at
) VALUES
    ('OT-1001 Frenos Corolla', (SELECT id FROM clients WHERE dni = '30111222'), (SELECT id FROM vehicles WHERE plate = 'AB123CD'), (SELECT id FROM appointments WHERE title = 'Diagnostico de frenos'), 'Ruido metalico al frenar.', 'Turno web', 'REPARACION', 'Pastillas delanteras gastadas y discos con borde.', CURRENT_DATE - INTERVAL '2 days' + TIME '09:10', NOW()),
    ('OT-1002 Tren delantero Ranger', (SELECT id FROM clients WHERE dni = '28777888'), (SELECT id FROM vehicles WHERE plate = 'AC456EF'), (SELECT id FROM appointments WHERE title = 'Reparacion tren delantero'), 'Golpe seco en tren delantero.', 'Telefono', 'ESPERANDO_REPUESTOS', 'Bujes de parrilla con juego. Repuesto pedido.', CURRENT_DATE - INTERVAL '4 days' + TIME '14:20', NOW()),
    ('OT-1003 Service Polo', (SELECT id FROM clients WHERE dni = '32999888'), (SELECT id FROM vehicles WHERE plate = 'AD789GH'), NULL, 'Service preventivo 30.000 km.', 'Mostrador', 'INGRESO_VEHICULO', 'Pendiente de inspeccion inicial.', CURRENT_DATE + TIME '11:00', NOW()),
    ('OT-1004 Flota S10', (SELECT id FROM clients WHERE dni = '30700111223'), (SELECT id FROM vehicles WHERE plate = 'AE321IJ'), NULL, 'Control de frenos y suspension.', 'Cuenta corriente', 'LISTO_PARA_ENTREGAR', 'Trabajo finalizado, falta retiro.', CURRENT_DATE - INTERVAL '6 days' + TIME '08:40', NOW()),
    ('OT-1005 Ducato reparto', (SELECT id FROM clients WHERE dni = '30700111223'), (SELECT id FROM vehicles WHERE plate = 'AF654KL'), (SELECT id FROM appointments WHERE title = 'Ingreso flota reparto'), 'Control general de unidad de reparto.', 'Cuenta corriente', 'ESPERANDO_APROBACION_PRESUPUESTO', 'Se detecto perdida menor de refrigerante.', CURRENT_DATE - INTERVAL '1 day' + TIME '08:45', NOW()),
    ('OT-1006 Kangoo aceite', (SELECT id FROM clients WHERE phone = '3517010005'), (SELECT id FROM vehicles WHERE plate = 'AG987MN'), NULL, 'Perdida de aceite visible.', 'Walk-in', 'ENTREGADO', 'Cambio de reten realizado.', CURRENT_DATE - INTERVAL '12 days' + TIME '10:00', NOW());

INSERT INTO repair_order_employees (repair_order_id, employee_id)
SELECT ro.id, e.id
FROM repair_orders ro
JOIN employees e ON e.email IN ('marcela.rivas@autotech.com', 'tomas.pereyra@autotech.com')
WHERE ro.title IN ('OT-1001 Frenos Corolla', 'OT-1005 Ducato reparto');

INSERT INTO repair_order_employees (repair_order_id, employee_id)
SELECT ro.id, e.id
FROM repair_orders ro
JOIN employees e ON e.email IN ('diego.soria@autotech.com')
WHERE ro.title IN ('OT-1002 Tren delantero Ranger', 'OT-1004 Flota S10', 'OT-1006 Kangoo aceite');

INSERT INTO repair_order_tags (repair_order_id, tag_id)
SELECT ro.id, t.id FROM repair_orders ro JOIN tags t ON t.name = 'Urgente' WHERE ro.title = 'OT-1001 Frenos Corolla';

INSERT INTO repair_order_tags (repair_order_id, tag_id)
SELECT ro.id, t.id FROM repair_orders ro JOIN tags t ON t.name = 'Esperando repuesto' WHERE ro.title = 'OT-1002 Tren delantero Ranger';

INSERT INTO repair_order_tags (repair_order_id, tag_id)
SELECT ro.id, t.id FROM repair_orders ro JOIN tags t ON t.name = 'Flota' WHERE ro.title IN ('OT-1004 Flota S10', 'OT-1005 Ducato reparto');

-- Inspection templates and performed inspections
INSERT INTO inspection_templates (title) VALUES
    ('Inspeccion general vehicular'),
    ('Control rapido de entrega');

INSERT INTO inspection_template_groups (template_id, title, sort_order) VALUES
    ((SELECT id FROM inspection_templates WHERE title = 'Inspeccion general vehicular'), 'Seguridad', 0),
    ((SELECT id FROM inspection_templates WHERE title = 'Inspeccion general vehicular'), 'Motor y fluidos', 1),
    ((SELECT id FROM inspection_templates WHERE title = 'Inspeccion general vehicular'), 'Interior y luces', 2),
    ((SELECT id FROM inspection_templates WHERE title = 'Control rapido de entrega'), 'Entrega', 0);

INSERT INTO inspection_template_items (group_id, name, sort_order) VALUES
    ((SELECT id FROM inspection_template_groups WHERE title = 'Seguridad'), 'Frenos delanteros y traseros', 0),
    ((SELECT id FROM inspection_template_groups WHERE title = 'Seguridad'), 'Cubiertas y presion', 1),
    ((SELECT id FROM inspection_template_groups WHERE title = 'Seguridad'), 'Direccion y suspension', 2),
    ((SELECT id FROM inspection_template_groups WHERE title = 'Motor y fluidos'), 'Nivel de aceite', 0),
    ((SELECT id FROM inspection_template_groups WHERE title = 'Motor y fluidos'), 'Refrigerante y mangueras', 1),
    ((SELECT id FROM inspection_template_groups WHERE title = 'Motor y fluidos'), 'Correas auxiliares', 2),
    ((SELECT id FROM inspection_template_groups WHERE title = 'Interior y luces'), 'Luces exteriores', 0),
    ((SELECT id FROM inspection_template_groups WHERE title = 'Interior y luces'), 'Testigos de tablero', 1),
    ((SELECT id FROM inspection_template_groups WHERE title = 'Entrega'), 'Lavado de cortesia', 0),
    ((SELECT id FROM inspection_template_groups WHERE title = 'Entrega'), 'Documentacion y remito', 1);

INSERT INTO common_problems (description) VALUES
    ('Pastillas de freno con desgaste avanzado'),
    ('Discos de freno rayados'),
    ('Bujes de suspension con juego'),
    ('Perdida de aceite por reten'),
    ('Bateria con baja capacidad de arranque'),
    ('Manguera de refrigerante reseca');

INSERT INTO inspections (repair_order_id, template_id, created_at, updated_at) VALUES
    ((SELECT id FROM repair_orders WHERE title = 'OT-1001 Frenos Corolla'), (SELECT id FROM inspection_templates WHERE title = 'Inspeccion general vehicular'), CURRENT_DATE - INTERVAL '2 days' + TIME '09:30', NOW()),
    ((SELECT id FROM repair_orders WHERE title = 'OT-1002 Tren delantero Ranger'), (SELECT id FROM inspection_templates WHERE title = 'Inspeccion general vehicular'), CURRENT_DATE - INTERVAL '4 days' + TIME '14:45', NOW()),
    ((SELECT id FROM repair_orders WHERE title = 'OT-1004 Flota S10'), (SELECT id FROM inspection_templates WHERE title = 'Control rapido de entrega'), CURRENT_DATE - INTERVAL '5 days' + TIME '17:10', NOW());

INSERT INTO inspection_items (inspection_id, template_item_id, status, comment)
SELECT i.id, ti.id,
       CASE
           WHEN ti.name = 'Frenos delanteros y traseros' THEN 'PROBLEMA'
           WHEN ti.name = 'Cubiertas y presion' THEN 'REVISAR'
           ELSE 'OK'
       END,
       CASE
           WHEN ti.name = 'Frenos delanteros y traseros' THEN 'Pastillas delanteras al limite.'
           WHEN ti.name = 'Cubiertas y presion' THEN 'Delantera derecha con desgaste irregular.'
           ELSE 'Sin observaciones.'
       END
FROM inspections i
JOIN repair_orders ro ON ro.id = i.repair_order_id
JOIN inspection_template_items ti ON ti.group_id IN (
    SELECT id FROM inspection_template_groups WHERE template_id = i.template_id
)
WHERE ro.title = 'OT-1001 Frenos Corolla';

INSERT INTO inspection_items (inspection_id, template_item_id, status, comment)
SELECT i.id, ti.id,
       CASE
           WHEN ti.name = 'Direccion y suspension' THEN 'PROBLEMA'
           WHEN ti.name = 'Correas auxiliares' THEN 'REVISAR'
           ELSE 'OK'
       END,
       CASE
           WHEN ti.name = 'Direccion y suspension' THEN 'Juego en bujes de parrilla.'
           WHEN ti.name = 'Correas auxiliares' THEN 'Presenta microfisuras, sugerir cambio preventivo.'
           ELSE 'Sin observaciones.'
       END
FROM inspections i
JOIN repair_orders ro ON ro.id = i.repair_order_id
JOIN inspection_template_items ti ON ti.group_id IN (
    SELECT id FROM inspection_template_groups WHERE template_id = i.template_id
)
WHERE ro.title = 'OT-1002 Tren delantero Ranger';

INSERT INTO inspection_items (inspection_id, template_item_id, status, comment)
SELECT i.id, ti.id, 'OK', 'Control realizado.'
FROM inspections i
JOIN repair_orders ro ON ro.id = i.repair_order_id
JOIN inspection_template_items ti ON ti.group_id IN (
    SELECT id FROM inspection_template_groups WHERE template_id = i.template_id
)
WHERE ro.title = 'OT-1004 Flota S10';

-- Service, product and canned job catalogs
INSERT INTO services (name, description, price) VALUES
    ('Diagnostico computarizado', 'Escaneo completo con informe de codigos.', 18500.00),
    ('Cambio de aceite y filtro', 'Mano de obra para service de aceite.', 22000.00),
    ('Cambio de pastillas delanteras', 'Reemplazo de pastillas y limpieza de caliper.', 28000.00),
    ('Alineacion y balanceo', 'Alineacion 3D y balanceo de cuatro ruedas.', 32000.00),
    ('Revision tren delantero', 'Control de suspension, direccion y rotulas.', 26000.00),
    ('Cambio de reten', 'Reemplazo de reten con control de perdida.', 42000.00);

INSERT INTO products (name, description, quantity, unit_price) VALUES
    ('Aceite sintetico 5W30 x4L', 'Lubricante API SP para motores nafteros.', 18, 54500.00),
    ('Filtro de aceite Toyota', 'Filtro equivalente OEM Toyota.', 12, 9800.00),
    ('Pastillas delanteras Corolla', 'Juego de pastillas ceramicas.', 6, 73500.00),
    ('Bujes parrilla Ranger', 'Kit de bujes de parrilla delantera.', 4, 112000.00),
    ('Liquido refrigerante organico', 'Refrigerante OAT concentrado 1L.', 20, 8200.00),
    ('Reten bancada Kangoo', 'Reten compatible motor K4M.', 3, 26500.00);

INSERT INTO canned_jobs (title, description) VALUES
    ('Service basico naftero', 'Cambio de aceite, filtro y revision visual.'),
    ('Frenos delanteros Corolla', 'Kit de trabajo para reemplazo de pastillas delanteras.'),
    ('Tren delantero Ranger', 'Revision y cambio de bujes principales.');

INSERT INTO canned_job_services (canned_job_id, service_name, price) VALUES
    ((SELECT id FROM canned_jobs WHERE title = 'Service basico naftero'), 'Cambio de aceite y filtro', 22000.00),
    ((SELECT id FROM canned_jobs WHERE title = 'Service basico naftero'), 'Diagnostico computarizado', 18500.00),
    ((SELECT id FROM canned_jobs WHERE title = 'Frenos delanteros Corolla'), 'Cambio de pastillas delanteras', 28000.00),
    ((SELECT id FROM canned_jobs WHERE title = 'Tren delantero Ranger'), 'Revision tren delantero', 26000.00),
    ((SELECT id FROM canned_jobs WHERE title = 'Tren delantero Ranger'), 'Alineacion y balanceo', 32000.00);

INSERT INTO canned_job_products (canned_job_id, product_name, quantity, unit_price) VALUES
    ((SELECT id FROM canned_jobs WHERE title = 'Service basico naftero'), 'Aceite sintetico 5W30 x4L', 1, 54500.00),
    ((SELECT id FROM canned_jobs WHERE title = 'Service basico naftero'), 'Filtro de aceite Toyota', 1, 9800.00),
    ((SELECT id FROM canned_jobs WHERE title = 'Frenos delanteros Corolla'), 'Pastillas delanteras Corolla', 1, 73500.00),
    ((SELECT id FROM canned_jobs WHERE title = 'Tren delantero Ranger'), 'Bujes parrilla Ranger', 1, 112000.00);

-- Estimates
INSERT INTO estimates (client_id, vehicle_id, repair_order_id, status, discount_percentage, tax_percentage, total, created_at, updated_at) VALUES
    ((SELECT id FROM clients WHERE dni = '30111222'), (SELECT id FROM vehicles WHERE plate = 'AB123CD'), (SELECT id FROM repair_orders WHERE title = 'OT-1001 Frenos Corolla'), 'ACEPTADO', 0, 21, 122815.00, CURRENT_DATE - INTERVAL '2 days' + TIME '11:00', NOW()),
    ((SELECT id FROM clients WHERE dni = '28777888'), (SELECT id FROM vehicles WHERE plate = 'AC456EF'), (SELECT id FROM repair_orders WHERE title = 'OT-1002 Tren delantero Ranger'), 'PENDIENTE', 5, 21, 161469.00, CURRENT_DATE - INTERVAL '3 days' + TIME '09:00', NOW()),
    ((SELECT id FROM clients WHERE dni = '30700111223'), (SELECT id FROM vehicles WHERE plate = 'AF654KL'), (SELECT id FROM repair_orders WHERE title = 'OT-1005 Ducato reparto'), 'PENDIENTE', 0, 21, 41382.00, CURRENT_DATE - INTERVAL '1 day' + TIME '12:00', NOW()),
    ((SELECT id FROM clients WHERE dni = '32999888'), (SELECT id FROM vehicles WHERE plate = 'AD789GH'), NULL, 'RECHAZADO', 0, 21, 103213.00, CURRENT_DATE - INTERVAL '10 days' + TIME '15:00', NOW());

INSERT INTO estimate_services (estimate_id, service_name, price) VALUES
    ((SELECT id FROM estimates WHERE repair_order_id = (SELECT id FROM repair_orders WHERE title = 'OT-1001 Frenos Corolla')), 'Cambio de pastillas delanteras', 28000.00),
    ((SELECT id FROM estimates WHERE repair_order_id = (SELECT id FROM repair_orders WHERE title = 'OT-1002 Tren delantero Ranger')), 'Revision tren delantero', 26000.00),
    ((SELECT id FROM estimates WHERE repair_order_id = (SELECT id FROM repair_orders WHERE title = 'OT-1002 Tren delantero Ranger')), 'Alineacion y balanceo', 32000.00),
    ((SELECT id FROM estimates WHERE repair_order_id = (SELECT id FROM repair_orders WHERE title = 'OT-1005 Ducato reparto')), 'Diagnostico computarizado', 18500.00),
    ((SELECT id FROM estimates WHERE repair_order_id IS NULL), 'Cambio de aceite y filtro', 22000.00);

INSERT INTO estimate_products (estimate_id, product_name, quantity, unit_price, total_price) VALUES
    ((SELECT id FROM estimates WHERE repair_order_id = (SELECT id FROM repair_orders WHERE title = 'OT-1001 Frenos Corolla')), 'Pastillas delanteras Corolla', 1, 73500.00, 73500.00),
    ((SELECT id FROM estimates WHERE repair_order_id = (SELECT id FROM repair_orders WHERE title = 'OT-1002 Tren delantero Ranger')), 'Bujes parrilla Ranger', 1, 112000.00, 112000.00),
    ((SELECT id FROM estimates WHERE repair_order_id = (SELECT id FROM repair_orders WHERE title = 'OT-1005 Ducato reparto')), 'Liquido refrigerante organico', 2, 8200.00, 16400.00),
    ((SELECT id FROM estimates WHERE repair_order_id IS NULL), 'Aceite sintetico 5W30 x4L', 1, 54500.00, 54500.00),
    ((SELECT id FROM estimates WHERE repair_order_id IS NULL), 'Filtro de aceite Toyota', 1, 9800.00, 9800.00);

-- Invoices and payments
INSERT INTO invoices (client_id, vehicle_id, repair_order_id, estimate_id, discount_percentage, tax_percentage, total, status, created_at, updated_at) VALUES
    ((SELECT id FROM clients WHERE dni = '30111222'), (SELECT id FROM vehicles WHERE plate = 'AB123CD'), (SELECT id FROM repair_orders WHERE title = 'OT-1001 Frenos Corolla'), (SELECT id FROM estimates WHERE repair_order_id = (SELECT id FROM repair_orders WHERE title = 'OT-1001 Frenos Corolla')), 0, 21, 122815.00, 'PENDIENTE', CURRENT_DATE - INTERVAL '1 day' + TIME '16:00', NOW()),
    ((SELECT id FROM clients WHERE dni = '30700111223'), (SELECT id FROM vehicles WHERE plate = 'AE321IJ'), (SELECT id FROM repair_orders WHERE title = 'OT-1004 Flota S10'), NULL, 10, 21, 98010.00, 'PAGADA', CURRENT_DATE - INTERVAL '4 days' + TIME '17:30', NOW()),
    ((SELECT id FROM clients WHERE phone = '3517010005'), (SELECT id FROM vehicles WHERE plate = 'AG987MN'), (SELECT id FROM repair_orders WHERE title = 'OT-1006 Kangoo aceite'), NULL, 0, 21, 82885.00, 'PAGADA', CURRENT_DATE - INTERVAL '11 days' + TIME '18:00', NOW());

INSERT INTO invoice_services (invoice_id, service_name, price) VALUES
    ((SELECT id FROM invoices WHERE repair_order_id = (SELECT id FROM repair_orders WHERE title = 'OT-1001 Frenos Corolla')), 'Cambio de pastillas delanteras', 28000.00),
    ((SELECT id FROM invoices WHERE repair_order_id = (SELECT id FROM repair_orders WHERE title = 'OT-1004 Flota S10')), 'Revision tren delantero', 26000.00),
    ((SELECT id FROM invoices WHERE repair_order_id = (SELECT id FROM repair_orders WHERE title = 'OT-1004 Flota S10')), 'Alineacion y balanceo', 32000.00),
    ((SELECT id FROM invoices WHERE repair_order_id = (SELECT id FROM repair_orders WHERE title = 'OT-1006 Kangoo aceite')), 'Cambio de reten', 42000.00);

INSERT INTO invoice_products (invoice_id, product_name, quantity, unit_price, total_price) VALUES
    ((SELECT id FROM invoices WHERE repair_order_id = (SELECT id FROM repair_orders WHERE title = 'OT-1001 Frenos Corolla')), 'Pastillas delanteras Corolla', 1, 73500.00, 73500.00),
    ((SELECT id FROM invoices WHERE repair_order_id = (SELECT id FROM repair_orders WHERE title = 'OT-1004 Flota S10')), 'Bujes parrilla Ranger', 1, 112000.00, 112000.00),
    ((SELECT id FROM invoices WHERE repair_order_id = (SELECT id FROM repair_orders WHERE title = 'OT-1006 Kangoo aceite')), 'Reten bancada Kangoo', 1, 26500.00, 26500.00);

INSERT INTO bank_accounts (bank_id, alias, cbu_cvu) VALUES
    ((SELECT id FROM banks WHERE name = 'Mercadopago'), 'autotech.mp', '0000003100010000000001'),
    ((SELECT id FROM banks WHERE name = 'Banco de Cordoba'), 'AUTOTECH.CUENTA', '0200999800000000000002'),
    ((SELECT id FROM banks WHERE name = 'Banco Galicia'), 'AUTOTECH.GALICIA', '0070999900000000000003');

INSERT INTO payments (invoice_id, payment_date, amount, payer_name, payment_type, bank_account_id, registered_by_employee_id) VALUES
    ((SELECT id FROM invoices WHERE repair_order_id = (SELECT id FROM repair_orders WHERE title = 'OT-1004 Flota S10')), CURRENT_DATE - INTERVAL '3 days', 98010.00, 'Logistica Norte SRL', 'CUENTA_BANCARIA', (SELECT id FROM bank_accounts WHERE alias = 'AUTOTECH.CUENTA'), (SELECT id FROM employees WHERE email = 'lucia.gomez@autotech.com')),
    ((SELECT id FROM invoices WHERE repair_order_id = (SELECT id FROM repair_orders WHERE title = 'OT-1006 Kangoo aceite')), CURRENT_DATE - INTERVAL '10 days', 82885.00, 'Martin Sin DNI', 'EFECTIVO', NULL, (SELECT id FROM employees WHERE email = 'lucia.gomez@autotech.com')),
    ((SELECT id FROM invoices WHERE repair_order_id = (SELECT id FROM repair_orders WHERE title = 'OT-1001 Frenos Corolla')), CURRENT_DATE, 60000.00, 'Carolina Mendez', 'CUENTA_BANCARIA', (SELECT id FROM bank_accounts WHERE alias = 'autotech.mp'), (SELECT id FROM employees WHERE email = 'lucia.gomez@autotech.com'));

INSERT INTO payment_audit_log (payment_id, action, old_values, new_values, performed_by_employee_id, created_at)
SELECT p.id, 'CREATED', NULL,
       jsonb_build_object('amount', p.amount, 'paymentType', p.payment_type, 'payerName', p.payer_name),
       p.registered_by_employee_id,
       p.created_at
FROM payments p;
