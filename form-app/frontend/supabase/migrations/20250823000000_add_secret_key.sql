-- Add secret_key field to applications table
-- This will store a unique secret key for each application for secure access

ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS secret_key TEXT UNIQUE;

-- Create index for faster lookups by secret key
CREATE INDEX IF NOT EXISTS idx_applications_secret_key ON public.applications(secret_key);

-- Add comment for documentation
COMMENT ON COLUMN public.applications.secret_key IS 'Unique secret key for secure application access';