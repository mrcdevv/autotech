-- Manual stock adjustments (counts, purchases received, breakage) require their own permission.
INSERT INTO permissions (code, description)
VALUES ('manage_stock', 'Ajustar stock de productos')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name IN ('ADMINISTRADOR', 'JEFE_TALLER')
  AND p.code = 'manage_stock'
ON CONFLICT DO NOTHING;
