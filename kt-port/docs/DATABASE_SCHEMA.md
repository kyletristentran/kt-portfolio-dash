# Database Schema

Supabase (PostgreSQL) schema for the KT Portfolio Dashboard. Canonical DDL lives in
[`sql/schema/reset-schema.sql`](../sql/schema/reset-schema.sql) plus the migrations in
[`sql/migrations/`](../sql/migrations/) — this document is the human-readable outline.

> **Casing note:** the DDL was written with PascalCase identifiers (`Properties`, `GrossRent`),
> but PostgreSQL folds unquoted identifiers to lowercase. The **actual** table/column names are
> all-lowercase (`properties`, `grossrent`), and that is what the app queries
> (`.from('monthlyfinancials').select('totalincome, ...')`).
> `sql/scripts/fix-table-case.sql` exists to create PascalCase views if ever needed.

## Entity overview

```
auth.users (Supabase Auth)
    │ user_id (UUID, nullable)
    ▼
properties 1 ──── * monthlyfinancials
                    (propertyid FK, UNIQUE (propertyid, reportingmonth))
```

## `properties`

One row per property in the portfolio.

| Column          | Type            | Notes                                                        |
|-----------------|-----------------|--------------------------------------------------------------|
| `propertyid`    | `INT` **PK**    | Manually assigned (not serial)                               |
| `propertyname`  | `VARCHAR(255)`  | NOT NULL                                                     |
| `address`       | `VARCHAR(500)`  |                                                              |
| `city`          | `VARCHAR(100)`  |                                                              |
| `state`         | `VARCHAR(50)`   |                                                              |
| `zipcode`       | `VARCHAR(20)`   |                                                              |
| `units`         | `INT`           |                                                              |
| `yearbuilt`     | `INT`           |                                                              |
| `purchaseprice` | `DECIMAL(12,2)` | Added by `sql/migrations/add_purchase_price.sql`, default 0  |
| `user_id`       | `UUID`          | FK → `auth.users(id)`; NULL for demo data. Added by `01_add_user_id_column.sql` |
| `is_demo`       | `BOOLEAN`       | Demo-data isolation flag, default FALSE. Added by `add_demo_flags.sql` |
| `dateadded`     | `TIMESTAMP`     | Default `CURRENT_TIMESTAMP`                                  |

Indexes: `idx_properties_user_id (user_id)`, `idx_properties_is_demo (is_demo)`.

## `monthlyfinancials`

One row per property per reporting month.

| Column               | Type            | Notes                                   |
|----------------------|-----------------|-----------------------------------------|
| `financialid`        | `SERIAL` **PK** |                                         |
| `propertyid`         | `INT`           | FK → `properties(propertyid)`, NOT NULL |
| `reportingmonth`     | `DATE`          | NOT NULL                                |
| **Income**           |                 |                                         |
| `grossrent`          | `DECIMAL(12,2)` | default 0                               |
| `vacancy`            | `DECIMAL(12,2)` | dollar amount (loss), default 0         |
| `otherincome`        | `DECIMAL(12,2)` | default 0                               |
| `totalincome`        | `DECIMAL(12,2)` | default 0                               |
| **Expenses**         |                 |                                         |
| `repairsmaintenance` | `DECIMAL(12,2)` | default 0                               |
| `utilities`          | `DECIMAL(12,2)` | default 0                               |
| `propertymanagement` | `DECIMAL(12,2)` | default 0                               |
| `propertytaxes`      | `DECIMAL(12,2)` | default 0                               |
| `insurance`          | `DECIMAL(12,2)` | default 0                               |
| `marketing`          | `DECIMAL(12,2)` | default 0                               |
| `administrative`     | `DECIMAL(12,2)` | default 0                               |
| `totalexpenses`      | `DECIMAL(12,2)` | default 0                               |
| **Calculated**       |                 |                                         |
| `noi`                | `DECIMAL(12,2)` | Net operating income, default 0         |
| `debtservice`        | `DECIMAL(12,2)` | default 0                               |
| `cashflow`           | `DECIMAL(12,2)` | default 0                               |
| **Other**            |                 |                                         |
| `occupancy`          | `DECIMAL(5,2)`  | percentage, default 0                   |
| `is_demo`            | `BOOLEAN`       | default FALSE (`add_demo_flags.sql`)    |
| `filepath`           | `VARCHAR(500)`  | source-file metadata                    |
| `datecreated`        | `TIMESTAMP`     | default `CURRENT_TIMESTAMP`             |
| `datemodified`       | `TIMESTAMP`     | default `CURRENT_TIMESTAMP`             |

Constraints: `UNIQUE (propertyid, reportingmonth)` — prevents duplicate months per property.
Indexes: `(propertyid)`, `(reportingmonth)`, `idx_monthlyfinancials_is_demo (is_demo)`.

## Views

Created by `sql/migrations/add_demo_flags.sql`:

- `production_properties` / `production_monthlyfinancials` — rows where `is_demo = FALSE`
- `demo_properties` / `demo_monthlyfinancials` — rows where `is_demo = TRUE`

## Row Level Security

Enabled on both tables by `sql/migrations/02_enable_rls.sql` (run `01_add_user_id_column.sql` first).
10 policies total, same pattern on each table:

- **View demo rows** — anyone can `SELECT` rows with `is_demo = TRUE`
- **View own rows** — `SELECT` where `user_id = auth.uid()` (⚠️ currently also `OR auth.uid() IS NULL` — a temporary unauthenticated allowance to **remove in production**)
- **Insert / Update / Delete own rows** — non-demo rows owned by `auth.uid()` only

Helper functions: `is_property_owner(prop_id)`, `get_accessible_properties()`.

## RPC

The app calls `get_portfolio_kpis(p_year)` via `supabase.rpc()` in `src/lib/database.ts` and
falls back to client-side aggregation when the function doesn't exist. There is no DDL for it
in this repo — if it exists, it was created directly in the Supabase SQL editor.

## Migration order (fresh database)

1. `sql/schema/reset-schema.sql` — drop + recreate base tables (legacy permissive RLS included)
2. `sql/migrations/add_purchase_price.sql` — `purchaseprice` column + backfill
3. `sql/migrations/01_add_user_id_column.sql` — `user_id` column
4. `sql/migrations/add_demo_flags.sql` — `is_demo` columns, indexes, views
5. `sql/seeds/seed_demo_data.sql` — 5 demo properties × 12 months
6. `sql/migrations/02_enable_rls.sql` — owner/demo RLS policies (replaces the legacy ones)
7. Create the demo auth user (`demo@kyletran.dev`) — see [`sql/README.md`](../sql/README.md)

Optional seeds for a realistic portfolio: `sql/seeds/sample-data-new-mexico.sql` (9 NM
properties + financials) or `insert-properties-only.sql` + `insert-remaining-financials.sql`.
Diagnostics live in `sql/scripts/`.
