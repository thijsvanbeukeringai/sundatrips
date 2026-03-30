-- ============================================================
-- SUNDA TRIPS — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── ENUM-like check constraints are used instead of ENUM types
-- so they can be altered without a full table rebuild.

-- ============================================================
-- 1. PROFILES
--    One row per auth.users entry. Owners + admins live here.
-- ============================================================
CREATE TABLE profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name    TEXT        NOT NULL,
  email        TEXT        NOT NULL,
  role         TEXT        NOT NULL DEFAULT 'owner'
                           CHECK (role IN ('owner', 'admin')),
  avatar_url   TEXT,
  phone        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automatically create a profile row when a new user is confirmed
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 2. PROPERTIES
--    A property can be a Stay, Trip, or Activity.
-- ============================================================
CREATE TABLE properties (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       UUID        NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  description    TEXT,
  type           TEXT        NOT NULL CHECK (type IN ('stay', 'trip', 'activity')),
  location       TEXT        NOT NULL,
  island         TEXT        NOT NULL CHECK (island IN ('Lombok', 'Bali', 'Gili Islands')),
  price_per_unit NUMERIC(10,2) NOT NULL,
  price_unit     TEXT        NOT NULL DEFAULT 'night'
                             CHECK (price_unit IN ('night', 'person', 'session', 'day')),
  max_capacity   INT,
  duration       TEXT,       -- e.g. "3 days / 2 nights" for trips
  images         TEXT[]      DEFAULT '{}',
  amenities      TEXT[]      DEFAULT '{}',
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_properties_owner    ON properties (owner_id);
CREATE INDEX idx_properties_type     ON properties (type);
CREATE INDEX idx_properties_island   ON properties (island);
CREATE INDEX idx_properties_active   ON properties (is_active);

-- ============================================================
-- 3. BOOKINGS
--    Platform fee (10%) and net payout are computed columns.
-- ============================================================
CREATE TABLE bookings (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id             UUID        NOT NULL REFERENCES properties (id),
  owner_id                UUID        NOT NULL REFERENCES profiles (id),
  -- Guest info (no auth required to book)
  guest_name              TEXT        NOT NULL,
  guest_email             TEXT        NOT NULL,
  guest_phone             TEXT,
  guest_nationality       TEXT,
  -- Stay details
  check_in                DATE        NOT NULL,
  check_out               DATE,       -- NULL for single-day trips / activities
  guests_count            INT         NOT NULL DEFAULT 1,
  -- Financials
  base_amount             NUMERIC(10,2) NOT NULL,
  extras_amount           NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount            NUMERIC(10,2) GENERATED ALWAYS AS (base_amount + extras_amount) STORED,
  platform_fee            NUMERIC(10,2) GENERATED ALWAYS AS (ROUND((base_amount + extras_amount) * 0.10, 2)) STORED,
  net_payout              NUMERIC(10,2) GENERATED ALWAYS AS (ROUND((base_amount + extras_amount) * 0.90, 2)) STORED,
  -- Status lifecycle
  status                  TEXT        NOT NULL DEFAULT 'confirmed'
                                      CHECK (status IN ('pending','confirmed','checked_in','completed','cancelled')),
  -- Stripe
  stripe_payment_intent_id TEXT,
  stripe_payment_status    TEXT,
  -- Meta
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_bookings_owner      ON bookings (owner_id);
CREATE INDEX idx_bookings_property   ON bookings (property_id);
CREATE INDEX idx_bookings_status     ON bookings (status);
CREATE INDEX idx_bookings_check_in   ON bookings (check_in);

-- Auto-sync extras_amount with sum of pos_items
CREATE OR REPLACE FUNCTION sync_booking_extras()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE bookings
  SET extras_amount = (
    SELECT COALESCE(SUM(unit_price * quantity), 0)
    FROM pos_items
    WHERE booking_id = COALESCE(NEW.booking_id, OLD.booking_id)
  )
  WHERE id = COALESCE(NEW.booking_id, OLD.booking_id);
  RETURN NULL;
END;
$$;

-- ============================================================
-- 4. POS CATALOG
--    Owner's saved menu of items (drinks, tours, extras).
-- ============================================================
CREATE TABLE pos_catalog (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID        NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  category      TEXT        NOT NULL DEFAULT 'other'
                            CHECK (category IN ('food','drinks','tours','transport','wellness','other')),
  default_price NUMERIC(10,2) NOT NULL,
  emoji         TEXT        DEFAULT '🛍️',
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order    INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pos_catalog_owner ON pos_catalog (owner_id);

-- ============================================================
-- 5. POS ITEMS
--    Individual line-items added to a booking in real time.
-- ============================================================
CREATE TABLE pos_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID        NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
  owner_id    UUID        NOT NULL REFERENCES profiles (id),
  catalog_id  UUID        REFERENCES pos_catalog (id),  -- optional link
  name        TEXT        NOT NULL,
  category    TEXT        NOT NULL DEFAULT 'other'
                          CHECK (category IN ('food','drinks','tours','transport','wellness','other')),
  unit_price  NUMERIC(10,2) NOT NULL,
  quantity    INT         NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_price NUMERIC(10,2) GENERATED ALWAYS AS (unit_price * quantity) STORED,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pos_items_booking ON pos_items (booking_id);
CREATE INDEX idx_pos_items_owner   ON pos_items (owner_id);

-- Wire up the trigger after pos_items table exists
CREATE TRIGGER pos_items_sync_booking_after_insert
  AFTER INSERT ON pos_items
  FOR EACH ROW EXECUTE FUNCTION sync_booking_extras();

CREATE TRIGGER pos_items_sync_booking_after_delete
  AFTER DELETE ON pos_items
  FOR EACH ROW EXECUTE FUNCTION sync_booking_extras();

CREATE TRIGGER pos_items_sync_booking_after_update
  AFTER UPDATE OF unit_price, quantity ON pos_items
  FOR EACH ROW EXECUTE FUNCTION sync_booking_extras();

-- ============================================================
-- 6. PAYOUTS
--    Recorded once per payout cycle (e.g. monthly).
-- ============================================================
CREATE TABLE payouts (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id           UUID        NOT NULL REFERENCES profiles (id),
  period_start       DATE        NOT NULL,
  period_end         DATE        NOT NULL,
  gross_amount       NUMERIC(10,2) NOT NULL,
  platform_fee       NUMERIC(10,2) NOT NULL,
  net_amount         NUMERIC(10,2) NOT NULL,
  status             TEXT        NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending','processing','paid')),
  stripe_transfer_id TEXT,
  paid_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payouts_owner  ON payouts (owner_id);
CREATE INDEX idx_payouts_status ON payouts (status);

-- ============================================================
-- 7. INVITES
--    Super admin creates these; owner clicks the email link.
-- ============================================================
CREATE TABLE invites (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE,
  invited_by    UUID        REFERENCES profiles (id),
  property_name TEXT,
  token         TEXT        NOT NULL UNIQUE
                            DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at   TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites     ENABLE ROW LEVEL SECURITY;

-- ── Helper: is the current user an admin? ─────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── profiles ──────────────────────────────────────────────────
CREATE POLICY "Own profile: read/write"
  ON profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Admin: read all profiles"
  ON profiles FOR SELECT USING (is_admin());

CREATE POLICY "Admin: update any profile"
  ON profiles FOR UPDATE USING (is_admin());

-- ── properties ────────────────────────────────────────────────
CREATE POLICY "Guests: read active properties"
  ON properties FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Owner: full control of own properties"
  ON properties FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Admin: full control of all properties"
  ON properties FOR ALL USING (is_admin());

-- ── bookings ──────────────────────────────────────────────────
CREATE POLICY "Owner: full control of own bookings"
  ON bookings FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Admin: full control of all bookings"
  ON bookings FOR ALL USING (is_admin());

-- ── pos_catalog ───────────────────────────────────────────────
CREATE POLICY "Owner: full control of own catalog"
  ON pos_catalog FOR ALL USING (owner_id = auth.uid());

-- ── pos_items ─────────────────────────────────────────────────
CREATE POLICY "Owner: full control of own POS items"
  ON pos_items FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Admin: read all POS items"
  ON pos_items FOR SELECT USING (is_admin());

-- ── payouts ───────────────────────────────────────────────────
CREATE POLICY "Owner: read own payouts"
  ON payouts FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Admin: full control of payouts"
  ON payouts FOR ALL USING (is_admin());

-- ── invites ───────────────────────────────────────────────────
CREATE POLICY "Admin: full control of invites"
  ON invites FOR ALL USING (is_admin());

-- ============================================================
-- REALTIME
--    Enable for tables the owner dashboard subscribes to.
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE pos_items;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

-- ============================================================
-- SEED: first admin account
--    Replace the email below, then run AFTER your first sign-up.
--    UPDATE profiles SET role = 'admin' WHERE email = 'you@example.com';
-- ============================================================
