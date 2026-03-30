-- Track whether the POS extras bill has been settled for a booking
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS extras_paid BOOLEAN NOT NULL DEFAULT false;
