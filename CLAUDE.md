# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

- **`kt-port/`** — the actual project: a Next.js real-estate portfolio dashboard backed by Supabase. All commands run from here.
- **`legacy/`** — pre-Next.js prototypes (static HTML dashboards, a Streamlit app). Do not develop here.

## Commands

```bash
cd kt-port
npm run dev      # dev server (Turbopack) on http://localhost:3000
npm run build    # production build — use this to type-check; there is no separate typecheck script
npm run lint     # eslint (next lint)
```

There is no test suite. Deployment is Vercel (`vercel.json`, project linked via `kt-port/.vercel/`).

Requires `kt-port/.env.local` (gitignored) with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Architecture

Next.js 15 App Router + React 19, styled with **Bootstrap 5** (not Tailwind, despite it being in devDependencies) and charted with Chart.js via `react-chartjs-2`.

Data flow: client components → `/api/*` route handlers → `src/lib/database.ts` → Supabase.

- **`src/lib/database.ts`** is the data layer: a singleton Supabase client plus all query/aggregation functions (KPIs, monthly performance, property details). Several functions try a Postgres RPC first (e.g. `get_portfolio_kpis`) and fall back to fetching rows and aggregating in JS — the RPCs may not exist in the database, so the fallbacks are load-bearing.
- **API routes** in `src/app/api/` (dashboard KPIs, financials CRUD, properties, connection/auth tests) are thin wrappers around `database.ts`.
- **Dashboard UI** in `src/components/dashboard/` — `Dashboard.tsx` is the shell that switches between tab views (PerformanceOverview, PortfolioAnalysis, MonthlyFinancials, FinancialTrends, PropertyDetails, DataManagement). CSV import uses papaparse.

### Auth (two layers)

1. **`src/middleware.ts`** — server-side session refresh via `@supabase/ssr` cookies; redirects unauthenticated requests to `/login` and authenticated users away from `/login`/`/signup`.
2. **`src/contexts/AuthContext.tsx`** — the client-side auth provider wired into `src/app/layout.tsx`. ⚠️ `src/components/auth/AuthContext.tsx` is a **dead duplicate** — nothing imports it; don't edit it by mistake.

Demo mode: a demo user (`demo@kyletran.dev`) sees seeded rows flagged `is_demo = TRUE`; RLS policies isolate real users' data by `user_id`. `src/components/auth/` also holds `DemoLoginButton` and `InactivityWarning` (auto-logout).

## Database

Schema outline: **`kt-port/docs/DATABASE_SCHEMA.md`**. Migration/seed run order: **`kt-port/sql/README.md`**.

- Two tables: `properties` and `monthlyfinancials` (FK `propertyid`, unique per `(propertyid, reportingmonth)`).
- **All table/column names are lowercase** — the DDL was written PascalCase but Postgres folds unquoted identifiers, so queries must use `monthlyfinancials`, `totalincome`, `reportingmonth`, etc.
- SQL is organized under `kt-port/sql/`: `schema/` (base DDL), `migrations/` (numbered; run `01_add_user_id_column.sql` before `02_enable_rls.sql`), `seeds/`, `scripts/` (diagnostics). Scripts are run manually in the Supabase SQL editor — there is no migration tooling.
- The current RLS policies contain temporary `OR auth.uid() IS NULL` clauses that allow unauthenticated access; these are flagged for removal in production.
