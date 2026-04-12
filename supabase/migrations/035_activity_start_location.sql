-- Start/pickup location for activities and trips
ALTER TABLE properties ADD COLUMN IF NOT EXISTS start_location text DEFAULT NULL;
