-- POS extras are fee-free. Platform fee (1%) applies only to base_amount (room rate).
-- net_payout = 99% of base_amount + 100% of extras_amount
ALTER TABLE bookings DROP COLUMN IF EXISTS platform_fee;
ALTER TABLE bookings DROP COLUMN IF EXISTS net_payout;

ALTER TABLE bookings
  ADD COLUMN platform_fee NUMERIC(10,2) GENERATED ALWAYS AS (ROUND(base_amount * 0.01, 2)) STORED,
  ADD COLUMN net_payout   NUMERIC(10,2) GENERATED ALWAYS AS (ROUND(base_amount * 0.99, 2) + extras_amount) STORED;
