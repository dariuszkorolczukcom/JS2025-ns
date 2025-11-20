insert into users (id, email, password_hash, first_name, last_name, phone, role, is_active, created_at, updated_at, last_login_at)
values (
  gen_random_uuid(),
  'admin@example.com',
  '$2y$10$GDzsiTwC.ONKI3RNJGSbN./Y3Lvmen4N8cvS3c/xIbbERAhLtL3Mm', --password: password
  'Admin',
  null,
  null,
  'ADMIN',
  true,
  now(),
  now(),
  now()
);
insert into user_permissions (user_id, permission_name)
select
  (select id from users where email = 'admin@example.com') as user_id,
  p.name as permission_name
from permissions p
where p.name in (select permission_name from role_permissions where role = 'ADMIN');