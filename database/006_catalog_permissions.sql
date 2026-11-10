-- Catalog permissions only. The catalog tables (vehicle_categories, services,
-- service_prices) already exist. Back up the database before applying.

INSERT INTO permissions (code, name, description) VALUES
 ('vehicle_categories.read', 'Read vehicle categories', 'List vehicle categories'),
 ('vehicle_categories.create', 'Create vehicle categories', 'Create vehicle categories'),
 ('vehicle_categories.update', 'Update vehicle categories', 'Update vehicle categories'),
 ('vehicle_categories.delete', 'Delete vehicle categories', 'Delete vehicle categories'),
 ('services.read', 'Read services', 'List services and addons'),
 ('services.create', 'Create services', 'Create services and addons'),
 ('services.update', 'Update services', 'Update services and addons'),
 ('services.delete', 'Delete services', 'Delete services and addons'),
 ('price_list.read', 'Read price list', 'View the price list and request price quotes'),
 ('price_list.update', 'Update price list', 'Create and update prices'),
 ('price_list.delete', 'Delete prices', 'Stop offering a service/category price')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.code = 'admin'
  AND (p.code LIKE 'vehicle_categories.%' OR p.code LIKE 'services.%' OR p.code LIKE 'price_list.%')
ON CONFLICT DO NOTHING;
