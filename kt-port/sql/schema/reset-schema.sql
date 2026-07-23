-- ================================================
-- RESET DATABASE - Drop all tables and recreate schema
-- Supabase PostgreSQL Version
-- ================================================

-- ================================================
-- DROP ALL EXISTING TABLES AND POLICIES
-- ================================================

-- Drop policies first
DROP POLICY IF EXISTS "Enable read access for all users" ON MonthlyFinancials;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON MonthlyFinancials;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON MonthlyFinancials;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON MonthlyFinancials;

DROP POLICY IF EXISTS "Enable read access for all users" ON Properties;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON Properties;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON Properties;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON Properties;

-- Drop tables (cascade will drop all dependent objects)
DROP TABLE IF EXISTS MonthlyFinancials CASCADE;
DROP TABLE IF EXISTS Properties CASCADE;

-- ================================================
-- Create Properties table
-- ================================================
CREATE TABLE Properties (
    PropertyID INT NOT NULL PRIMARY KEY,
    PropertyName VARCHAR(255) NOT NULL,
    Address VARCHAR(500),
    City VARCHAR(100),
    State VARCHAR(50),
    ZipCode VARCHAR(20),
    Units INT,
    YearBuilt INT,
    DateAdded TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- Create MonthlyFinancials table
-- ================================================
CREATE TABLE MonthlyFinancials (
    FinancialID SERIAL PRIMARY KEY,
    PropertyID INT NOT NULL,
    ReportingMonth DATE NOT NULL,

    -- Income fields
    GrossRent DECIMAL(12,2) DEFAULT 0,
    Vacancy DECIMAL(12,2) DEFAULT 0,
    OtherIncome DECIMAL(12,2) DEFAULT 0,
    TotalIncome DECIMAL(12,2) DEFAULT 0,

    -- Expense fields
    RepairsMaintenance DECIMAL(12,2) DEFAULT 0,
    Utilities DECIMAL(12,2) DEFAULT 0,
    PropertyManagement DECIMAL(12,2) DEFAULT 0,
    PropertyTaxes DECIMAL(12,2) DEFAULT 0,
    Insurance DECIMAL(12,2) DEFAULT 0,
    Marketing DECIMAL(12,2) DEFAULT 0,
    Administrative DECIMAL(12,2) DEFAULT 0,
    TotalExpenses DECIMAL(12,2) DEFAULT 0,

    -- Calculated fields
    NOI DECIMAL(12,2) DEFAULT 0,
    DebtService DECIMAL(12,2) DEFAULT 0,
    CashFlow DECIMAL(12,2) DEFAULT 0,

    -- Other metrics
    Occupancy DECIMAL(5,2) DEFAULT 0,

    -- Metadata
    FilePath VARCHAR(500),
    DateCreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    DateModified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraint
    CONSTRAINT FK_MonthlyFinancials_Properties
        FOREIGN KEY (PropertyID)
        REFERENCES Properties(PropertyID),

    -- Unique constraint to prevent duplicate entries
    CONSTRAINT UQ_Property_Month
        UNIQUE (PropertyID, ReportingMonth)
);

-- ================================================
-- Create indexes for better performance
-- ================================================
CREATE INDEX IX_MonthlyFinancials_PropertyID
    ON MonthlyFinancials(PropertyID);

CREATE INDEX IX_MonthlyFinancials_ReportingMonth
    ON MonthlyFinancials(ReportingMonth);

-- ================================================
-- Enable Row Level Security (RLS)
-- ================================================
ALTER TABLE Properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE MonthlyFinancials ENABLE ROW LEVEL SECURITY;

-- ================================================
-- RLS Policies (Allow all authenticated users full access)
-- ================================================

-- Properties policies
CREATE POLICY "Enable read access for all users" ON Properties FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON Properties FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Enable update for authenticated users" ON Properties FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Enable delete for authenticated users" ON Properties FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- MonthlyFinancials policies
CREATE POLICY "Enable read access for all users" ON MonthlyFinancials FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON MonthlyFinancials FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Enable update for authenticated users" ON MonthlyFinancials FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Enable delete for authenticated users" ON MonthlyFinancials FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- ================================================
-- Grant permissions
-- ================================================
GRANT ALL ON Properties TO anon, authenticated, service_role;
GRANT ALL ON MonthlyFinancials TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE monthlyfinancials_financialid_seq TO anon, authenticated, service_role;
