# SQL — v2 schema

Clean-slate schema for the dedicated Supabase project (the v1 SQL that ran against the old
shared project is archived in [`legacy/sql-v1/`](../../legacy/sql-v1/) at the repo root).

Run order (Supabase SQL editor or MCP `apply_migration`, as `postgres`):

1. `migrations/001_initial_schema.sql` — `properties` + `monthly_financials`, triggers
2. `migrations/002_rls_policies.sql` — RLS (demo rows world-readable, real rows owner-only)
3. `migrations/003_kpi_function.sql` — `get_portfolio_kpis(p_year)` RPC
4. `seeds/001_demo_data.sql` — 5 demo properties × 24 months (idempotent)
5. Supabase Dashboard → Authentication → Users: create the demo user (`demo@kyletran.dev`)

Design notes:

- Everything snake_case — no quoted/PascalCase identifiers (see v1's `fix-table-case.sql` for why).
- Demo rows: `is_demo = TRUE`, `user_id IS NULL`, enforced by a CHECK; readable by everyone, writable by no one (only the `postgres` role can seed them).
- `monthly_financials.is_demo` is denormalized from the parent property via trigger.
- No `OR auth.uid() IS NULL` escape hatches — unauthenticated clients see demo data only.

Schema reference: [`docs/DATABASE_SCHEMA.md`](../docs/DATABASE_SCHEMA.md)
