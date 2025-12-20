-- Update user permissions and roles
-- This script ensures admin@example.com has ADMIN role and all permissions
-- and sets dkorolczuk86@gmail.com as EDITOR

-- 1. Ensure admin@example.com has ADMIN role and all permissions
UPDATE users 
SET role = 'ADMIN', updated_at = NOW()
WHERE email = 'admin@example.com';

-- Remove existing user permissions for admin@example.com (will be re-added)
DELETE FROM user_permissions 
WHERE user_id = (SELECT id FROM users WHERE email = 'admin@example.com');

-- Add all permissions to admin@example.com
INSERT INTO user_permissions (user_id, permission_name)
SELECT
    (SELECT id FROM users WHERE email = 'admin@example.com') as user_id,
    p.name as permission_name
FROM permissions p
WHERE p.name IN (SELECT permission_name FROM role_permissions WHERE role = 'ADMIN')
ON CONFLICT (user_id, permission_name) DO NOTHING;

-- 2. Create or update dkorolczuk86@gmail.com as EDITOR
-- First try to update if user exists
UPDATE users 
SET 
    role = 'EDITOR',
    updated_at = NOW(),
    username = COALESCE(NULLIF(username, ''), 'dkorolczuk86'),
    first_name = COALESCE(NULLIF(first_name, ''), 'Dariusz'),
    last_name = COALESCE(NULLIF(last_name, ''), 'Korolczuk')
WHERE email = 'dkorolczuk86@gmail.com';

-- If user doesn't exist, create them
INSERT INTO users (email, password_hash, username, first_name, last_name, role, is_active, created_at, updated_at)
SELECT 
    'dkorolczuk86@gmail.com',
    '$2y$10$GDzsiTwC.ONKI3RNJGSbN./Y3Lvmen4N8cvS3c/xIbbERAhLtL3Mm', -- default password: password
    'dkorolczuk86',
    'Dariusz',
    'Korolczuk',
    'EDITOR',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'dkorolczuk86@gmail.com');

-- Remove existing user permissions for dkorolczuk86@gmail.com (will use role permissions)
DELETE FROM user_permissions 
WHERE user_id = (SELECT id FROM users WHERE email = 'dkorolczuk86@gmail.com');

-- Note: EDITOR role permissions are already defined in role_permissions table
-- The user will automatically have EDITOR permissions through their role
