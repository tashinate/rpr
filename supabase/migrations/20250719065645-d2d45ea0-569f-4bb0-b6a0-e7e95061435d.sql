-- Fix function search_path security warning by setting search_path to empty
-- This prevents potential security issues with function search paths

CREATE OR REPLACE FUNCTION public.update_pattern_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';