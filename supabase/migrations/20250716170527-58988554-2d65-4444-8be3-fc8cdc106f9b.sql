-- Enable real-time monitoring for license_keys table
-- Set REPLICA IDENTITY FULL to capture complete row data during changes
ALTER TABLE public.license_keys REPLICA IDENTITY FULL;

-- Add license_keys table to supabase_realtime publication to enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.license_keys;