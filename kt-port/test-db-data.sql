-- Test query to check if data exists in Supabase
-- Run this in Supabase SQL Editor to verify your data

-- Check how many properties exist
SELECT COUNT(*) as property_count FROM Properties;

-- Check how many financial records exist
SELECT COUNT(*) as financial_record_count FROM MonthlyFinancials;

-- Show all properties
SELECT PropertyID, PropertyName, City, State, Units FROM Properties ORDER BY PropertyID;

-- Show sample financial data for 2024
SELECT
    p.PropertyName,
    mf.ReportingMonth,
    mf.TotalIncome,
    mf.TotalExpenses,
    mf.NOI
FROM MonthlyFinancials mf
JOIN Properties p ON mf.PropertyID = p.PropertyID
WHERE mf.ReportingMonth >= '2024-01-01'
ORDER BY p.PropertyID, mf.ReportingMonth
LIMIT 20;
