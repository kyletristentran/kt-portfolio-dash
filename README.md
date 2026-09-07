# kt-portfolio-dash

A real estate portfolio dashboard — property-level financials in, portfolio KPIs
and trend analysis out. Next.js and Supabase, with row-level security so each
owner sees only their own assets and a public demo that shows the product without
an account.

**Live:** [kt-port.vercel.app](https://kt-port.vercel.app) — use the demo login.
The demo tenant is synthetic data seeded from `kt-port/sql/seeds/`; it is not a real portfolio.

## What it does

Track properties and their monthly financials, then read the portfolio back as:

- **Performance overview** — NOI, revenue, operating expenses, vacancy, rolled to portfolio level
- **Portfolio analysis** — contribution and comparison across assets
- **Monthly financials** — the underlying rows, editable, with CSV import
- **Financial trends** — time series by metric
- **Property details** — per-asset drill-down

## Architecture

```
client components
      │
      ▼
/api/* route handlers      ← thin wrappers, no business logic
      │
      ▼
src/lib/database.ts        ← the whole data layer
      │
      ▼
Supabase (Postgres + RLS)
```

Two tables: `properties` and `monthly_financials`, one-to-many, unique on
`(property_id, reporting_month)`.

Portfolio KPIs come from a `get_portfolio_kpis(p_year)` Postgres function running
`SECURITY INVOKER`, so row-level security still applies to the aggregate — the
database enforces tenancy rather than the application layer. Each aggregation
function also has a JS fallback that fetches rows and reduces client-side, so the
dashboard degrades instead of breaking if an RPC is missing.

`database.ts` is the single mapping boundary between snake_case database columns
and the PascalCase interfaces the components consume. Nothing above it knows the
database naming.

### Multi-tenancy and the demo

| Row type | `user_id` | `is_demo` | Who can read | Who can write |
|---|---|---|---|---|
| Demo | `NULL` | `TRUE` | anyone | nobody |
| Real | owner | `FALSE` | owner only | owner only |

A CHECK constraint makes the two states mutually exclusive, and a trigger keeps
`monthly_financials.is_demo` in sync with its parent property. The demo is
world-readable and write-locked at the policy level, so an anonymous visitor
cannot corrupt it no matter what the client does.

Auth runs in two layers: `src/middleware.ts` refreshes the session server-side
via `@supabase/ssr` cookies and handles redirects, and `src/contexts/AuthContext.tsx`
provides client-side state. Idle sessions warn and auto-log-out.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Supabase · Chart.js · Bootstrap 5 · Vercel

## Running it

```bash
cd kt-port
npm install
npm run dev
```

Requires `kt-port/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Apply `sql/migrations/` in numbered order, then `sql/seeds/` for demo data.
Schema notes in `kt-port/docs/DATABASE_SCHEMA.md`.

`npm run build` is the type-check — there is no separate typecheck script and no
test suite.

## Repo layout

| Path | |
|---|---|
| `kt-port/` | the application |
| `kt-port/sql/migrations/` | schema migrations, numbered and applied in order |
| `kt-port/sql/seeds/` | demo tenant seed data |
| `kt-port/docs/` | schema documentation |

## License

MIT
