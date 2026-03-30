-- Transfer-specific fields on properties
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS transfer_from    TEXT,
  ADD COLUMN IF NOT EXISTS transfer_to      TEXT,
  ADD COLUMN IF NOT EXISTS distance_km      NUMERIC(8,1),
  ADD COLUMN IF NOT EXISTS english_speaking BOOLEAN NOT NULL DEFAULT false;
