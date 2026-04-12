-- Add a unique, auto-incrementing booking number (human-readable)
CREATE SEQUENCE booking_number_seq START 1001;

ALTER TABLE bookings ADD COLUMN booking_number INT UNIQUE
  DEFAULT nextval('booking_number_seq');

-- Backfill existing bookings (ordered by creation date)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) + 1000 AS num
  FROM bookings
  WHERE booking_number IS NULL
)
UPDATE bookings SET booking_number = numbered.num
FROM numbered WHERE bookings.id = numbered.id;

-- Make NOT NULL after backfill
ALTER TABLE bookings ALTER COLUMN booking_number SET NOT NULL;
