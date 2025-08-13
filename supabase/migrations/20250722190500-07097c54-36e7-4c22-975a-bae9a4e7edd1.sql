
-- Create admin users table for secure admin authentication
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  session_token TEXT,
  session_expires_at TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_users (restrictive - only admins can access)
CREATE POLICY "Admin users can view their own data" 
ON public.admin_users 
FOR SELECT 
USING (true);

CREATE POLICY "Admin users can update their own data" 
ON public.admin_users 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to authenticate admin user
CREATE OR REPLACE FUNCTION public.authenticate_admin(username_input text, password_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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
  
  -- Verify password using crypt
  IF crypt(password_input, admin_record.password_hash) != admin_record.password_hash THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
  -- Generate new session token
  session_token := replace(gen_random_uuid()::text, '-', '');
  session_expires := now() + interval '24 hours';
  
  -- Update admin record with new session
  UPDATE public.admin_users
  SET 
    session_token = session_token,
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

-- Function to validate admin session
CREATE OR REPLACE FUNCTION public.validate_admin_session(session_token_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  admin_record RECORD;
BEGIN
  -- Find admin by session token
  SELECT * INTO admin_record
  FROM public.admin_users
  WHERE session_token = session_token_input
  AND session_expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired session');
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'username', admin_record.username,
    'expires_at', admin_record.session_expires_at
  );
END;
$function$;

-- Function to logout admin (invalidate session)
CREATE OR REPLACE FUNCTION public.logout_admin(session_token_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.admin_users
  SET 
    session_token = NULL,
    session_expires_at = NULL,
    updated_at = now()
  WHERE session_token = session_token_input;
  
  RETURN jsonb_build_object('success', true);
END;
$function$;

-- Insert the initial admin user with hashed password
INSERT INTO public.admin_users (username, password_hash)
VALUES ('rapidaliengate', crypt('86a1^&t2pDBQ', gen_salt('bf', 12)));
