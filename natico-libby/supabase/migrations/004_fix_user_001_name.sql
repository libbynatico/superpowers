-- Fix user 001 display name from 'Libby Natico' to 'Matthew Herbert'
-- Also correct auth.users metadata for consistency

UPDATE public.profiles
SET display_name = 'Matthew Herbert'
WHERE user_code = '001';

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"display_name":"Matthew Herbert"}'::jsonb
WHERE email = 'mattherbert01@gmail.com';
