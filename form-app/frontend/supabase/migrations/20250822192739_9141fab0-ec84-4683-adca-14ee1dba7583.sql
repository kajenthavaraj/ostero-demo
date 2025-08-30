-- Remove RLS policies that require authentication
DROP POLICY IF EXISTS "Users can view their own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can insert their own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can delete their own applications" ON public.applications;

-- Make user_id nullable since this is a public form
ALTER TABLE public.applications ALTER COLUMN user_id DROP NOT NULL;

-- Create new policy to allow public access
CREATE POLICY "Allow public access to applications" 
ON public.applications 
FOR ALL 
USING (true)
WITH CHECK (true);