-- Add hotel pickup option for activities/trips
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pickup_available boolean NOT NULL DEFAULT false;
