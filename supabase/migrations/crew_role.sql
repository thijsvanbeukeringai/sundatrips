-- Migration: Crew role & permissions
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. Extend the role check constraint to include 'crew'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'admin', 'crew'));

-- 2. Add owner_id to profiles
--    For crew members: references the owner profile that manages them
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 3. Add crew_permissions as a text array
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS crew_permissions TEXT[] NOT NULL DEFAULT '{}';

-- Optional: index for faster lookups of crew per owner
CREATE INDEX IF NOT EXISTS profiles_owner_id_idx ON profiles(owner_id) WHERE owner_id IS NOT NULL;
