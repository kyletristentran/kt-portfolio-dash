# SQL Migrations & Demo Data Setup

This directory contains SQL scripts for setting up demo data isolation and Row Level Security (RLS) for the Kyle Tran Portfolio Dashboard.

## Quick Start

Run these scripts **in order** in your Supabase SQL Editor:

### 1. Add user_id column (prerequisite for RLS)
```sql
ALTER TABLE properties ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
```

### 2. Add demo flags
```bash
# File: migrations/add_demo_flags.sql
```
Adds `is_demo` boolean column to isolate demo data from production data.

### 3. Seed demo data
```bash
# File: seed_demo_data.sql
```
Creates 5 sample properties with 12 months of financial data.

### 4. Enable RLS
```bash
# File: migrations/enable_rls.sql
```
Enables Row Level Security and creates access policies.

### 5. Create demo user
In Supabase Dashboard → Authentication → Users:
- Email: `demo@kyletran.dev`
- Password: `demo123`
- Auto-confirm: Yes

## Files

### `migrations/add_demo_flags.sql`
**Purpose:** Add data isolation flags to tables

**What it does:**
- Adds `is_demo` column to `properties` table
- Adds `is_demo` column to `monthlyfinancials` table
- Creates indexes for performance
- Creates views for filtering demo vs production data

**When to run:** Before seeding demo data

**Idempotent:** Yes (safe to run multiple times)

---

### `seed_demo_data.sql`
**Purpose:** Generate realistic demo portfolio data

**What it creates:**
- 5 demo properties in different cities:
  - Sunset Towers (LA) - 48 units
  - Harbor View (SD) - 36 units
  - Mountain Peak (Denver) - 24 units
  - Riverside Commons (Austin) - 60 units
  - Metro Heights (Seattle) - 42 units
- 60 financial records (12 months × 5 properties)
- Realistic ratios:
  - Rent: $1,500-2,000/unit/month
  - Occupancy: 92-98%
  - Expense ratios: 35-45% of revenue
  - NOI margins: 55-65%

**When to run:** After `add_demo_flags.sql`

**Idempotent:** No (will create duplicate data if run twice)

**To reset demo data:**
```sql
DELETE FROM monthlyfinancials WHERE is_demo = TRUE;
DELETE FROM properties WHERE is_demo = TRUE;
-- Then re-run seed_demo_data.sql
```

---

### `migrations/enable_rls.sql`
**Purpose:** Enable Row Level Security for multi-tenant data isolation

**What it does:**
- Enables RLS on `properties` and `monthlyfinancials` tables
- Creates 10 RLS policies:

  **For Properties:**
  - `"Users can view demo properties"` - Everyone can read demo data
  - `"Users can view their own properties"` - Users see their own data
  - `"Users can insert their own properties"` - Users can create properties
  - `"Users can update their own properties"` - Users can edit their properties
  - `"Users can delete their own properties"` - Users can delete their properties

  **For MonthlyFinancials:**
  - `"Users can view demo financials"` - Everyone can read demo data
  - `"Users can view their own financials"` - Users see financials for their properties
  - `"Users can insert their own financials"` - Users can add financial data
  - `"Users can update their own financials"` - Users can edit financial data
  - `"Users can delete their own financials"` - Users can delete financial data

- Creates helper functions:
  - `is_property_owner(prop_id)` - Check property ownership
  - `get_accessible_properties()` - Get all accessible properties for current user

- Grants permissions to `authenticated` and `anon` roles

**When to run:** After seeding demo data and creating demo user

**Idempotent:** Yes (drops existing policies before creating)

**⚠️ Important:** Contains temporary `OR auth.uid() IS NULL` conditions that allow unauthenticated access. Remove these in production!

---

## Migration Order

```
1. user_id column ────→ 2. add_demo_flags.sql ────→ 3. seed_demo_data.sql
                                                              │
                                                              ↓
                        5. Create demo user ←──── 4. enable_rls.sql
```

## Verification Queries

### Check if migrations applied successfully

```sql
-- 1. Check is_demo columns exist
SELECT column_name, table_name
FROM information_schema.columns
WHERE column_name = 'is_demo'
AND table_schema = 'public';
-- Should return 2 rows

-- 2. Check demo data exists
SELECT
    (SELECT COUNT(*) FROM properties WHERE is_demo = TRUE) as demo_properties,
    (SELECT COUNT(*) FROM monthlyfinancials WHERE is_demo = TRUE) as demo_financials;
-- Should return: demo_properties=5, demo_financials=60

-- 3. Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('properties', 'monthlyfinancials');
-- Should show rowsecurity = true

-- 4. Check policies exist
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
-- Should return 10 policies
```

### Test RLS policies

```sql
-- As anonymous user (should only see demo data)
SET LOCAL role TO anon;
SELECT COUNT(*) as visible_properties FROM properties;
-- Should equal number of demo properties (5)
RESET role;

-- As demo user (after creating auth user)
-- Use Supabase client to test, RLS enforces based on JWT token
```

## Rollback Instructions

### Remove RLS
```sql
-- Disable RLS
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE monthlyfinancials DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "Users can view demo properties" ON properties;
DROP POLICY IF EXISTS "Users can view their own properties" ON properties;
DROP POLICY IF EXISTS "Users can insert their own properties" ON properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON properties;
DROP POLICY IF EXISTS "Users can view demo financials" ON monthlyfinancials;
DROP POLICY IF EXISTS "Users can view their own financials" ON monthlyfinancials;
DROP POLICY IF EXISTS "Users can insert their own financials" ON monthlyfinancials;
DROP POLICY IF EXISTS "Users can update their own financials" ON monthlyfinancials;
DROP POLICY IF EXISTS "Users can delete their own financials" ON monthlyfinancials;

-- Drop helper functions
DROP FUNCTION IF EXISTS is_property_owner(INTEGER);
DROP FUNCTION IF EXISTS get_accessible_properties();
```

### Remove demo data
```sql
DELETE FROM monthlyfinancials WHERE is_demo = TRUE;
DELETE FROM properties WHERE is_demo = TRUE;
```

### Remove demo flags
```sql
-- Drop views
DROP VIEW IF EXISTS production_properties;
DROP VIEW IF EXISTS demo_properties;
DROP VIEW IF EXISTS production_monthlyfinancials;
DROP VIEW IF EXISTS demo_monthlyfinancials;

-- Drop indexes
DROP INDEX IF EXISTS idx_properties_is_demo;
DROP INDEX IF EXISTS idx_monthlyfinancials_is_demo;

-- Drop columns
ALTER TABLE properties DROP COLUMN IF EXISTS is_demo;
ALTER TABLE monthlyfinancials DROP COLUMN IF EXISTS is_demo;
```

### Remove user_id column
```sql
DROP INDEX IF EXISTS idx_properties_user_id;
ALTER TABLE properties DROP COLUMN IF EXISTS user_id;
```

## Production Deployment

### Before deploying to production:

1. **Remove temporary access policies:**
   - Edit `enable_rls.sql` to remove `OR auth.uid() IS NULL` conditions
   - Re-run the modified script

2. **Verify all production data has user_id set:**
   ```sql
   SELECT COUNT(*) FROM properties WHERE user_id IS NULL AND is_demo = FALSE;
   -- Should return 0
   ```

3. **Test RLS enforcement:**
   - Create a test user
   - Create test properties owned by that user
   - Verify they can only see their own data + demo data

4. **Set up user registration flow:**
   - Update frontend to use Supabase Auth
   - Implement proper session management
   - Add auth middleware to protect routes

## Support

For detailed setup instructions, see [DEMO_SETUP.md](../DEMO_SETUP.md)

For Supabase RLS documentation: https://supabase.com/docs/guides/auth/row-level-security
