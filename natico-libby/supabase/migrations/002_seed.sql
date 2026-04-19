-- Seed canonical users for NATICO / Libby Live
-- Passwords: user 000 → 'libby-system-000', user 001 → 'libby-natico-001'
-- Change these before any public deployment.

do $$
declare
  uid_000 uuid := '00000000-0000-0000-0000-000000000000';
  uid_001 uuid := '00000000-0000-0000-0000-000000000001';
begin
  -- Insert into auth.users (local Supabase dev only)
  insert into auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) values
  (
    uid_000,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'libbynatico@gmail.com',
    crypt('libby-system-000', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"user_code":"000","display_name":"Libby System","role":"admin"}',
    false, '', '', '', ''
  ),
  (
    uid_001,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'mattherbert01@gmail.com',
    crypt('libby-natico-001', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"user_code":"001","display_name":"Libby Natico","role":"user"}',
    false, '', '', '', ''
  )
  on conflict (id) do nothing;

  -- Profiles (trigger also handles this, but explicit seed for dev clarity)
  insert into public.profiles (id, user_code, display_name, role)
  values
    (uid_000, '000', 'Libby System', 'admin'),
    (uid_001, '001', 'Libby Natico', 'user')
  on conflict (id) do nothing;

  -- Default preferences
  insert into public.user_preferences (user_id, spoken_replies, theme)
  values
    (uid_000, false, 'light'),
    (uid_001, false, 'light')
  on conflict (user_id) do nothing;
end;
$$;
