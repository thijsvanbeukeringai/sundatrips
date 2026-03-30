-- Change platform fee from 10% to 1%
-- The generated column cannot be altered directly; drop and recreate it.
ALTER TABLE bookings DROP COLUMN IF EXISTS platform_fee;
ALTER TABLE bookings DROP COLUMN IF EXISTS net_payout;

ALTER TABLE bookings
  ADD COLUMN platform_fee NUMERIC(10,2) GENERATED ALWAYS AS (ROUND((base_amount + extras_amount) * 0.01, 2)) STORED,
  ADD COLUMN net_payout   NUMERIC(10,2) GENERATED ALWAYS AS (ROUND((base_amount + extras_amount) * 0.99, 2)) STORED;
