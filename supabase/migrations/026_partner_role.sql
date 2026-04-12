-- 026_partner_role.sql
-- Adds 'partner' role for drivers and trip organizers

-- 1. Extend the role check constraint to include 'partner'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'admin', 'crew', 'partner'));

-- 2. Add partner_id to properties (links a listing to its operator/partner)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_properties_partner_id ON properties(partner_id);

-- 3. RLS: partners can read properties that are assigned to them
CREATE POLICY "partners_select_own_properties"
  ON properties FOR SELECT TO authenticated
  USING (partner_id = auth.uid());

-- 4. RLS: partners can read bookings for their assigned properties
CREATE POLICY "partners_select_bookings"
  ON bookings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = bookings.property_id
        AND p.partner_id = auth.uid()
    )
  );

-- 5. RLS: partners can insert bookings for their assigned properties
CREATE POLICY "partners_insert_bookings"
  ON bookings FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id
        AND p.partner_id = auth.uid()
    )
  );

-- 6. RLS: partners can read listing_variants for their properties
CREATE POLICY "partners_select_variants"
  ON listing_variants FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = listing_variants.property_id
        AND p.partner_id = auth.uid()
    )
  );
