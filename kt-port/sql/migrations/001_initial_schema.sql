-- v2 schema — clean redesign (snake_case, RLS-first)
-- Tables: properties, monthly_financials

-- ============================================================
-- properties
-- ============================================================
CREATE TABLE properties (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            TEXT NOT NULL,
    address         TEXT,
    city            TEXT,
    state           TEXT,
    zip_code        TEXT,
    units           INTEGER,
    year_built      INTEGER,
    purchase_price  NUMERIC(14,2) NOT NULL DEFAULT 0,

    -- ownership / demo isolation
    user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_demo         BOOLEAN NOT NULL DEFAULT FALSE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- demo rows are ownerless; real rows must have an owner
    CONSTRAINT properties_owner_or_demo
        CHECK ((is_demo AND user_id IS NULL) OR (NOT is_demo AND user_id IS NOT NULL))
);

CREATE INDEX idx_properties_user_id ON properties (user_id);

-- ============================================================
-- monthly_financials
-- ============================================================
CREATE TABLE monthly_financials (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    property_id          BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    reporting_month      DATE NOT NULL,

    -- income
    gross_rent           NUMERIC(14,2) NOT NULL DEFAULT 0,
    vacancy_loss         NUMERIC(14,2) NOT NULL DEFAULT 0,
    other_income         NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_income         NUMERIC(14,2) NOT NULL DEFAULT 0,

    -- expenses
    repairs_maintenance  NUMERIC(14,2) NOT NULL DEFAULT 0,
    utilities            NUMERIC(14,2) NOT NULL DEFAULT 0,
    property_management  NUMERIC(14,2) NOT NULL DEFAULT 0,
    property_taxes       NUMERIC(14,2) NOT NULL DEFAULT 0,
    insurance            NUMERIC(14,2) NOT NULL DEFAULT 0,
    marketing            NUMERIC(14,2) NOT NULL DEFAULT 0,
    administrative       NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_expenses       NUMERIC(14,2) NOT NULL DEFAULT 0,

    -- results
    noi                  NUMERIC(14,2) NOT NULL DEFAULT 0,
    debt_service         NUMERIC(14,2) NOT NULL DEFAULT 0,
    cash_flow            NUMERIC(14,2) NOT NULL DEFAULT 0,
    occupancy_pct        NUMERIC(5,2)  NOT NULL DEFAULT 0
                         CHECK (occupancy_pct BETWEEN 0 AND 100),

    -- import metadata
    source_file          TEXT,

    -- denormalized from the parent property (kept in sync by trigger)
    is_demo              BOOLEAN NOT NULL DEFAULT FALSE,

    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT monthly_financials_month_normalized
        CHECK (reporting_month = date_trunc('month', reporting_month)::date),
    CONSTRAINT monthly_financials_property_month_unique
        UNIQUE (property_id, reporting_month)
);

CREATE INDEX idx_monthly_financials_property_id ON monthly_financials (property_id);
CREATE INDEX idx_monthly_financials_reporting_month ON monthly_financials (reporting_month);

-- ============================================================
-- triggers
-- ============================================================

-- keep updated_at fresh
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_monthly_financials_updated_at
    BEFORE UPDATE ON monthly_financials
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- inherit is_demo from the parent property so it can never drift
CREATE OR REPLACE FUNCTION sync_financials_is_demo()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    SELECT p.is_demo INTO NEW.is_demo FROM properties p WHERE p.id = NEW.property_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_monthly_financials_is_demo
    BEFORE INSERT OR UPDATE OF property_id ON monthly_financials
    FOR EACH ROW EXECUTE FUNCTION sync_financials_is_demo();
