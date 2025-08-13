-- Fix encryption/decryption functions for bot tokens
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
  
  -- Use AES encryption with the static key - explicit text casting
  RETURN encode(encrypt(token_text::bytea, encryption_key::bytea, 'aes'::text), 'base64');
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
  
  -- Use AES decryption with the static key - explicit text casting
  RETURN convert_from(decrypt(decode(encrypted_token, 'base64'), decryption_key::bytea, 'aes'::text), 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    -- If decryption fails, return the original value (for backward compatibility)
    RETURN encrypted_token;
END;
$function$;