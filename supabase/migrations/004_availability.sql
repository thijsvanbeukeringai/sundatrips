-- ============================================================
-- Migration 004: Availability / calendar blocks per listing
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS availability (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID        NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  owner_id        UUID        NOT NULL REFERENCES profiles (id),
  date            DATE        NOT NULL,
  available_spots INT,          -- NULL = use property max_capacity; 0 = fully blocked
  is_blocked      BOOLEAN     NOT NULL DEFAULT FALSE,
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (property_id, date)
);

CREATE INDEX IF NOT EXISTS idx_availability_property ON availability (property_id, date);

ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Owners manage their own availability
CREATE POLICY "Owner: full control of own availability"
  ON availability FOR ALL USING (owner_id = auth.uid());

-- Guests & anonymous can read (needed for public booking / homepage)
CREATE POLICY "Public: read availability"
  ON availability FOR SELECT USING (TRUE);
