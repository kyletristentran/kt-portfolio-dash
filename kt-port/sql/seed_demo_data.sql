-- Demo Data Seed Script
-- This script populates the database with realistic demo data for testing and demonstration

-- Clear existing demo data (optional - run this if you want to reset demo data)
-- DELETE FROM monthlyfinancials WHERE is_demo = TRUE;
-- DELETE FROM properties WHERE is_demo = TRUE;

-- ============================================
-- DEMO PROPERTIES
-- ============================================

-- Demo Property 1: Sunset Towers Apartments
INSERT INTO properties (
    propertyname,
    address,
    city,
    state,
    units,
    purchaseprice,
    is_demo
) VALUES (
    'Sunset Towers Apartments',
    '123 Sunset Boulevard',
    'Los Angeles',
    'CA',
    48,
    8500000,
    TRUE
) ON CONFLICT DO NOTHING;

-- Demo Property 2: Downtown Plaza
INSERT INTO properties (
    propertyname,
    address,
    city,
    state,
    units,
    purchaseprice,
    is_demo
) VALUES (
    'Downtown Plaza',
    '456 Market Street',
    'San Francisco',
    'CA',
    36,
    12000000,
    TRUE
) ON CONFLICT DO NOTHING;

-- Demo Property 3: Tech Center Office Building
INSERT INTO properties (
    propertyname,
    address,
    city,
    state,
    units,
    purchaseprice,
    is_demo
) VALUES (
    'Tech Center Office Building',
    '789 Innovation Drive',
    'San Jose',
    'CA',
    24,
    6500000,
    TRUE
) ON CONFLICT DO NOTHING;

-- Demo Property 4: Riverside Lofts
INSERT INTO properties (
    propertyname,
    address,
    city,
    state,
    units,
    purchaseprice,
    is_demo
) VALUES (
    'Riverside Lofts',
    '321 River Road',
    'Portland',
    'OR',
    32,
    5200000,
    TRUE
) ON CONFLICT DO NOTHING;

-- Demo Property 5: Mountain View Residences
INSERT INTO properties (
    propertyname,
    address,
    city,
    state,
    units,
    purchaseprice,
    is_demo
) VALUES (
    'Mountain View Residences',
    '555 Highland Avenue',
    'Seattle',
    'WA',
    40,
    7800000,
    TRUE
) ON CONFLICT DO NOTHING;

-- ============================================
-- DEMO MONTHLY FINANCIALS
-- ============================================

-- Function to generate demo financial data for a property
-- This creates 12 months of realistic financial data with some variance

DO $$
DECLARE
    prop RECORD;
    month_date DATE;
    base_rent NUMERIC;
    variance NUMERIC;
    gross_rent NUMERIC;
    vacancy NUMERIC;
    other_income NUMERIC;
    total_income NUMERIC;
    repairs NUMERIC;
    utilities NUMERIC;
    prop_mgmt NUMERIC;
    prop_taxes NUMERIC;
    insurance NUMERIC;
    marketing NUMERIC;
    admin NUMERIC;
    total_expenses NUMERIC;
    noi NUMERIC;
    debt_service NUMERIC;
    cash_flow NUMERIC;
    occupancy_rate NUMERIC;
BEGIN
    -- Loop through each demo property
    FOR prop IN SELECT propertyid, units, purchaseprice FROM properties WHERE is_demo = TRUE
    LOOP
        -- Calculate base rent per unit (rough estimate: $1,500 - $3,500 per unit)
        base_rent := prop.units * (1500 + (prop.purchaseprice / prop.units / 10000));

        -- Generate 12 months of data (Jan 2024 - Dec 2024)
        FOR i IN 1..12 LOOP
            month_date := ('2024-' || LPAD(i::TEXT, 2, '0') || '-01')::DATE;

            -- Add random variance (±5%)
            variance := 0.95 + (RANDOM() * 0.10);

            -- Calculate financials with some randomness
            gross_rent := ROUND(base_rent * variance);
            occupancy_rate := 92 + (RANDOM() * 6); -- 92-98% occupancy
            vacancy := ROUND(gross_rent * (1 - occupancy_rate / 100));
            other_income := ROUND(gross_rent * 0.03 * (0.8 + RANDOM() * 0.4)); -- 2.4-4.2% of rent
            total_income := gross_rent - vacancy + other_income;

            -- Operating expenses (realistic ratios)
            repairs := ROUND(total_income * 0.05 * (0.8 + RANDOM() * 0.4)); -- 4-6%
            utilities := ROUND(total_income * 0.06 * (0.8 + RANDOM() * 0.4)); -- 4.8-7.2%
            prop_mgmt := ROUND(total_income * 0.08); -- 8% (standard)
            prop_taxes := ROUND(prop.purchaseprice * 0.012 / 12 * (0.9 + RANDOM() * 0.2)); -- ~1.2% annually
            insurance := ROUND(prop.purchaseprice * 0.006 / 12 * (0.9 + RANDOM() * 0.2)); -- ~0.6% annually
            marketing := ROUND(total_income * 0.01 * (0.5 + RANDOM())); -- 0.5-1.5%
            admin := ROUND(total_income * 0.02 * (0.8 + RANDOM() * 0.4)); -- 1.6-2.4%

            total_expenses := repairs + utilities + prop_mgmt + prop_taxes + insurance + marketing + admin;
            noi := total_income - total_expenses;

            -- Debt service (assuming 65% LTV at 5.5% interest, 30-year amortization)
            debt_service := ROUND(prop.purchaseprice * 0.65 * 0.00568 * (0.95 + RANDOM() * 0.10)); -- Monthly payment
            cash_flow := noi - debt_service;

            -- Insert the financial record
            INSERT INTO monthlyfinancials (
                propertyid,
                reportingmonth,
                grossrent,
                vacancy,
                otherincome,
                totalincome,
                repairsmaintenance,
                utilities,
                propertymanagement,
                propertytaxes,
                insurance,
                marketing,
                administrative,
                totalexpenses,
                noi,
                debtservice,
                cashflow,
                occupancy,
                filepath,
                is_demo
            ) VALUES (
                prop.propertyid,
                month_date,
                gross_rent,
                vacancy,
                other_income,
                total_income,
                repairs,
                utilities,
                prop_mgmt,
                prop_taxes,
                insurance,
                marketing,
                admin,
                total_expenses,
                noi,
                debt_service,
                cash_flow,
                occupancy_rate,
                'Demo Data Seed',
                TRUE
            ) ON CONFLICT (propertyid, reportingmonth) DO UPDATE SET
                grossrent = EXCLUDED.grossrent,
                vacancy = EXCLUDED.vacancy,
                otherincome = EXCLUDED.otherincome,
                totalincome = EXCLUDED.totalincome,
                repairsmaintenance = EXCLUDED.repairsmaintenance,
                utilities = EXCLUDED.utilities,
                propertymanagement = EXCLUDED.propertymanagement,
                propertytaxes = EXCLUDED.propertytaxes,
                insurance = EXCLUDED.insurance,
                marketing = EXCLUDED.marketing,
                administrative = EXCLUDED.administrative,
                totalexpenses = EXCLUDED.totalexpenses,
                noi = EXCLUDED.noi,
                debtservice = EXCLUDED.debtservice,
                cashflow = EXCLUDED.cashflow,
                occupancy = EXCLUDED.occupancy,
                is_demo = TRUE;
        END LOOP;
    END LOOP;
END $$;

-- Verify demo data was inserted
SELECT
    'Properties' as table_name,
    COUNT(*) as demo_count,
    STRING_AGG(propertyname, ', ') as demo_items
FROM properties
WHERE is_demo = TRUE
UNION ALL
SELECT
    'Monthly Financials' as table_name,
    COUNT(*) as demo_count,
    COUNT(DISTINCT propertyid) || ' properties × ' || COUNT(DISTINCT reportingmonth) || ' months' as demo_items
FROM monthlyfinancials
WHERE is_demo = TRUE;
