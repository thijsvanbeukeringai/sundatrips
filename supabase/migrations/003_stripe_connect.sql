-- ============================================================
-- Migration 003: Stripe Connect fields on profiles
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id       TEXT,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_done  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled  BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe ON profiles (stripe_account_id)
  WHERE stripe_account_id IS NOT NULL;
