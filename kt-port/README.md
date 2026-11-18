# kt-port

The Next.js application for [kt-portfolio-dash](../README.md). The repository README covers the architecture, the tenancy model and the setup steps.

## Commands

```bash
npm install
npm run dev      # development server on http://localhost:3000
npm run build    # production build, including the type-check
npm run lint     # ESLint
```

The application reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env.local`.

## Directory layout

| Path | Contents |
|---|---|
| `src/app/` | Pages and `/api/*` route handlers |
| `src/components/` | Dashboard, layout and authentication components |
| `src/contexts/AuthContext.tsx` | Client-side session state |
| `src/lib/database.ts` | Data layer: all queries and the column-name mapping |
| `src/lib/supabase/` | Browser and server Supabase clients |
| `src/middleware.ts` | Session refresh and redirects |
| `sql/` | Migrations and demo seed data, with the run order in `sql/README.md` |
| `docs/` | Schema reference and diagrams |
