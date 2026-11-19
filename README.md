# kt-portfolio-dash

A real estate portfolio dashboard. It takes property-level monthly financials and reports portfolio KPIs and trends. The application is built with Next.js and Supabase. Tenancy is defined by row-level security policies in the database, and a public demo tenant shows the product without an account.

## Features

The dashboard tracks properties and their monthly financials and presents them in five views:

- Performance overview: NOI, revenue, operating expenses and vacancy at portfolio level
- Portfolio analysis: contribution and comparison across assets
- Monthly financials: the underlying rows, editable, with CSV import
- Financial trends: time series by metric
- Property details: drill-down for each asset

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

The schema has two tables, `properties` and `monthly_financials`, in a one-to-many relationship with a unique constraint on `(property_id, reporting_month)`.

Portfolio KPIs come from a Postgres function, `get_portfolio_kpis(p_year)`, which runs as `SECURITY INVOKER`. Row-level security therefore applies to the aggregate as well as to the rows, and tenancy is enforced by the database. Each aggregation function also has a JavaScript fallback that fetches the rows and reduces them in the application, so the dashboard still renders if an RPC is missing.

`database.ts` is the only place that maps between the snake_case database columns and the PascalCase interfaces the components use. No code above it depends on the database naming.

### Multi-tenancy and the demo tenant

| Row type | `user_id` | `is_demo` | Read access | Write access |
|---|---|---|---|---|
| Demo | `NULL` | `TRUE` | anyone | nobody |
| Real | owner | `FALSE` | owner only | owner only |

A CHECK constraint makes the two states mutually exclusive, and a trigger keeps `monthly_financials.is_demo` equal to the value on the parent property. The demo rows are readable by everyone and write-locked by policy, so an anonymous visitor cannot change them through any client.

Authentication has two layers. `src/middleware.ts` refreshes the session on the server through `@supabase/ssr` cookies and handles redirects. `src/contexts/AuthContext.tsx` holds the client-side state. Idle sessions receive a warning and are then logged out.

## Known limitations

- The route handlers query through the anonymous client created in `src/lib/database.ts`, so API requests do not carry the caller's session. Under the policies above, those requests can read demo rows only. Passing the session-aware client from `src/lib/supabase/server.ts` into the data layer is the open item.
- There is no test suite.

## Stack

Next.js 15 (App Router), React 19, TypeScript, Supabase, Chart.js, Bootstrap 5 and Vercel.

## Setup

```bash
cd kt-port
npm install
npm run dev
```

The application requires `kt-port/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Apply the files in `kt-port/sql/migrations/` in numbered order, then `kt-port/sql/seeds/` for the demo data. `kt-port/sql/README.md` lists the steps, and `kt-port/docs/DATABASE_SCHEMA.md` documents the schema.

`npm run build` performs the type-check. There is no separate typecheck script.

## Repository layout

| Path | Contents |
|---|---|
| `kt-port/` | The application |
| `kt-port/sql/migrations/` | Schema migrations, numbered and applied in order |
| `kt-port/sql/seeds/` | Seed data for the demo tenant |
| `kt-port/docs/` | Schema documentation and diagrams |
| `tables/models.py` | Pydantic models of the schema, used to generate `kt-port/docs/schema-generated.html` |

## License

MIT
