-- Enable pgcrypto extension for bcrypt hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Now fix the password hashing migration that failed before
-- Convert all plain text passwords to bcrypt hashes
UPDATE public.auth_ciphers 
SET password_hash = crypt(password_hash, gen_salt('bf', 12))
WHERE password_hash NOT LIKE '$2%';

-- Verify pgcrypto is working by testing crypt function
SELECT crypt('test', gen_salt('bf', 12)) as test_hash;