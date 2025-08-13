-- Enable pgcrypto extension for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create encryption/decryption functions for bot tokens
CREATE OR REPLACE FUNCTION public.encrypt_bot_token(token_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  encryption_key text := 'bot_token_encryption_key_2025'; -- Static key for consistency
BEGIN
  IF token_text IS NULL OR token_text = '' THEN
    RETURN token_text;
  END IF;
  
  -- Use AES encryption with the static key
  RETURN encode(encrypt(token_text::bytea, encryption_key::bytea, 'aes'), 'base64');
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrypt_bot_token(encrypted_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  decryption_key text := 'bot_token_encryption_key_2025'; -- Same static key
BEGIN
  IF encrypted_token IS NULL OR encrypted_token = '' THEN
    RETURN encrypted_token;
  END IF;
  
  -- Use AES decryption with the static key
  RETURN convert_from(decrypt(decode(encrypted_token, 'base64'), decryption_key::bytea, 'aes'), 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    -- If decryption fails, return the original value (for backward compatibility)
    RETURN encrypted_token;
END;
$function$;

-- Update existing Supabase functions to handle encrypted bot tokens
CREATE OR REPLACE FUNCTION public.upsert_user_telegram_config(session_token_input text, bot_token_input text, chat_id_input text, notification_settings_input jsonb DEFAULT '{"humanVisits": true, "botDetections": true}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  target_license_key_id UUID;
  encrypted_token text;
BEGIN
  -- Get the license key ID from the session token
  SELECT us.license_key_id INTO target_license_key_id
  FROM public.user_sessions us
  WHERE us.session_token = session_token_input
  AND us.expires_at > now()
  AND us.is_active = true;
  
  IF target_license_key_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Invalid session token');
  END IF;
  
  -- Encrypt the bot token
  encrypted_token := public.encrypt_bot_token(bot_token_input);
  
  -- Upsert the config using the encrypted bot token
  INSERT INTO public.user_telegram_configs (license_key_id, bot_token, chat_id, notification_settings)
  VALUES (target_license_key_id, encrypted_token, chat_id_input, notification_settings_input)
  ON CONFLICT (license_key_id)
  DO UPDATE SET
    bot_token = encrypted_token,
    chat_id = chat_id_input,
    notification_settings = notification_settings_input,
    updated_at = now();
  
  RETURN jsonb_build_object('success', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_telegram_config(session_token_input text)
 RETURNS TABLE(bot_token text, chat_id text, notification_settings jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  target_license_key_id UUID;
BEGIN
  SELECT us.license_key_id INTO target_license_key_id
  FROM public.user_sessions us
  WHERE us.session_token = session_token_input
  AND us.expires_at > now()
  AND us.is_active = true;
  
  IF target_license_key_id IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    public.decrypt_bot_token(utc.bot_token) as bot_token, 
    utc.chat_id, 
    utc.notification_settings
  FROM public.user_telegram_configs utc
  WHERE utc.license_key_id = target_license_key_id;
END;
$function$;

-- Encrypt existing bot tokens (if any exist)
UPDATE public.user_telegram_configs 
SET bot_token = public.encrypt_bot_token(bot_token)
WHERE bot_token IS NOT NULL 
AND bot_token != ''
-- Only encrypt if not already encrypted (simple check)
AND NOT (bot_token ~ '^[A-Za-z0-9+/]+=*$' AND length(bot_token) > 50);