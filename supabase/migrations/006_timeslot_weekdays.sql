-- Add recurring weekday schedule to time_slots
-- 1 = Monday, 2 = Tuesday, ..., 7 = Sunday (ISO weekday)
ALTER TABLE time_slots
  ADD COLUMN IF NOT EXISTS days_of_week INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5,6,7}';
