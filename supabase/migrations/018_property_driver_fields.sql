-- Add driver contact fields to properties (used for transfer listings)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS driver_name  TEXT,
  ADD COLUMN IF NOT EXISTS driver_phone TEXT;
