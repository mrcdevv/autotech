-- =============================================
-- Autotech - Initial Schema
-- =============================================

-- =============================================
-- 1. ROLES & PERMISSIONS
-- =============================================

CREATE TABLE roles (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE permissions (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE role_permissions (
    role_id       BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- =============================================
-- 2. EMPLOYEES
-- =============================================

CREATE TABLE employees (
    id             BIGSERIAL PRIMARY KEY,
    first_name     VARCHAR(100) NOT NULL,
    last_name      VARCHAR(100) NOT NULL,
    dni            VARCHAR(20) NOT NULL UNIQUE,
    email          VARCHAR(255),
    phone          VARCHAR(20) NOT NULL,
    address        VARCHAR(255),
    province       VARCHAR(100),
    country        VARCHAR(100),
    marital_status VARCHAR(20),
    children_count INTEGER NOT NULL DEFAULT 0,
    entry_date     DATE,
    status         VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
                   CHECK (status IN ('ACTIVO', 'INACTIVO')),
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE employee_roles (
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    role_id     BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (employee_id, role_id)
);

-- =============================================
-- 3. CLIENTS
-- =============================================

CREATE TABLE clients (
    id              BIGSERIAL PRIMARY KEY,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    dni             VARCHAR(20),
    commercial_name VARCHAR(150),
    email           VARCHAR(255),
    phone           VARCHAR(20) NOT NULL,
    address         VARCHAR(255),
    province        VARCHAR(100),
    country         VARCHAR(100),
    client_type     VARCHAR(20) NOT NULL
                    CHECK (client_type IN ('PERSONAL', 'EMPRESA', 'TEMPORAL')),
    entry_date      DATE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_clients_dni ON clients (dni) WHERE dni IS NOT NULL;

-- =============================================
-- 4. VEHICLES
-- =============================================

CREATE TABLE vehicle_types (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE brands (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE vehicles (
    id              BIGSERIAL PRIMARY KEY,
    client_id       BIGINT NOT NULL REFERENCES clients(id),
    plate           VARCHAR(20) NOT NULL UNIQUE,
    chassis_number  VARCHAR(50),
    engine_number   VARCHAR(50),
    brand_id        BIGINT REFERENCES brands(id),
    model           VARCHAR(100),
    year            INTEGER,
    vehicle_type_id BIGINT REFERENCES vehicle_types(id),
    observations    TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_client_id ON vehicles (client_id);

-- =============================================
-- 5. TAGS
-- =============================================

CREATE TABLE tags (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    color      VARCHAR(7),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- 6. APPOINTMENTS
-- =============================================

CREATE TABLE appointments (
    id                       BIGSERIAL PRIMARY KEY,
    title                    VARCHAR(255),
    client_id                BIGINT REFERENCES clients(id),
    vehicle_id               BIGINT REFERENCES vehicles(id),
    purpose                  TEXT,
    start_time               TIMESTAMP NOT NULL,
    end_time                 TIMESTAMP NOT NULL,
    vehicle_delivery_method  VARCHAR(20)
                             CHECK (vehicle_delivery_method IN ('PROPIO', 'GRUA', 'TERCERO')),
    vehicle_arrived_at       TIMESTAMP,
    vehicle_picked_up_at     TIMESTAMP,
    client_arrived           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at               TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_client_id ON appointments (client_id);
CREATE INDEX idx_appointments_start_time ON appointments (start_time);

CREATE TABLE appointment_employees (
    appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    employee_id    BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    PRIMARY KEY (appointment_id, employee_id)
);

CREATE TABLE appointment_tags (
    appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    tag_id         BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (appointment_id, tag_id)
);

-- =============================================
-- 7. REPAIR ORDERS
-- =============================================

CREATE TABLE repair_orders (
    id             BIGSERIAL PRIMARY KEY,
    title          VARCHAR(255),
    client_id      BIGINT NOT NULL REFERENCES clients(id),
    vehicle_id     BIGINT NOT NULL REFERENCES vehicles(id),
    appointment_id BIGINT REFERENCES appointments(id),
    reason         TEXT,
    client_source  VARCHAR(100),
    status         VARCHAR(50) NOT NULL DEFAULT 'INGRESO_VEHICULO'
                   CHECK (status IN (
                       'INGRESO_VEHICULO',
                       'ESPERANDO_APROBACION_PRESUPUESTO',
                       'ESPERANDO_REPUESTOS',
                       'REPARACION',
                       'PRUEBAS',
                       'LISTO_PARA_ENTREGAR',
                       'ENTREGADO'
                   )),
    mechanic_notes TEXT,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_repair_orders_client_id ON repair_orders (client_id);
CREATE INDEX idx_repair_orders_vehicle_id ON repair_orders (vehicle_id);
CREATE INDEX idx_repair_orders_status ON repair_orders (status);

CREATE TABLE repair_order_employees (
    repair_order_id BIGINT NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
    employee_id     BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    PRIMARY KEY (repair_order_id, employee_id)
);

CREATE TABLE repair_order_tags (
    repair_order_id BIGINT NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
    tag_id          BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (repair_order_id, tag_id)
);

-- =============================================
-- 8. INSPECTION TEMPLATES (Config)
-- =============================================

CREATE TABLE inspection_templates (
    id         BIGSERIAL PRIMARY KEY,
    title      VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE inspection_template_groups (
    id          BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL REFERENCES inspection_templates(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inspection_template_groups_template_id ON inspection_template_groups (template_id);

CREATE TABLE inspection_template_items (
    id         BIGSERIAL PRIMARY KEY,
    group_id   BIGINT NOT NULL REFERENCES inspection_template_groups(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inspection_template_items_group_id ON inspection_template_items (group_id);

CREATE TABLE common_problems (
    id          BIGSERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- 9. INSPECTIONS (attached to repair orders)
-- =============================================

CREATE TABLE inspections (
    id              BIGSERIAL PRIMARY KEY,
    repair_order_id BIGINT NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
    template_id     BIGINT NOT NULL REFERENCES inspection_templates(id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inspections_repair_order_id ON inspections (repair_order_id);

CREATE TABLE inspection_items (
    id               BIGSERIAL PRIMARY KEY,
    inspection_id    BIGINT NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    template_item_id BIGINT NOT NULL REFERENCES inspection_template_items(id),
    status           VARCHAR(20) NOT NULL
                     CHECK (status IN ('OK', 'REVISAR', 'PROBLEMA', 'NO_APLICA')),
    comment          TEXT,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inspection_items_inspection_id ON inspection_items (inspection_id);

-- =============================================
-- 10. SERVICES & PRODUCTS CATALOG
-- =============================================

CREATE TABLE services (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    price       NUMERIC(12,2),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    quantity    INTEGER NOT NULL DEFAULT 0,
    unit_price  NUMERIC(12,2),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- 11. CANNED JOBS
-- =============================================

CREATE TABLE canned_jobs (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE canned_job_services (
    id             BIGSERIAL PRIMARY KEY,
    canned_job_id  BIGINT NOT NULL REFERENCES canned_jobs(id) ON DELETE CASCADE,
    service_name   VARCHAR(255) NOT NULL,
    price          NUMERIC(12,2) NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_canned_job_services_canned_job_id ON canned_job_services (canned_job_id);

CREATE TABLE canned_job_products (
    id             BIGSERIAL PRIMARY KEY,
    canned_job_id  BIGINT NOT NULL REFERENCES canned_jobs(id) ON DELETE CASCADE,
    product_name   VARCHAR(255) NOT NULL,
    quantity       INTEGER NOT NULL,
    unit_price     NUMERIC(12,2) NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_canned_job_products_canned_job_id ON canned_job_products (canned_job_id);

-- =============================================
-- 12. ESTIMATES
-- =============================================

CREATE TABLE estimates (
    id                  BIGSERIAL PRIMARY KEY,
    client_id           BIGINT NOT NULL REFERENCES clients(id),
    vehicle_id          BIGINT NOT NULL REFERENCES vehicles(id),
    repair_order_id     BIGINT REFERENCES repair_orders(id),
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
                        CHECK (status IN ('PENDIENTE', 'ACEPTADO', 'RECHAZADO')),
    discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 0
                        CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    tax_percentage      NUMERIC(5,2) NOT NULL DEFAULT 0
                        CHECK (tax_percentage >= 0 AND tax_percentage <= 100),
    total               NUMERIC(12,2),
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_estimates_client_id ON estimates (client_id);
CREATE INDEX idx_estimates_repair_order_id ON estimates (repair_order_id);

CREATE TABLE estimate_services (
    id           BIGSERIAL PRIMARY KEY,
    estimate_id  BIGINT NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    service_name VARCHAR(255) NOT NULL,
    price        NUMERIC(12,2) NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_estimate_services_estimate_id ON estimate_services (estimate_id);

CREATE TABLE estimate_products (
    id            BIGSERIAL PRIMARY KEY,
    estimate_id   BIGINT NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    product_name  VARCHAR(255) NOT NULL,
    quantity      INTEGER NOT NULL,
    unit_price    NUMERIC(12,2) NOT NULL,
    total_price   NUMERIC(12,2) NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_estimate_products_estimate_id ON estimate_products (estimate_id);

-- =============================================
-- 13. INVOICES
-- =============================================

CREATE TABLE invoices (
    id                  BIGSERIAL PRIMARY KEY,
    client_id           BIGINT NOT NULL REFERENCES clients(id),
    vehicle_id          BIGINT REFERENCES vehicles(id),
    repair_order_id     BIGINT REFERENCES repair_orders(id),
    estimate_id         BIGINT REFERENCES estimates(id),
    discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 0
                        CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    tax_percentage      NUMERIC(5,2) NOT NULL DEFAULT 0
                        CHECK (tax_percentage >= 0 AND tax_percentage <= 100),
    total               NUMERIC(12,2),
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
                        CHECK (status IN ('PENDIENTE', 'PAGADA')),
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_client_id ON invoices (client_id);
CREATE INDEX idx_invoices_repair_order_id ON invoices (repair_order_id);

CREATE TABLE invoice_services (
    id           BIGSERIAL PRIMARY KEY,
    invoice_id   BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    service_name VARCHAR(255) NOT NULL,
    price        NUMERIC(12,2) NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_services_invoice_id ON invoice_services (invoice_id);

CREATE TABLE invoice_products (
    id           BIGSERIAL PRIMARY KEY,
    invoice_id   BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity     INTEGER NOT NULL,
    unit_price   NUMERIC(12,2) NOT NULL,
    total_price  NUMERIC(12,2) NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_products_invoice_id ON invoice_products (invoice_id);

-- =============================================
-- 14. PAYMENTS
-- =============================================

CREATE TABLE banks (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE bank_accounts (
    id         BIGSERIAL PRIMARY KEY,
    bank_id    BIGINT NOT NULL REFERENCES banks(id),
    alias      VARCHAR(100) NOT NULL,
    cbu_cvu    VARCHAR(30),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bank_accounts_bank_id ON bank_accounts (bank_id);

CREATE TABLE payments (
    id                       BIGSERIAL PRIMARY KEY,
    invoice_id               BIGINT NOT NULL REFERENCES invoices(id),
    payment_date             DATE NOT NULL,
    amount                   NUMERIC(12,2) NOT NULL,
    payer_name               VARCHAR(200),
    payment_type             VARCHAR(20) NOT NULL
                             CHECK (payment_type IN ('EFECTIVO', 'CUENTA_BANCARIA')),
    bank_account_id          BIGINT REFERENCES bank_accounts(id),
    registered_by_employee_id BIGINT REFERENCES employees(id),
    created_at               TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice_id ON payments (invoice_id);

CREATE TABLE payment_audit_log (
    id                      BIGSERIAL PRIMARY KEY,
    payment_id              BIGINT REFERENCES payments(id) ON DELETE SET NULL,
    action                  VARCHAR(20) NOT NULL
                            CHECK (action IN ('CREATED', 'MODIFIED', 'DELETED')),
    old_values              JSONB,
    new_values              JSONB,
    performed_by_employee_id BIGINT REFERENCES employees(id),
    created_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_audit_log_payment_id ON payment_audit_log (payment_id);

-- =============================================
-- 15. CALENDAR CONFIG
-- =============================================

CREATE TABLE calendar_config (
    id                                  BIGSERIAL PRIMARY KEY,
    default_appointment_duration_minutes INTEGER NOT NULL DEFAULT 60,
    start_time                          TIME,
    end_time                            TIME,
    created_at                          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at                          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- SEED DATA
-- =============================================

-- Roles
INSERT INTO roles (name, description) VALUES
    ('ADMINISTRADOR', 'Acceso total al sistema. Gestiona roles, reportes financieros, configuracion y empleados.'),
    ('JEFE_TALLER', 'Encargado de la operativa diaria. Gestiona citas, asigna ordenes y supervisa el flujo de vehiculos.'),
    ('MECANICO', 'Accede a ordenes asignadas, completa fichas tecnicas y marca el progreso de reparaciones.'),
    ('RECEPCIONISTA', 'Gestiona la atencion al cliente, altas de vehiculos, facturacion y cobros.');

-- Permissions
INSERT INTO permissions (code, description) VALUES
    -- Clients
    ('create_client', 'Crear clientes'),
    ('read_client', 'Ver clientes'),
    ('update_client', 'Modificar clientes'),
    ('delete_client', 'Eliminar clientes'),
    -- Employees
    ('create_employee', 'Crear empleados'),
    ('read_employee', 'Ver empleados'),
    ('update_employee', 'Modificar empleados'),
    ('delete_employee', 'Eliminar empleados'),
    -- Vehicles
    ('create_vehicle', 'Crear vehiculos'),
    ('read_vehicle', 'Ver vehiculos'),
    ('update_vehicle', 'Modificar vehiculos'),
    ('delete_vehicle', 'Eliminar vehiculos'),
    -- Repair Orders
    ('create_order', 'Crear ordenes de trabajo'),
    ('read_order', 'Ver ordenes de trabajo'),
    ('update_order', 'Modificar ordenes de trabajo'),
    ('delete_order', 'Eliminar ordenes de trabajo'),
    -- Inspections
    ('create_inspection', 'Crear inspecciones'),
    ('read_inspection', 'Ver inspecciones'),
    ('update_inspection', 'Modificar inspecciones'),
    ('delete_inspection', 'Eliminar inspecciones'),
    -- Estimates
    ('create_estimate', 'Crear presupuestos'),
    ('read_estimate', 'Ver presupuestos'),
    ('update_estimate', 'Modificar presupuestos'),
    ('delete_estimate', 'Eliminar presupuestos'),
    -- Invoices
    ('create_invoice', 'Crear facturas'),
    ('read_invoice', 'Ver facturas'),
    ('update_invoice', 'Modificar facturas'),
    ('delete_invoice', 'Eliminar facturas'),
    -- Payments
    ('create_payment', 'Registrar pagos'),
    ('read_payment', 'Ver pagos'),
    ('update_payment', 'Modificar pagos'),
    ('delete_payment', 'Eliminar pagos'),
    -- Appointments
    ('create_appointment', 'Crear citas'),
    ('read_appointment', 'Ver citas'),
    ('update_appointment', 'Modificar citas'),
    ('delete_appointment', 'Eliminar citas'),
    -- Reports
    ('view_reports', 'Ver reportes financieros'),
    -- Config
    ('manage_config', 'Gestionar configuracion del sistema'),
    -- Services & Products catalog
    ('manage_services', 'Gestionar catalogo de servicios'),
    ('manage_products', 'Gestionar catalogo de productos');

-- Role-Permission mappings

-- ADMINISTRADOR: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'ADMINISTRADOR';

-- JEFE_TALLER: everything except employee management, config, and reports
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'JEFE_TALLER'
  AND p.code NOT IN ('create_employee', 'update_employee', 'delete_employee', 'manage_config', 'view_reports');

-- MECANICO: read clients/vehicles, manage orders/inspections (read estimates/invoices)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'MECANICO'
  AND p.code IN (
      'read_client', 'read_vehicle', 'read_employee',
      'create_order', 'read_order', 'update_order',
      'create_inspection', 'read_inspection', 'update_inspection',
      'read_estimate', 'read_invoice',
      'read_appointment'
  );

-- RECEPCIONISTA: manage clients/vehicles/appointments, create orders, manage invoices/payments
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'RECEPCIONISTA'
  AND p.code IN (
      'create_client', 'read_client', 'update_client', 'delete_client',
      'create_vehicle', 'read_vehicle', 'update_vehicle', 'delete_vehicle',
      'read_employee',
      'create_order', 'read_order', 'update_order',
      'read_inspection',
      'create_estimate', 'read_estimate', 'update_estimate',
      'create_invoice', 'read_invoice', 'update_invoice',
      'create_payment', 'read_payment', 'update_payment', 'delete_payment',
      'create_appointment', 'read_appointment', 'update_appointment', 'delete_appointment'
  );

-- Vehicle types
INSERT INTO vehicle_types (name) VALUES
    ('AUTO'),
    ('CAMIONETA'),
    ('UTILITARIO');

-- Banks
INSERT INTO banks (name) VALUES
    ('Mercadopago'),
    ('Banco de Cordoba'),
    ('BBVA Frances'),
    ('Banco Galicia'),
    ('Banco Santander'),
    ('Banco Nacion'),
    ('Banco Provincia'),
    ('HSBC'),
    ('Banco Macro'),
    ('Brubank'),
    ('Uala');

-- Calendar config (single row with defaults)
INSERT INTO calendar_config (default_appointment_duration_minutes, start_time, end_time) VALUES
    (60, '08:00', '18:00');
