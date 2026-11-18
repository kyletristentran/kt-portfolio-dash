# SQL (v2 schema)

Schema for the dedicated Supabase project.

Run the files in this order, as `postgres`, in the Supabase SQL editor or through MCP `apply_migration`:

1. `migrations/001_initial_schema.sql`: `properties` and `monthly_financials`, with triggers
2. `migrations/002_rls_policies.sql`: row-level security (demo rows readable by everyone, real rows by their owner only)
3. `migrations/003_kpi_function.sql`: the `get_portfolio_kpis(p_year)` RPC
4. `seeds/001_demo_data.sql`: 5 demo properties with 24 months each (idempotent)
5. In the Supabase Dashboard, under Authentication > Users, create the demo user (`demo@kyletran.dev`)

Design notes:

- All identifiers are snake_case. There are no quoted or PascalCase identifiers.
- Demo rows have `is_demo = TRUE` and `user_id IS NULL`, enforced by a CHECK constraint. Everyone can read them and no client can write them. Only the `postgres` role can seed them.
- `monthly_financials.is_demo` is denormalized from the parent property by a trigger.
- No policy contains an `OR auth.uid() IS NULL` exception, so unauthenticated clients see demo data only.

Schema reference: [`docs/DATABASE_SCHEMA.md`](../docs/DATABASE_SCHEMA.md)
