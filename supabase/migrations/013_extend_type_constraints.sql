-- Extend the type CHECK to include 'transfer'
-- Extend price_unit CHECK to include 'trip' and 'vehicle'
-- PostgreSQL doesn't allow ALTER on CHECK constraints directly, so drop & recreate.

DO $$
DECLARE
  cname text;
BEGIN
  -- Drop existing type constraint
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'properties'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%type%stay%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE properties DROP CONSTRAINT %I', cname);
  END IF;

  -- Drop existing price_unit constraint
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'properties'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%price_unit%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE properties DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE properties
  ADD CONSTRAINT properties_type_check
    CHECK (type IN ('stay', 'trip', 'activity', 'transfer'));

ALTER TABLE properties
  ADD CONSTRAINT properties_price_unit_check
    CHECK (price_unit IN ('night', 'person', 'session', 'day', 'trip', 'vehicle'));
