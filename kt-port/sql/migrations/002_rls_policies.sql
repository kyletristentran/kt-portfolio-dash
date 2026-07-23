-- v2 RLS — enabled from day one, no unauthenticated backdoors.
-- Everyone (including anon) can READ demo rows; only owners touch real rows.

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_financials ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- properties
-- ============================================================
CREATE POLICY "read demo or own properties"
    ON properties FOR SELECT
    USING (is_demo OR user_id = (SELECT auth.uid()));

CREATE POLICY "insert own properties"
    ON properties FOR INSERT
    WITH CHECK (NOT is_demo AND user_id = (SELECT auth.uid()));

CREATE POLICY "update own properties"
    ON properties FOR UPDATE
    USING (NOT is_demo AND user_id = (SELECT auth.uid()))
    WITH CHECK (NOT is_demo AND user_id = (SELECT auth.uid()));

CREATE POLICY "delete own properties"
    ON properties FOR DELETE
    USING (NOT is_demo AND user_id = (SELECT auth.uid()));

-- ============================================================
-- monthly_financials (ownership via parent property)
-- ============================================================
CREATE POLICY "read demo or own financials"
    ON monthly_financials FOR SELECT
    USING (
        is_demo
        OR EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = property_id AND p.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "insert financials for own properties"
    ON monthly_financials FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = property_id
              AND p.user_id = (SELECT auth.uid())
              AND NOT p.is_demo
        )
    );

CREATE POLICY "update financials for own properties"
    ON monthly_financials FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = property_id
              AND p.user_id = (SELECT auth.uid())
              AND NOT p.is_demo
        )
    );

CREATE POLICY "delete financials for own properties"
    ON monthly_financials FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = property_id
              AND p.user_id = (SELECT auth.uid())
              AND NOT p.is_demo
        )
    );
