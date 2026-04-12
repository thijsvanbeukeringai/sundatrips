-- Add company/business fields for partner profiles
ALTER TABLE profiles ADD COLUMN company_name TEXT;
ALTER TABLE profiles ADD COLUMN company_description TEXT;
ALTER TABLE profiles ADD COLUMN company_logo TEXT;
ALTER TABLE profiles ADD COLUMN company_location TEXT;
ALTER TABLE profiles ADD COLUMN company_island TEXT;
ALTER TABLE profiles ADD COLUMN languages TEXT[] DEFAULT '{}';
