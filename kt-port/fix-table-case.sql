-- The issue: PostgreSQL stores unquoted identifiers as lowercase
-- The solution: Use this simple view-based workaround

-- Create views with the exact casing that Supabase client expects
CREATE OR REPLACE VIEW "Properties" AS SELECT * FROM properties;
CREATE OR REPLACE VIEW "MonthlyFinancials" AS SELECT * FROM monthlyfinancials;

-- Grant permissions on views
GRANT ALL ON "Properties" TO anon, authenticated, service_role;
GRANT ALL ON "MonthlyFinancials" TO anon, authenticated, service_role;

-- Now your code can use "Properties" and "MonthlyFinancials" with capital letters!
