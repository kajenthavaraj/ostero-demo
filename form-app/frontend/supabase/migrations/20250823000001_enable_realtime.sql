-- Enable real-time updates for the applications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;

-- Ensure RLS policies allow real-time subscriptions
-- (The existing policy already allows public access which enables real-time)