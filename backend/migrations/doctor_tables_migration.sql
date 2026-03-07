-- ─────────────────────────────────────────────────────────────────────────────
-- Doctors Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.doctors (
  id BIGSERIAL PRIMARY KEY,
  uid VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  specialty VARCHAR(255),
  clinic_name VARCHAR(255),
  clinic_address TEXT,
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctors_uid ON public.doctors(uid);
CREATE INDEX IF NOT EXISTS idx_doctors_name ON public.doctors(name);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can view their own data" ON public.doctors;
CREATE POLICY "Doctors can view their own data"
ON public.doctors FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Doctors can update their own data" ON public.doctors;
CREATE POLICY "Doctors can update their own data"
ON public.doctors FOR UPDATE
USING (auth.uid()::text = uid);

-- ─────────────────────────────────────────────────────────────────────────────
-- Doctor Availability Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.doctor_availability (
  id BIGSERIAL PRIMARY KEY,
  doctor_id BIGINT NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor_id ON public.doctor_availability(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_day ON public.doctor_availability(day_of_week);

ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active availability" ON public.doctor_availability;
CREATE POLICY "Anyone can view active availability"
ON public.doctor_availability FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Doctors can manage their availability" ON public.doctor_availability;
CREATE POLICY "Doctors can manage their availability"
ON public.doctor_availability FOR ALL
USING (doctor_id IN (SELECT id FROM public.doctors WHERE uid = auth.uid()::text));

-- ─────────────────────────────────────────────────────────────────────────────
-- Alter Appointments Table - Add doctor support
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS doctor_id BIGINT REFERENCES public.doctors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS doctor_note TEXT,
  ADD COLUMN IF NOT EXISTS patient_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS patient_email VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- Allow doctors to view their own appointments
DROP POLICY IF EXISTS "Doctors can view their appointments" ON public.appointments;
CREATE POLICY "Doctors can view their appointments"
ON public.appointments FOR SELECT
USING (
  doctor_id IN (SELECT id FROM public.doctors WHERE uid = auth.uid()::text)
  OR user_id = (SELECT id FROM public.users WHERE uid = auth.uid()::text)
);

-- Allow doctors to update their appointments
DROP POLICY IF EXISTS "Doctors can update their appointments" ON public.appointments;
CREATE POLICY "Doctors can update their appointments"
ON public.appointments FOR UPDATE
USING (
  doctor_id IN (SELECT id FROM public.doctors WHERE uid = auth.uid()::text)
);
