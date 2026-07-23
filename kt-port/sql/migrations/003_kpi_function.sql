-- Portfolio-level KPIs for a given year, with variance vs the prior year.
-- SECURITY INVOKER (the default): RLS decides which rows each caller sees,
-- so demo users get demo KPIs and owners get their own.

CREATE OR REPLACE FUNCTION get_portfolio_kpis(p_year INTEGER)
RETURNS TABLE (
    total_portfolio_value NUMERIC,
    total_revenue         NUMERIC,
    total_expenses        NUMERIC,
    total_noi             NUMERIC,
    avg_occupancy_pct     NUMERIC,
    property_count        BIGINT,
    prev_revenue          NUMERIC,
    prev_noi              NUMERIC,
    revenue_variance_pct  NUMERIC,
    noi_variance_pct      NUMERIC
)
LANGUAGE sql STABLE
AS $$
WITH cur AS (
    SELECT
        COALESCE(SUM(total_income), 0)   AS revenue,
        COALESCE(SUM(total_expenses), 0) AS expenses,
        COALESCE(SUM(noi), 0)            AS noi,
        AVG(occupancy_pct)               AS occupancy
    FROM monthly_financials
    WHERE EXTRACT(YEAR FROM reporting_month) = p_year
),
prev AS (
    SELECT
        COALESCE(SUM(total_income), 0) AS revenue,
        COALESCE(SUM(noi), 0)          AS noi
    FROM monthly_financials
    WHERE EXTRACT(YEAR FROM reporting_month) = p_year - 1
),
props AS (
    SELECT COALESCE(SUM(purchase_price), 0) AS value, COUNT(*) AS n
    FROM properties
)
SELECT
    props.value,
    cur.revenue,
    cur.expenses,
    cur.noi,
    ROUND(COALESCE(cur.occupancy, 0), 2),
    props.n,
    prev.revenue,
    prev.noi,
    CASE WHEN prev.revenue > 0
         THEN ROUND((cur.revenue - prev.revenue) / prev.revenue * 100, 2)
         ELSE 0 END,
    CASE WHEN prev.noi > 0
         THEN ROUND((cur.noi - prev.noi) / prev.noi * 100, 2)
         ELSE 0 END
FROM cur, prev, props;
$$;

GRANT EXECUTE ON FUNCTION get_portfolio_kpis(INTEGER) TO anon, authenticated;
