
-- Predefined permissions
INSERT INTO permissions (name, description) VALUES
('users:create', 'Create users'),
('users:read', 'Read users'),
('users:update', 'Update users'),
('users:delete', 'Delete users'),
('animals:create', 'Create animals'),
('animals:read', 'Read animals'),
('animals:update', 'Update animals'),
('animals:delete', 'Delete animals'),
('tasks:create', 'Create tasks'),
('tasks:read', 'Read tasks'),
('tasks:update', 'Update tasks'),
('tasks:delete', 'Delete tasks'),
('bookings:create', 'Create bookings'),
('bookings:read', 'Read bookings'),
('bookings:update', 'Update bookings'),
('bookings:delete', 'Delete bookings');

-- Assign all permissions to ADMIN role
INSERT INTO role_permissions (role, permission_name)
SELECT 'ADMIN', name FROM permissions;

-- Assign limited permissions to VOLUNTEER role
INSERT INTO role_permissions (role, permission_name)
SELECT 'VOLUNTEER', name FROM permissions
WHERE name IN (
    'animals:read',
    'tasks:read',
    'bookings:create',
    'bookings:read',
    'bookings:update'
);
