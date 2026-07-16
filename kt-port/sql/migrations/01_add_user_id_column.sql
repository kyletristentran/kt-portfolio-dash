-- Add user_id column to properties table for multi-tenant support
-- This links properties to Supabase Auth users

-- Add user_id column if it doesn't exist
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);

-- Add comment for documentation
COMMENT ON COLUMN properties.user_id IS 'Foreign key to Supabase auth.users. NULL for demo properties or when user_id is not set.';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'properties'
AND column_name = 'user_id';
