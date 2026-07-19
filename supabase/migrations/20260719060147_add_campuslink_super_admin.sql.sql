/*
# Add campuslink226 super admin account

1. Purpose
- Create a new auth user with email campuslink226@gmail.com and the user-provided password.
- Mark email as confirmed so the user can sign in immediately.
- Insert the user into `super_admins` table.
- Insert a `super_admin` role row into `user_roles`.

2. Security
- No RLS policy changes. Existing policies on super_admins and user_roles remain unchanged.
- The new user is only added to super-admin-related tables, matching the existing super admin pattern.
*/

-- Insert the new auth user with a bcrypt-encrypted password.
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'campuslink226@gmail.com',
  crypt('@#campuslink226#@', gen_salt('bf', 10)),
  now(),
  now(),
  now(),
  '{}'::jsonb,
  '{}'::jsonb,
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'campuslink226@gmail.com'
);

-- Create the identities row required by Supabase auth for password login.
-- The email column is generated from identity_data, so we omit it.
INSERT INTO auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  created_at,
  updated_at,
  last_sign_in_at
)
SELECT
  gen_random_uuid(),
  u.id::text,
  u.id,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(),
  now(),
  now()
FROM auth.users u
WHERE u.email = 'campuslink226@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
);

-- Insert into super_admins table.
INSERT INTO super_admins (email, user_id)
SELECT 'campuslink226@gmail.com', u.id
FROM auth.users u
WHERE u.email = 'campuslink226@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM super_admins sa WHERE sa.email = 'campuslink226@gmail.com'
);

-- Insert super_admin role into user_roles.
INSERT INTO user_roles (user_id, role)
SELECT u.id, 'super_admin'::app_role
FROM auth.users u
WHERE u.email = 'campuslink226@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id
);
