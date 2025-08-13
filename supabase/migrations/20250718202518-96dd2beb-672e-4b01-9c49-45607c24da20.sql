-- Ensure pgcrypto extension is properly loaded and accessible
DROP EXTENSION IF EXISTS pgcrypto CASCADE;
CREATE EXTENSION pgcrypto SCHEMA public;

-- Test that crypt function works
SELECT crypt('test', gen_salt('bf', 12)) as test_bcrypt_hash;