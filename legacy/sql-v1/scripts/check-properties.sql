-- Check what properties exist in the database
SELECT PropertyID, PropertyName, City, State, Units
FROM Properties
ORDER BY PropertyID;

-- Count total properties
SELECT COUNT(*) as total_properties FROM Properties;

-- Count financial records per property
SELECT
    p.PropertyID,
    p.PropertyName,
    COUNT(mf.FinancialID) as financial_records_count
FROM Properties p
LEFT JOIN MonthlyFinancials mf ON p.PropertyID = mf.PropertyID
GROUP BY p.PropertyID, p.PropertyName
ORDER BY p.PropertyID;
