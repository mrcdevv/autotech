-- Role management (roles, permissions, employee role assignment, password resets)
-- was not covered by the V1 permission codes. Only ADMINISTRADOR receives it.
INSERT INTO permissions (code, description)
VALUES ('manage_roles', 'Gestionar roles y permisos de empleados')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'ADMINISTRADOR'
  AND p.code = 'manage_roles'
ON CONFLICT DO NOTHING;
