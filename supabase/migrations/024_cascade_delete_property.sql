-- Add ON DELETE CASCADE to bookings.property_id so deleting a property
-- also removes its bookings (and via cascade, their pos_items/bill_payments).
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_property_id_fkey;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_property_id_fkey
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
