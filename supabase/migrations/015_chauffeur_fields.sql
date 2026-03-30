-- Add chauffeur/driver information fields to listing_variants (for transfer type properties)
ALTER TABLE listing_variants
  ADD COLUMN IF NOT EXISTS vehicle_type  TEXT,
  ADD COLUMN IF NOT EXISTS driver_name   TEXT,
  ADD COLUMN IF NOT EXISTS driver_phone  TEXT;
