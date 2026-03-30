-- ============================================================
-- Migration 002: Add tag column to properties
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE properties ADD COLUMN IF NOT EXISTS tag TEXT;
