-- Drop the ambiguous toggle_license_status function with (uuid, text) signature
-- Keep only the function with (uuid, license_status) signature for proper enum handling

DROP FUNCTION IF EXISTS public.toggle_license_status(uuid, text);

-- The function with (uuid, license_status) signature should remain
-- This will eliminate the ambiguity and allow proper enum casting from frontend strings