# HANDOFF — KT-Portfolio-Dash

_Last updated: 2026-07-22_

## Goal
Migrate the dashboard off the shared `KT-Investments` Supabase project onto a brand-new,
cleanly designed database of its own.

## Done
- Repo reorganized: app in `kt-port/`, prototypes in `legacy/`, v1 SQL archived in `legacy/sql-v1/`, `tables/` holds `models.py` (user-created, empty so far)
- Root `CLAUDE.md` written; schema doc at `kt-port/docs/DATABASE_SCHEMA.md` (v2)
- **New Supabase project `kt-portfolio-dash`** (ref `znugdwuwjwaytvgltcbz`, us-east-1, $10/mo, org kyletristentran)
- v2 schema applied (3 migrations in `kt-port/sql/migrations/`): snake_case `properties` + `monthly_financials`, RLS with no anonymous backdoors, `get_portfolio_kpis` RPC
- Demo data seeded: 5 properties × 24 months (2024–2025)
- Auth users created via SQL: `demo@kyletran.dev` / `demo123` and `kylettra@usc.edu` / `usc1234` (the one shown on the login page)
- `src/lib/database.ts` rewritten for the new schema (snake_case DB ↔ PascalCase component interfaces); build passes
- `.env.local` and Vercel **production** env both point at the new project
- Verified in browser: login with `kylettra@usc.edu` works, Dashboard + Properties tabs render correct seeded KPIs
- Git synced & pushed; Vercel GitHub auto-deploy confirmed working

## Not done / next steps
- Confirm the post-push production deployment succeeded and the live site logs in (env changed → first deploy after push picks it up)
- Old `KT-Investments` project still exists untouched — decide whether to pause/delete it (its data was NOT migrated; this was a clean start)
- `tables/models.py` is empty — user plans to fill it in
- `src/components/auth/AuthContext.tsx` is dead code (real one is `src/contexts/AuthContext.tsx`) — could delete
- A leftover `git stash` exists with content identical to origin's `f281b75` — safe to `git stash drop`

## Key IDs / paths
- Supabase (new): ref `znugdwuwjwaytvgltcbz`, URL `https://znugdwuwjwaytvgltcbz.supabase.co`
- Supabase (old, retired): ref `mmlhkvlrqvizrkkbbuwu` (`KT-Investments`)
- Vercel: project `kt-port`, team `kyletristentrans-projects`, root dir `kt-port`
- GitHub: `kyletristentran/kt-portfolio-dash`

## Blockers (human-only)
- None currently. (Direct-DB password for the new project lives in the Supabase dashboard if DATABASE_URL is ever needed.)
