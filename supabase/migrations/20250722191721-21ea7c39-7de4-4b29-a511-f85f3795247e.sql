-- Fix the authenticate_admin function to use extensions schema for crypt
CREATE OR REPLACE FUNCTION public.authenticate_admin(username_input text, password_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $function$
DECLARE
  admin_record RECORD;
  session_token TEXT;
  session_expires TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Find admin user by username
  SELECT * INTO admin_record
  FROM public.admin_users
  WHERE username = username_input;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
  -- Verify password using crypt function from extensions schema
  IF extensions.crypt(password_input, admin_record.password_hash) != admin_record.password_hash THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
  -- Generate new session token
  session_token := replace(public.gen_random_uuid()::text, '-', '');
  session_expires := now() + interval '24 hours';
  
  -- Update admin record with new session
  UPDATE public.admin_users
  SET 
    session_token = authenticate_admin.session_token,
    session_expires_at = session_expires,
    last_login_at = now(),
    updated_at = now()
  WHERE id = admin_record.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'session_token', session_token,
    'expires_at', session_expires,
    'username', admin_record.username
  );
END;
$function$;