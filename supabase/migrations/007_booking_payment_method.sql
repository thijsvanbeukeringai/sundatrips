-- Payment method on bookings: cash (default) or stripe
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash'
    CHECK (payment_method IN ('cash', 'stripe'));
