-- Insert remaining financial data for Properties 3-9
-- Run this AFTER properties have been inserted

-- Rio Grande Commons (Property 3) - 2024 (Jan-Oct)
INSERT INTO MonthlyFinancials (PropertyID, ReportingMonth, GrossRent, Vacancy, OtherIncome, TotalIncome,
    RepairsMaintenance, Utilities, PropertyManagement, PropertyTaxes, Insurance, Marketing, Administrative,
    TotalExpenses, NOI, DebtService, CashFlow, Occupancy)
VALUES
    (3, '2024-01-01', 167400, 10044, 5500, 162856, 11000, 15500, 8143, 12300, 5500, 1500, 2800, 56743, 106113, 48000, 58113, 94.0),
    (3, '2024-02-01', 167400, 8370, 5800, 164830, 10100, 15000, 8242, 12300, 5500, 1300, 2700, 55142, 109688, 48000, 61688, 95.0),
    (3, '2024-03-01', 167400, 6696, 6200, 166904, 12300, 14500, 8345, 12300, 5500, 1100, 2600, 56645, 110259, 48000, 62259, 96.0),
    (3, '2024-04-01', 167400, 5022, 6000, 168378, 11300, 13900, 8419, 12300, 5500, 900, 2500, 54819, 113559, 48000, 65559, 97.0),
    (3, '2024-05-01', 167400, 3348, 6400, 170452, 10400, 13200, 8523, 12300, 5500, 700, 2400, 53023, 117429, 48000, 69429, 98.0),
    (3, '2024-06-01', 167400, 3348, 6600, 170652, 11800, 12700, 8533, 12300, 5500, 500, 2300, 53633, 117019, 48000, 69019, 98.0),
    (3, '2024-07-01', 172800, 3456, 6800, 176144, 12200, 12100, 8807, 12300, 5500, 300, 2200, 53407, 122737, 48000, 74737, 98.0),
    (3, '2024-08-01', 172800, 3456, 6700, 176044, 11700, 11900, 8802, 12300, 5500, 300, 2100, 52602, 123442, 48000, 75442, 98.0),
    (3, '2024-09-01', 172800, 3456, 6500, 175844, 12600, 12300, 8792, 12300, 5500, 400, 2200, 54092, 121752, 48000, 73752, 98.0),
    (3, '2024-10-01', 172800, 5184, 6800, 174416, 11900, 12800, 8721, 12300, 5500, 600, 2400, 54221, 120195, 48000, 72195, 97.0)
ON CONFLICT (PropertyID, ReportingMonth) DO NOTHING;

-- Turquoise Trail Residences (Property 4) - 2024
INSERT INTO MonthlyFinancials (PropertyID, ReportingMonth, GrossRent, Vacancy, OtherIncome, TotalIncome,
    RepairsMaintenance, Utilities, PropertyManagement, PropertyTaxes, Insurance, Marketing, Administrative,
    TotalExpenses, NOI, DebtService, CashFlow, Occupancy)
VALUES
    (4, '2024-01-01', 116424, 5821, 3300, 113903, 8200, 11400, 5695, 8400, 3800, 1200, 2200, 40895, 73008, 32000, 41008, 95.0),
    (4, '2024-05-01', 116424, 1164, 3900, 119160, 7800, 9700, 5958, 8400, 3800, 400, 1800, 37858, 81302, 32000, 49302, 99.0),
    (4, '2024-10-01', 120960, 2419, 4300, 122841, 9100, 9400, 6142, 8400, 3800, 300, 1700, 38842, 83999, 32000, 51999, 98.0)
ON CONFLICT (PropertyID, ReportingMonth) DO NOTHING;

-- Mesilla Valley Estates (Property 5) - 2024
INSERT INTO MonthlyFinancials (PropertyID, ReportingMonth, GrossRent, Vacancy, OtherIncome, TotalIncome,
    RepairsMaintenance, Utilities, PropertyManagement, PropertyTaxes, Insurance, Marketing, Administrative,
    TotalExpenses, NOI, DebtService, CashFlow, Occupancy)
VALUES
    (5, '2024-01-01', 78000, 4680, 2800, 76120, 5500, 8800, 3806, 6200, 3000, 1000, 1800, 30106, 46014, 24000, 22014, 94.0),
    (5, '2024-05-01', 78000, 1560, 3400, 79840, 5200, 7500, 3992, 6200, 3000, 200, 1400, 27492, 52348, 24000, 28348, 98.0),
    (5, '2024-10-01', 81000, 2430, 3800, 82370, 6300, 7400, 4119, 6200, 3000, 200, 1400, 28619, 53751, 24000, 29751, 97.0)
ON CONFLICT (PropertyID, ReportingMonth) DO NOTHING;

-- Bosque Heights (Property 6) - 2024
INSERT INTO MonthlyFinancials (PropertyID, ReportingMonth, GrossRent, Vacancy, OtherIncome, TotalIncome,
    RepairsMaintenance, Utilities, PropertyManagement, PropertyTaxes, Insurance, Marketing, Administrative,
    TotalExpenses, NOI, DebtService, CashFlow, Occupancy)
VALUES
    (6, '2024-01-01', 159120, 7956, 5100, 156264, 10700, 15000, 7813, 11300, 5200, 1500, 2700, 54213, 102051, 44000, 58051, 95.0),
    (6, '2024-05-01', 159120, 1591, 5900, 163429, 10200, 12800, 8171, 11300, 5200, 700, 2300, 50671, 112758, 44000, 68758, 99.0),
    (6, '2024-10-01', 164700, 3294, 6300, 167706, 11600, 12400, 8385, 11300, 5200, 600, 2300, 51785, 115921, 44000, 71921, 98.0)
ON CONFLICT (PropertyID, ReportingMonth) DO NOTHING;

-- Zia Park Apartments (Property 7) - 2024
INSERT INTO MonthlyFinancials (PropertyID, ReportingMonth, GrossRent, Vacancy, OtherIncome, TotalIncome,
    RepairsMaintenance, Utilities, PropertyManagement, PropertyTaxes, Insurance, Marketing, Administrative,
    TotalExpenses, NOI, DebtService, CashFlow, Occupancy)
VALUES
    (7, '2024-01-01', 131040, 6552, 4200, 128688, 9300, 12900, 6434, 9900, 4700, 1200, 2500, 46934, 81754, 38000, 43754, 95.0),
    (7, '2024-05-01', 131040, 1310, 4900, 134630, 8900, 11100, 6732, 9900, 4700, 400, 2100, 43832, 90798, 38000, 52798, 99.0),
    (7, '2024-10-01', 135720, 2714, 5300, 138306, 10100, 10800, 6915, 9900, 4700, 300, 2100, 44815, 93491, 38000, 55491, 98.0)
ON CONFLICT (PropertyID, ReportingMonth) DO NOTHING;

-- Sangre de Cristo Towers (Property 8) - 2024
INSERT INTO MonthlyFinancials (PropertyID, ReportingMonth, GrossRent, Vacancy, OtherIncome, TotalIncome,
    RepairsMaintenance, Utilities, PropertyManagement, PropertyTaxes, Insurance, Marketing, Administrative,
    TotalExpenses, NOI, DebtService, CashFlow, Occupancy)
VALUES
    (8, '2024-01-01', 93600, 3744, 3200, 93056, 6800, 9300, 4653, 9000, 4100, 1000, 2200, 37053, 56003, 35000, 21003, 96.0),
    (8, '2024-05-01', 93600, 936, 3800, 96464, 6700, 8000, 4823, 9000, 4100, 200, 1800, 34623, 61841, 35000, 26841, 99.0),
    (8, '2024-10-01', 97200, 1944, 4200, 99456, 8000, 7800, 4973, 9000, 4100, 200, 1800, 35873, 63583, 35000, 28583, 98.0)
ON CONFLICT (PropertyID, ReportingMonth) DO NOTHING;

-- Organ Mountain Commons (Property 9) - 2024
INSERT INTO MonthlyFinancials (PropertyID, ReportingMonth, GrossRent, Vacancy, OtherIncome, TotalIncome,
    RepairsMaintenance, Utilities, PropertyManagement, PropertyTaxes, Insurance, Marketing, Administrative,
    TotalExpenses, NOI, DebtService, CashFlow, Occupancy)
VALUES
    (9, '2024-01-01', 85800, 5148, 2900, 83552, 6000, 9800, 4178, 6900, 3200, 1100, 2000, 33178, 50374, 27000, 23374, 94.0),
    (9, '2024-05-01', 85800, 1716, 3500, 87584, 5800, 8400, 4379, 6900, 3200, 300, 1600, 30579, 57005, 27000, 30005, 98.0),
    (9, '2024-10-01', 89100, 2673, 3900, 90327, 6800, 8200, 4516, 6900, 3200, 200, 1600, 31416, 58911, 27000, 31911, 97.0)
ON CONFLICT (PropertyID, ReportingMonth) DO NOTHING;

-- Verify the data
SELECT
    p.PropertyID,
    p.PropertyName,
    COUNT(mf.FinancialID) as records_2024
FROM Properties p
LEFT JOIN MonthlyFinancials mf ON p.PropertyID = mf.PropertyID
    AND mf.ReportingMonth >= '2024-01-01'
    AND mf.ReportingMonth <= '2024-12-31'
GROUP BY p.PropertyID, p.PropertyName
ORDER BY p.PropertyID;
