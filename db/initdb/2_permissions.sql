
-- Predefined permissions
INSERT INTO permissions (name, description) VALUES
('users:create', 'Create users'),
('users:read', 'Read users'),
('users:update', 'Update users'),
('users:delete', 'Delete users'),
('music:create', 'Create music'),
('music:read', 'Read music'),
('music:update', 'Update music'),
('music:delete', 'Delete music'),
('reviews:create', 'Create reviews'),
('reviews:read', 'Read reviews'),
('reviews:update', 'Update reviews'),
('reviews:delete', 'Delete reviews'),
('artists:create', 'Create artists'),
('artists:read', 'Read artists'),
('artists:update', 'Update artists'),
('artists:delete', 'Delete artists'),
('genres:create', 'Create genres'),
('genres:read', 'Read genres'),
('genres:update', 'Update genres'),
('genres:delete', 'Delete genres');

-- Assign all permissions to ADMIN role
INSERT INTO role_permissions (role, permission_name)
SELECT 'ADMIN', name FROM permissions;

-- Assign content management permissions to EDITOR role
INSERT INTO role_permissions (role, permission_name)
SELECT 'EDITOR', name FROM permissions
WHERE name IN (
    'music:create', 'music:read', 'music:update', 'music:delete',
    'artists:create', 'artists:read', 'artists:update', 'artists:delete',
    'genres:create', 'genres:read', 'genres:update', 'genres:delete',
    'reviews:create', 'reviews:read', 'reviews:update', 'reviews:delete',
    'users:read'
);

-- Assign basic permissions to USER role
INSERT INTO role_permissions (role, permission_name)
SELECT 'USER', name FROM permissions
WHERE name IN (
    'music:read',
    'artists:read',
    'genres:read',
    'reviews:create',
    'reviews:read',
    'reviews:update',
    'reviews:delete'
);
