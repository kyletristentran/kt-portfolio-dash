-- Migration: Add demo data isolation flags
-- This allows separating demo/sample data from real production data

-- Add is_demo flag to Properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

-- Add is_demo flag to MonthlyFinancials table
ALTER TABLE monthlyfinancials
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

-- Add is_demo flag to Users table (if exists)
-- ALTER TABLE users
-- ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

-- Create indexes for better query performance when filtering demo data
CREATE INDEX IF NOT EXISTS idx_properties_is_demo ON properties(is_demo);
CREATE INDEX IF NOT EXISTS idx_monthlyfinancials_is_demo ON monthlyfinancials(is_demo);

-- Add comments for documentation
COMMENT ON COLUMN properties.is_demo IS 'Flag to identify demo/sample data. TRUE = demo data, FALSE = real production data';
COMMENT ON COLUMN monthlyfinancials.is_demo IS 'Flag to identify demo/sample data. TRUE = demo data, FALSE = real production data';

-- Optional: Create a view for production data only (excluding demos)
CREATE OR REPLACE VIEW production_properties AS
SELECT * FROM properties WHERE is_demo = FALSE;

CREATE OR REPLACE VIEW production_monthlyfinancials AS
SELECT * FROM monthlyfinancials WHERE is_demo = FALSE;

-- Optional: Create a view for demo data only
CREATE OR REPLACE VIEW demo_properties AS
SELECT * FROM properties WHERE is_demo = TRUE;

CREATE OR REPLACE VIEW demo_monthlyfinancials AS
SELECT * FROM monthlyfinancials WHERE is_demo = TRUE;
