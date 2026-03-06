-- Run this in Supabase SQL Editor if profile fields are not being persisted.
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS blood_group TEXT,
ADD COLUMN IF NOT EXISTS allergies TEXT,
ADD COLUMN IF NOT EXISTS heart_rate NUMERIC,
ADD COLUMN IF NOT EXISTS blood_pressure TEXT,
ADD COLUMN IF NOT EXISTS height NUMERIC,
ADD COLUMN IF NOT EXISTS weight NUMERIC,
ADD COLUMN IF NOT EXISTS date_of_birth DATE;
