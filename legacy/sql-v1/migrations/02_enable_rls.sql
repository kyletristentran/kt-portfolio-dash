-- Enable Row Level Security (RLS) for data isolation
-- ⚠️ IMPORTANT: Run 01_add_user_id_column.sql BEFORE running this script!
-- This ensures users can only see their own data or demo data

-- ============================================
-- ENABLE RLS ON TABLES
-- ============================================

-- Enable RLS on properties table
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Enable RLS on monthlyfinancials table
ALTER TABLE monthlyfinancials ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own properties" ON properties;
DROP POLICY IF EXISTS "Users can insert their own properties" ON properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON properties;
DROP POLICY IF EXISTS "Users can view demo properties" ON properties;

DROP POLICY IF EXISTS "Users can view their own financials" ON monthlyfinancials;
DROP POLICY IF EXISTS "Users can insert their own financials" ON monthlyfinancials;
DROP POLICY IF EXISTS "Users can update their own financials" ON monthlyfinancials;
DROP POLICY IF EXISTS "Users can delete their own financials" ON monthlyfinancials;
DROP POLICY IF EXISTS "Users can view demo financials" ON monthlyfinancials;

-- ============================================
-- PROPERTIES TABLE POLICIES
-- ============================================

-- Policy 1: Users can view demo properties (public access)
CREATE POLICY "Users can view demo properties"
ON properties
FOR SELECT
USING (is_demo = TRUE);

-- Policy 2: Users can view their own non-demo properties
CREATE POLICY "Users can view their own properties"
ON properties
FOR SELECT
USING (
    is_demo = FALSE
    AND (
        user_id = auth.uid()  -- User owns this property
        OR auth.uid() IS NULL -- ⚠️ REMOVE IN PRODUCTION - allows unauthenticated access
    )
);

-- Policy 3: Users can insert their own properties
CREATE POLICY "Users can insert their own properties"
ON properties
FOR INSERT
WITH CHECK (
    is_demo = FALSE
    AND user_id = auth.uid()
);

-- Policy 4: Users can update their own properties
CREATE POLICY "Users can update their own properties"
ON properties
FOR UPDATE
USING (
    is_demo = FALSE
    AND user_id = auth.uid()
);

-- Policy 5: Users can delete their own properties
CREATE POLICY "Users can delete their own properties"
ON properties
FOR DELETE
USING (
    is_demo = FALSE
    AND user_id = auth.uid()
);

-- ============================================
-- MONTHLY FINANCIALS TABLE POLICIES
-- ============================================

-- Policy 1: Users can view demo financials (public access)
CREATE POLICY "Users can view demo financials"
ON monthlyfinancials
FOR SELECT
USING (is_demo = TRUE);

-- Policy 2: Users can view their own non-demo financials
CREATE POLICY "Users can view their own financials"
ON monthlyfinancials
FOR SELECT
USING (
    is_demo = FALSE
    AND (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.propertyid = monthlyfinancials.propertyid
            AND properties.user_id = auth.uid()
        )
        OR auth.uid() IS NULL -- ⚠️ REMOVE IN PRODUCTION
    )
);

-- Policy 3: Users can insert financials for their own properties
CREATE POLICY "Users can insert their own financials"
ON monthlyfinancials
FOR INSERT
WITH CHECK (
    is_demo = FALSE
    AND EXISTS (
        SELECT 1 FROM properties
        WHERE properties.propertyid = monthlyfinancials.propertyid
        AND properties.user_id = auth.uid()
    )
);

-- Policy 4: Users can update financials for their own properties
CREATE POLICY "Users can update their own financials"
ON monthlyfinancials
FOR UPDATE
USING (
    is_demo = FALSE
    AND EXISTS (
        SELECT 1 FROM properties
        WHERE properties.propertyid = monthlyfinancials.propertyid
        AND properties.user_id = auth.uid()
    )
);

-- Policy 5: Users can delete financials for their own properties
CREATE POLICY "Users can delete their own financials"
ON monthlyfinancials
FOR DELETE
USING (
    is_demo = FALSE
    AND EXISTS (
        SELECT 1 FROM properties
        WHERE properties.propertyid = monthlyfinancials.propertyid
        AND properties.user_id = auth.uid()
    )
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if a property belongs to the current user
CREATE OR REPLACE FUNCTION is_property_owner(prop_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM properties
        WHERE propertyid = prop_id
        AND (user_id = auth.uid() OR is_demo = TRUE)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all accessible properties for current user
CREATE OR REPLACE FUNCTION get_accessible_properties()
RETURNS SETOF properties AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM properties
    WHERE is_demo = TRUE
    OR user_id = auth.uid()
    OR auth.uid() IS NULL;  -- ⚠️ REMOVE IN PRODUCTION
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant access to tables
GRANT SELECT, INSERT, UPDATE, DELETE ON properties TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON monthlyfinancials TO authenticated;

-- Grant access to demo data for anonymous users
GRANT SELECT ON properties TO anon;
GRANT SELECT ON monthlyfinancials TO anon;

-- Grant access to sequences (if any)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Add helpful comments
COMMENT ON POLICY "Users can view demo properties" ON properties IS 'Allows all users to view demo/sample properties for testing';
COMMENT ON POLICY "Users can view their own properties" ON properties IS 'Users can only view properties they own';
COMMENT ON POLICY "Users can view demo financials" ON monthlyfinancials IS 'Allows all users to view demo/sample financial data';
COMMENT ON POLICY "Users can view their own financials" ON monthlyfinancials IS 'Users can only view financials for properties they own';

-- ============================================
-- VERIFICATION
-- ============================================

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('properties', 'monthlyfinancials');

-- List all policies
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('properties', 'monthlyfinancials')
ORDER BY tablename, policyname;
