-- Stores a snapshot of each settled POS bill per booking
CREATE TABLE IF NOT EXISTS bill_payments (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   UUID          NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  owner_id     UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  items        JSONB         NOT NULL DEFAULT '[]',  -- snapshot of pos_items at time of payment
  total_amount NUMERIC(10,2) NOT NULL,
  paid_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners manage own bill payments" ON bill_payments
  FOR ALL USING (owner_id = auth.uid());
