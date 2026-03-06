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

-- Create Government Schemes Table
CREATE TABLE IF NOT EXISTS public.government_schemes (
  scheme_id VARCHAR(50) PRIMARY KEY,
  scheme_name VARCHAR(255) NOT NULL,
  category VARCHAR(50),
  coverage_amount DECIMAL(12,2),
  target_audience TEXT,
  state_applicable VARCHAR(100),
  benefits_covered JSONB,
  premium_amount DECIMAL(10,2),
  empanelled_hospitals INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Eligibility Criteria Table
CREATE TABLE IF NOT EXISTS public.eligibility_criteria (
  criteria_id SERIAL PRIMARY KEY,
  scheme_id VARCHAR(50) NOT NULL REFERENCES public.government_schemes(scheme_id) ON DELETE CASCADE,
  criteria_type VARCHAR(50) NOT NULL, -- e.g., 'income', 'occupation', 'state', 'age', 'has_bpl_card'
  operator VARCHAR(10) NOT NULL, -- '<=', '>=', '==', 'includes', 'boolean'
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gov_schemes_active ON public.government_schemes(is_active);
CREATE INDEX IF NOT EXISTS idx_eligibility_criteria_scheme ON public.eligibility_criteria(scheme_id);

-- Enable RLS for public readonly access
ALTER TABLE public.government_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eligibility_criteria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active government schemes" ON public.government_schemes;
CREATE POLICY "Anyone can read active government schemes"
ON public.government_schemes FOR SELECT
USING (is_active = TRUE);

DROP POLICY IF EXISTS "Anyone can read eligibility criteria" ON public.eligibility_criteria;
CREATE POLICY "Anyone can read eligibility criteria"
ON public.eligibility_criteria FOR SELECT
USING (TRUE);

-- ─────────────────────────────────────────────────────────────────────────────
-- Premium Predictions History Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.premium_predictions (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  age         INT,
  bmi         DECIMAL(5, 2),
  diabetes    BOOLEAN DEFAULT FALSE,
  chronic_disease BOOLEAN DEFAULT FALSE,
  predicted_premium DECIMAL(12, 2),
  confidence  DECIMAL(5, 4),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_premium_predictions_user_id
  ON public.premium_predictions(user_id);

CREATE INDEX IF NOT EXISTS idx_premium_predictions_created_at
  ON public.premium_predictions(created_at DESC);

ALTER TABLE public.premium_predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own predictions" ON public.premium_predictions;
CREATE POLICY "Users can insert their own predictions"
ON public.premium_predictions FOR INSERT
WITH CHECK (user_id = (SELECT id FROM public.users WHERE uid = auth.uid()::text));

DROP POLICY IF EXISTS "Users can view their own predictions" ON public.premium_predictions;
CREATE POLICY "Users can view their own predictions"
ON public.premium_predictions FOR SELECT
USING (user_id = (SELECT id FROM public.users WHERE uid = auth.uid()::text));

DROP POLICY IF EXISTS "Users can delete their own predictions" ON public.premium_predictions;
CREATE POLICY "Users can delete their own predictions"
ON public.premium_predictions FOR DELETE
USING (user_id = (SELECT id FROM public.users WHERE uid = auth.uid()::text));

-- ─────────────────────────────────────────────────────────────────────────────
-- User Assessments History for Government Plans
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_assessments (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  annual_income   DECIMAL(12, 2),
  occupation      VARCHAR(100),
  employment_type VARCHAR(100),
  family_size     INT,
  state           VARCHAR(100),
  has_bpl_card    BOOLEAN DEFAULT FALSE,
  age             INT,
  eligible_schemes JSONB DEFAULT '[]'::jsonb,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_assessments_user_id
  ON public.user_assessments(user_id);

ALTER TABLE public.user_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own assessments" ON public.user_assessments;
CREATE POLICY "Users can view their own assessments"
ON public.user_assessments FOR SELECT
USING (user_id = (SELECT id FROM public.users WHERE uid = auth.uid()::text));

DROP POLICY IF EXISTS "Users can insert their own assessments" ON public.user_assessments;
CREATE POLICY "Users can insert their own assessments"
ON public.user_assessments FOR INSERT
WITH CHECK (user_id = (SELECT id FROM public.users WHERE uid = auth.uid()::text));

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed Data: Government Schemes
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.government_schemes (scheme_id, scheme_name, category, coverage_amount, target_audience, state_applicable, benefits_covered, premium_amount, empanelled_hospitals)
VALUES 
('PMJAY', 'Ayushman Bharat (PM-JAY)', 'Central', 500000.00, 'Economically Weaker Sections (EWS), BPL Card holders', 'All India', '["Hospitalization", "Surgery", "Diagnostics", "Post-hospitalization"]'::jsonb, 0.00, 25000),
('CGHS', 'Central Government Health Scheme', 'Employee-based', 0.00, 'Central Govt Employees and Pensioners', 'All India', '["OPD", "IPD", "Specialist Consultation", "Medicines"]'::jsonb, 0.00, 1500),
('ESIC', 'Employees State Insurance Scheme', 'Employee-based', 0.00, 'Workers in factories/establishments with salary < 21k', 'All India', '["Full Medical Cover", "Sickness Benefit", "Maternity Benefit"]'::jsonb, 0.00, 1200)
ON CONFLICT (scheme_id) DO UPDATE SET
  scheme_name = EXCLUDED.scheme_name,
  category = EXCLUDED.category,
  coverage_amount = EXCLUDED.coverage_amount,
  target_audience = EXCLUDED.target_audience,
  benefits_covered = EXCLUDED.benefits_covered,
  premium_amount = EXCLUDED.premium_amount,
  empanelled_hospitals = EXCLUDED.empanelled_hospitals;

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed Data: Eligibility Criteria
-- ─────────────────────────────────────────────────────────────────────────────

-- Ayushman Bharat Rules
INSERT INTO public.eligibility_criteria (scheme_id, criteria_type, operator, value) VALUES 
('PMJAY', 'income', '<=', '250000'),
('PMJAY', 'has_bpl_card', '==', 'true');

-- ESIC Rules (Monthly salary < 21,000 => Annual < 252,000)
INSERT INTO public.eligibility_criteria (scheme_id, criteria_type, operator, value) VALUES 
('ESIC', 'income', '<=', '252000');
