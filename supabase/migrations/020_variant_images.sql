-- Add images array to listing_variants for room/package photos
ALTER TABLE listing_variants
  ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}';
