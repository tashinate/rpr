-- Fix encryption/decryption functions for bot tokens with proper schema prefix
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
  
  -- Use AES encryption with the static key - with proper schema prefix
  RETURN encode(extensions.encrypt(token_text::bytea, encryption_key::bytea, 'aes'), 'base64');
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
  
  -- Use AES decryption with the static key - with proper schema prefix
  RETURN convert_from(extensions.decrypt(decode(encrypted_token, 'base64'), decryption_key::bytea, 'aes'), 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    -- If decryption fails, return the original value (for backward compatibility)
    RETURN encrypted_token;
END;
$function$;