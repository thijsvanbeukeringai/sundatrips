-- ============================================================
-- VENUES
-- A venue is a business/property group (e.g. "Full Moon Tetebatu")
-- that contains multiple bookable units (rooms, activities, transfers).
-- ============================================================

CREATE TABLE venues (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  description     TEXT,
  location        TEXT        NOT NULL,
  island          TEXT        NOT NULL CHECK (island IN ('Lombok', 'Bali', 'Gili Islands')),
  images          TEXT[]      NOT NULL DEFAULT '{}',
  amenities       TEXT[]      NOT NULL DEFAULT '{}',
  allowed_types   TEXT[]      NOT NULL DEFAULT '{"stay","trip","activity","transfer"}',
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER venues_updated_at
  BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners manage own venues" ON venues
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "admins manage all venues" ON venues
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "public can view active venues" ON venues
  FOR SELECT USING (is_active = true);

-- Add venue_id to properties (nullable for backward compat)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES venues(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS properties_venue_id_idx ON properties(venue_id);
