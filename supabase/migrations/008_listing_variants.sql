-- Listing variants: room types, packages, ticket options, or transfer routes
CREATE TABLE IF NOT EXISTS listing_variants (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id    UUID          NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  owner_id       UUID          NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  name           TEXT          NOT NULL,
  description    TEXT,
  price_per_unit NUMERIC(10,2) NOT NULL,
  price_unit     TEXT          NOT NULL DEFAULT 'night',
  max_capacity   INTEGER,
  from_location  TEXT,          -- for transfers: pick-up point
  to_location    TEXT,          -- for transfers: drop-off point
  amenities      TEXT[]        NOT NULL DEFAULT '{}',
  is_active      BOOLEAN       NOT NULL DEFAULT true,
  sort_order     INTEGER       NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ   DEFAULT now()
);

ALTER TABLE listing_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners manage own variants" ON listing_variants
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "public read active variants" ON listing_variants
  FOR SELECT USING (is_active = true);
