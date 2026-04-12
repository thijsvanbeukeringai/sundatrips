-- Add pickup_time to bookings for transfers and activities
ALTER TABLE bookings ADD COLUMN pickup_time TEXT;
