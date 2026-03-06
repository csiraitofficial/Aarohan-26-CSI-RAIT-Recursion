-- Migration: Update medicine_reminders table with frequency, timezone, active status, and tracking fields

-- Add frequency column: 'daily', 'weekly', or 'custom'
ALTER TABLE public.medicine_reminders
  ADD COLUMN IF NOT EXISTS frequency VARCHAR(20) DEFAULT 'custom';

-- Add timezone column for per-user timezone support
ALTER TABLE public.medicine_reminders
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Kolkata';

-- Add is_active flag to enable/disable reminders without deleting
ALTER TABLE public.medicine_reminders
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Track when a notification was last sent (to prevent duplicate sends within the same minute)
ALTER TABLE public.medicine_reminders
  ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMP;

-- Create index on time column and is_active for faster scheduler queries
CREATE INDEX IF NOT EXISTS idx_medicine_reminders_time ON public.medicine_reminders(time);
CREATE INDEX IF NOT EXISTS idx_medicine_reminders_active ON public.medicine_reminders(is_active);

-- Backfill: set frequency='custom' for existing rows that have specific days selected
-- (existing reminders already use the 'days' array, which maps to 'custom' frequency)
UPDATE public.medicine_reminders
  SET frequency = 'custom'
  WHERE frequency IS NULL;
