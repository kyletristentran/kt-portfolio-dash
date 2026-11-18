# Database Schema (v2)

Schema for the dedicated Supabase project backing the KT Portfolio Dashboard.
The DDL is in [`sql/migrations/`](../sql/migrations/), and [`sql/README.md`](../sql/README.md) gives the run order.

## Entity overview

```
auth.users (Supabase Auth)
    │ user_id (UUID, NULL for demo rows)
    ▼
properties 1 ──── * monthly_financials
                    (property_id FK, UNIQUE (property_id, reporting_month))
```

## `properties`

One row per property.

| Column           | Type            | Notes                                                       |
|------------------|-----------------|-------------------------------------------------------------|
| `id`             | `BIGINT` **PK** | identity (always generated)                                 |
| `name`           | `TEXT`          | NOT NULL                                                    |
| `address`        | `TEXT`          |                                                             |
| `city`           | `TEXT`          |                                                             |
| `state`          | `TEXT`          |                                                             |
| `zip_code`       | `TEXT`          |                                                             |
| `units`          | `INTEGER`       |                                                             |
| `year_built`     | `INTEGER`       |                                                             |
| `purchase_price` | `NUMERIC(14,2)` | NOT NULL, default 0                                         |
| `user_id`        | `UUID`          | FK → `auth.users(id)` ON DELETE CASCADE; NULL iff demo      |
| `is_demo`        | `BOOLEAN`       | NOT NULL, default FALSE                                     |
| `created_at`     | `TIMESTAMPTZ`   | default `now()`                                             |
| `updated_at`     | `TIMESTAMPTZ`   | maintained by trigger                                       |

CHECK `properties_owner_or_demo`: demo rows have no owner and real rows must have one:
`(is_demo AND user_id IS NULL) OR (NOT is_demo AND user_id IS NOT NULL)`.

Index: `idx_properties_user_id (user_id)`.

## `monthly_financials`

One row per property per month.

| Column                | Type            | Notes                                             |
|-----------------------|-----------------|---------------------------------------------------|
| `id`                  | `BIGINT` **PK** | identity                                          |
| `property_id`         | `BIGINT`        | FK → `properties(id)` ON DELETE CASCADE, NOT NULL |
| `reporting_month`     | `DATE`          | NOT NULL, CHECK: first of month                   |
| **Income**            |                 | all `NUMERIC(14,2)` NOT NULL default 0            |
| `gross_rent`          |                 |                                                   |
| `vacancy_loss`        |                 | dollar loss to vacancy                            |
| `other_income`        |                 |                                                   |
| `total_income`        |                 |                                                   |
| **Expenses**          |                 | all `NUMERIC(14,2)` NOT NULL default 0            |
| `repairs_maintenance` |                 |                                                   |
| `utilities`           |                 |                                                   |
| `property_management` |                 |                                                   |
| `property_taxes`      |                 |                                                   |
| `insurance`           |                 |                                                   |
| `marketing`           |                 |                                                   |
| `administrative`      |                 |                                                   |
| `total_expenses`      |                 |                                                   |
| **Results**           |                 |                                                   |
| `noi`                 | `NUMERIC(14,2)` | net operating income                              |
| `debt_service`        | `NUMERIC(14,2)` |                                                   |
| `cash_flow`           | `NUMERIC(14,2)` |                                                   |
| `occupancy_pct`       | `NUMERIC(5,2)`  | CHECK 0 to 100                                    |
| `source_file`         | `TEXT`          | import metadata                                   |
| `is_demo`             | `BOOLEAN`       | denormalized from parent property via trigger     |
| `created_at`          | `TIMESTAMPTZ`   | default `now()`                                   |
| `updated_at`          | `TIMESTAMPTZ`   | maintained by trigger                             |

Constraints: `UNIQUE (property_id, reporting_month)`; `reporting_month` must be the 1st of the month.
Indexes: `(property_id)`, `(reporting_month)`.

## Triggers

- `set_updated_at()` refreshes `updated_at` on UPDATE (both tables).
- `sync_financials_is_demo()` copies `is_demo` from the parent property on INSERT and when the property changes, so the two flags stay equal.

## Row Level Security

Row-level security is enabled on both tables from migration `002`. No policy grants access to unauthenticated callers beyond the demo rows.

| Action | `properties`                              | `monthly_financials`                              |
|--------|-------------------------------------------|---------------------------------------------------|
| SELECT | `is_demo` OR `user_id = auth.uid()`       | `is_demo` OR parent property owned by caller      |
| INSERT | own, non-demo rows only                   | only for own, non-demo properties                 |
| UPDATE | own, non-demo rows only                   | only for own, non-demo properties                 |
| DELETE | own, non-demo rows only                   | only for own, non-demo properties                 |

Demo rows are seeded by the `postgres` role, which bypasses RLS as the table owner. No client can create or modify them.

## RPC

`get_portfolio_kpis(p_year INTEGER)` runs as SECURITY INVOKER, so RLS applies to the caller. It returns one row:
portfolio value, revenue/expenses/NOI, average occupancy, property count, prior-year revenue/NOI, and
year-over-year variance percentages. Defined in `sql/migrations/003_kpi_function.sql`.

## Demo data

`sql/seeds/001_demo_data.sql` creates 5 demo properties (Los Angeles, San Diego, Denver, Austin and Seattle) with 24 months each, covering 2024 and 2025 (120 rows). The data uses an expense ratio of about 38%, occupancy of about 94% and a 4% rent increase in 2025, so the year-over-year variance KPIs are non-zero. The seed is idempotent and deletes existing demo rows first.

The demo login is `demo@kyletran.dev`, created manually in Supabase Auth.
