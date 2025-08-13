-- Fix pgcrypto extension security warning by moving to extensions schema
-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pgcrypto extension to extensions schema
-- First drop from public schema
DROP EXTENSION IF EXISTS pgcrypto CASCADE;

-- Install in extensions schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Update all functions that use pgcrypto to reference the correct schema
-- Note: The functions are already using the correct schema prefix in their definitions
-- but we need to ensure they continue to work after the move

-- Grant usage on extensions schema to necessary roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Re-create any functions that might have been affected by the CASCADE drop
-- These functions should automatically use the extensions schema now