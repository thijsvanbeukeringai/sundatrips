-- Add price per km for transfer properties (custom route pricing)
ALTER TABLE properties ADD COLUMN price_per_km NUMERIC(10,2);
