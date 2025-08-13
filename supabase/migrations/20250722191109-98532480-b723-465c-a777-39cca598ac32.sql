
-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Test that the crypt function works properly
SELECT crypt('test_password', gen_salt('bf', 12)) as test_hash;

-- Verify our admin user exists and update if needed
UPDATE public.admin_users 
SET password_hash = crypt('86a1^&t2pDBQ', gen_salt('bf', 12))
WHERE username = 'rapidaliengate' 
AND password_hash NOT LIKE '$2%';
