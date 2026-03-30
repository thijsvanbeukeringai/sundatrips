-- Per-slot availability: track available spots per time slot per date
CREATE TABLE IF NOT EXISTS slot_availability (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID    NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  owner_id        UUID    NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  time_slot_id    UUID    NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
  date            DATE    NOT NULL,
  available_spots INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(time_slot_id, date)
);

ALTER TABLE slot_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners manage own slot availability" ON slot_availability
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "public read slot availability" ON slot_availability
  FOR SELECT USING (true);
