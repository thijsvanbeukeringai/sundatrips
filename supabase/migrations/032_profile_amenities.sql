-- Add amenities to partner profiles (vehicle, driver, service features)
ALTER TABLE profiles ADD COLUMN amenities TEXT[] DEFAULT '{}';
