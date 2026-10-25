-- 00007: add admission_date to student_fees
-- Run this in Supabase Dashboard → SQL Editor → New query → Run

ALTER TABLE student_fees
  ADD COLUMN IF NOT EXISTS admission_date DATE;

-- Optional: backfill nothing (leave null for existing students)
