-- Enable pgcrypto extension for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the generate_qr_token function to use a different approach
CREATE OR REPLACE FUNCTION generate_qr_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate a random token using gen_random_uuid and encode it
  v_token := encode(gen_random_uuid()::text::bytea || gen_random_uuid()::text::bytea, 'base64');
  -- Remove any characters that might cause issues in URLs
  v_token := replace(replace(replace(v_token, '+', '-'), '/', '_'), '=', '');
  RETURN v_token;
END;
$$;