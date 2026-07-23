-- Demo portfolio: 5 properties × 24 months (2024–2025).
-- Run as postgres (SQL editor / MCP) — RLS is bypassed for the table owner,
-- which is required since demo rows are ownerless and the insert policies
-- only allow user-owned rows.
-- Idempotent: deletes existing demo rows first.

DELETE FROM monthly_financials WHERE is_demo;
DELETE FROM properties WHERE is_demo;

WITH new_props AS (
    INSERT INTO properties (name, address, city, state, zip_code, units, year_built, purchase_price, user_id, is_demo)
    VALUES
        ('Sunset Towers',      '1200 Sunset Blvd',   'Los Angeles', 'CA', '90026', 48, 2015,  9600000, NULL, TRUE),
        ('Harbor View',        '450 Harbor Dr',      'San Diego',   'CA', '92101', 36, 2018,  8100000, NULL, TRUE),
        ('Mountain Peak',      '890 Alpine Way',     'Denver',      'CO', '80202', 24, 2012,  4800000, NULL, TRUE),
        ('Riverside Commons',  '2200 River Rd',      'Austin',      'TX', '78701', 60, 2020, 13500000, NULL, TRUE),
        ('Metro Heights',      '77 Pine St',         'Seattle',     'WA', '98101', 42, 2016,  9450000, NULL, TRUE)
    RETURNING id, units
),
months AS (
    SELECT generate_series(DATE '2024-01-01', DATE '2025-12-01', INTERVAL '1 month')::date AS m
),
calc AS (
    SELECT
        p.id AS property_id,
        months.m AS reporting_month,
        -- base rent ≈ $1,750/unit with per-property and seasonal wobble
        ROUND(p.units * 1750
              * (1 + 0.08 * sin(p.id * 2.1))
              * (1 + 0.03 * sin(EXTRACT(MONTH FROM months.m) / 12.0 * 2 * pi()))
              * CASE WHEN EXTRACT(YEAR FROM months.m) = 2025 THEN 1.04 ELSE 1 END
              , 2) AS gross_rent,
        ROUND(94 + 3 * sin(p.id * 3.7 + EXTRACT(MONTH FROM months.m)), 2) AS occupancy_pct
    FROM new_props p CROSS JOIN months
)
INSERT INTO monthly_financials (
    property_id, reporting_month,
    gross_rent, vacancy_loss, other_income, total_income,
    repairs_maintenance, utilities, property_management, property_taxes,
    insurance, marketing, administrative, total_expenses,
    noi, debt_service, cash_flow, occupancy_pct
)
SELECT
    property_id, reporting_month,
    gross_rent,
    ROUND(gross_rent * (100 - occupancy_pct) / 100, 2)                        AS vacancy_loss,
    ROUND(gross_rent * 0.05, 2)                                               AS other_income,
    ROUND(gross_rent * occupancy_pct / 100 + gross_rent * 0.05, 2)            AS total_income,
    ROUND(gross_rent * 0.08, 2)                                               AS repairs_maintenance,
    ROUND(gross_rent * 0.06, 2)                                               AS utilities,
    ROUND(gross_rent * 0.05, 2)                                               AS property_management,
    ROUND(gross_rent * 0.10, 2)                                               AS property_taxes,
    ROUND(gross_rent * 0.04, 2)                                               AS insurance,
    ROUND(gross_rent * 0.02, 2)                                               AS marketing,
    ROUND(gross_rent * 0.03, 2)                                               AS administrative,
    ROUND(gross_rent * 0.38, 2)                                               AS total_expenses,
    ROUND(gross_rent * occupancy_pct / 100 + gross_rent * 0.05
          - gross_rent * 0.38, 2)                                             AS noi,
    ROUND(gross_rent * 0.30, 2)                                               AS debt_service,
    ROUND(gross_rent * occupancy_pct / 100 + gross_rent * 0.05
          - gross_rent * 0.38 - gross_rent * 0.30, 2)                         AS cash_flow,
    occupancy_pct
FROM calc;

-- sanity check
SELECT
    (SELECT COUNT(*) FROM properties WHERE is_demo)          AS demo_properties,   -- expect 5
    (SELECT COUNT(*) FROM monthly_financials WHERE is_demo)  AS demo_financials;   -- expect 120
