-- Per-owner control over which listing types they can create
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS allowed_listing_types TEXT[] NOT NULL DEFAULT '{stay,trip,activity,transfer}';
