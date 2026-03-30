-- Link bookings to a guest auth user and to the chosen variant
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS guest_user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS variant_id    UUID REFERENCES listing_variants(id);

-- Guests can view their own bookings (matched by email of logged-in user)
CREATE POLICY "guests view own bookings" ON bookings
  FOR SELECT USING (guest_email = auth.email());
