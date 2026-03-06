-- Fix RLS policies for users table to allow service role inserts and registrations
-- This should be run on Supabase as an admin to allow authentication

-- Allow service role (backend) to insert new users during registration
DROP POLICY IF EXISTS "Allow service role to insert users" ON public.users;
CREATE POLICY "Allow service role to insert users"
ON public.users FOR INSERT
WITH CHECK (true);

-- Allow service role to update users
DROP POLICY IF EXISTS "Allow service role to update users" ON public.users;
CREATE POLICY "Allow service role to update users"
ON public.users FOR UPDATE
USING (true);

-- Users can view their own data (existing)
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data"
ON public.users FOR SELECT
USING (auth.uid()::text = uid);

-- Users can update their own data (existing)
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
CREATE POLICY "Users can update their own data"
ON public.users FOR UPDATE
USING (auth.uid()::text = uid);
