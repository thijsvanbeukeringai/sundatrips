-- Add numeric duration to properties (used for time slot end-time calculation)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS duration_hours NUMERIC(4,1);

-- Time slots: repeating daily start times for trips & activities
CREATE TABLE IF NOT EXISTS time_slots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  owner_id     UUID NOT NULL REFERENCES profiles(id)   ON DELETE CASCADE,
  start_time   TEXT NOT NULL,          -- 'HH:MM', e.g. '09:00'
  is_active    BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(property_id, start_time)
);

ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their time_slots"
  ON time_slots FOR ALL
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Anyone can read active time_slots"
  ON time_slots FOR SELECT
  USING (is_active = true);
