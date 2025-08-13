
-- Fix the password hashing migration to properly identify and convert plain text passwords
-- The issue is that our generated passwords are exactly 24 characters, not less than 60

-- Update existing plain text passwords to bcrypt hashes using proper identification
-- Use NOT LIKE '$2%' to identify non-bcrypt hashes (bcrypt hashes start with $2a$, $2b$, etc.)
UPDATE public.auth_ciphers 
SET password_hash = crypt(password_hash, gen_salt('bf', 12))
WHERE password_hash NOT LIKE '$2%';

-- Alternative approach: Also update any passwords that are exactly 24 characters (our generated format)
UPDATE public.auth_ciphers 
SET password_hash = crypt(password_hash, gen_salt('bf', 12))
WHERE length(password_hash) = 24 AND password_hash NOT LIKE '$2%';

-- Verify the fix by checking that all passwords are now bcrypt format
-- This is just for verification - all password_hash values should now start with $2
