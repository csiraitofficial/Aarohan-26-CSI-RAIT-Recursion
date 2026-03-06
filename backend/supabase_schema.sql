-- Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  uid VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  name VARCHAR(255),
  fcm_token TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Health Records Table
CREATE TABLE IF NOT EXISTS public.health_records (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(100),
  details JSONB,
  uploaded_file_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Medicine Reminders Table
CREATE TABLE IF NOT EXISTS public.medicine_reminders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  dosage VARCHAR(255),
  time VARCHAR(10), -- Format: "HH:mm" (e.g., "08:00")
  days TEXT[], -- Array of days: ['Monday', 'Wednesday', etc]
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Appointments Table (if needed)
CREATE TABLE IF NOT EXISTS public.appointments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  title VARCHAR(255),
  description TEXT,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_uid ON public.users(uid);
CREATE INDEX IF NOT EXISTS idx_health_records_user_id ON public.health_records(user_id);
CREATE INDEX IF NOT EXISTS idx_medicine_reminders_user_id ON public.medicine_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for Users Table
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data"
ON public.users FOR SELECT
USING (auth.uid()::text = uid);

DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
CREATE POLICY "Users can update their own data"
ON public.users FOR UPDATE
USING (auth.uid()::text = uid);

-- Create RLS Policies for Health Records Table
DROP POLICY IF EXISTS "Users can view their own health records" ON public.health_records;
CREATE POLICY "Users can view their own health records"
ON public.health_records FOR SELECT
USING (user_id = (SELECT id FROM public.users WHERE uid = auth.uid()::text));

DROP POLICY IF EXISTS "Users can insert their own health records" ON public.health_records;
CREATE POLICY "Users can insert their own health records"
ON public.health_records FOR INSERT
WITH CHECK (user_id = (SELECT id FROM public.users WHERE uid = auth.uid()::text));

DROP POLICY IF EXISTS "Users can update their own health records" ON public.health_records;
CREATE POLICY "Users can update their own health records"
ON public.health_records FOR UPDATE
USING (user_id = (SELECT id FROM public.users WHERE uid = auth.uid()::text));

DROP POLICY IF EXISTS "Users can delete their own health records" ON public.health_records;
CREATE POLICY "Users can delete their own health records"
ON public.health_records FOR DELETE
USING (user_id = (SELECT id FROM public.users WHERE uid = auth.uid()::text));

-- Create RLS Policies for Medicine Reminders Table
DROP POLICY IF EXISTS "Users can view their own medicine reminders" ON public.medicine_reminders;
CREATE POLICY "Users can view their own medicine reminders"
ON public.medicine_reminders FOR SELECT
USING (user_id = (SELECT id FROM public.users WHERE uid = auth.uid()::text));

DROP POLICY IF EXISTS "Users can insert their own medicine reminders" ON public.medicine_reminders;
CREATE POLICY "Users can insert their own medicine reminders"
ON public.medicine_reminders FOR INSERT
WITH CHECK (user_id = (SELECT id FROM public.users WHERE uid = auth.uid()::text));

DROP POLICY IF EXISTS "Users can update their own medicine reminders" ON public.medicine_reminders;
CREATE POLICY "Users can update their own medicine reminders"
ON public.medicine_reminders FOR UPDATE
USING (user_id = (SELECT id FROM public.users WHERE uid = auth.uid()::text));

DROP POLICY IF EXISTS "Users can delete their own medicine reminders" ON public.medicine_reminders;
CREATE POLICY "Users can delete their own medicine reminders"
ON public.medicine_reminders FOR DELETE
USING (user_id = (SELECT id FROM public.users WHERE uid = auth.uid()::text));

-- Create RLS Policies for Appointments Table
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
CREATE POLICY "Users can view their own appointments"
ON public.appointments FOR SELECT
USING (user_id = (SELECT id FROM public.users WHERE uid = auth.uid()::text));

DROP POLICY IF EXISTS "Users can insert their own appointments" ON public.appointments;
CREATE POLICY "Users can insert their own appointments"
ON public.appointments FOR INSERT
WITH CHECK (user_id = (SELECT id FROM public.users WHERE uid = auth.uid()::text));

DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
CREATE POLICY "Users can update their own appointments"
ON public.appointments FOR UPDATE
USING (user_id = (SELECT id FROM public.users WHERE uid = auth.uid()::text));

DROP POLICY IF EXISTS "Users can delete their own appointments" ON public.appointments;
CREATE POLICY "Users can delete their own appointments"
ON public.appointments FOR DELETE
USING (user_id = (SELECT id FROM public.users WHERE uid = auth.uid()::text));
