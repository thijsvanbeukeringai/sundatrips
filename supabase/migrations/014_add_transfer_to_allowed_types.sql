-- Ensure all existing profiles have 'transfer' in their allowed_listing_types.
-- Profiles created before migration 012 may be missing it.
UPDATE profiles
SET allowed_listing_types = array_append(allowed_listing_types, 'transfer')
WHERE NOT ('transfer' = ANY(allowed_listing_types));
