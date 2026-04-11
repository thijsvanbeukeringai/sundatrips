-- ─── Rooms ────────────────────────────────────────────────────────────────────
-- Physical rooms, linked to a property and optionally to a room type (variant).

CREATE TABLE IF NOT EXISTS rooms (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID        NOT NULL REFERENCES profiles(id)          ON DELETE CASCADE,
  property_id  UUID        NOT NULL REFERENCES properties(id)        ON DELETE CASCADE,
  variant_id   UUID                 REFERENCES listing_variants(id)  ON DELETE SET NULL,
  room_number  TEXT        NOT NULL,
  name         TEXT,
  floor        INTEGER,
  status       TEXT        NOT NULL DEFAULT 'available'
                           CHECK (status IN ('available','occupied','needs_cleaning','maintenance')),
  notes        TEXT,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms_owner_all" ON rooms
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS rooms_property_id_idx ON rooms(property_id);
CREATE INDEX IF NOT EXISTS rooms_owner_id_idx    ON rooms(owner_id);
CREATE INDEX IF NOT EXISTS rooms_variant_id_idx  ON rooms(variant_id);

-- ─── Attach room to booking ───────────────────────────────────────────────────

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS bookings_room_id_idx ON bookings(room_id);
