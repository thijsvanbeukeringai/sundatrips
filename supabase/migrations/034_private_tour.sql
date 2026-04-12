-- Private tour option for activities/trips
ALTER TABLE properties ADD COLUMN IF NOT EXISTS private_tour_available boolean NOT NULL DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS private_tour_price numeric(10,2) DEFAULT NULL;
