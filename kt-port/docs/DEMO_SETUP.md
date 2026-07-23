# Demo Data & Row Level Security Setup Guide

This guide walks you through setting up demo data isolation and the demo user for the Kyle Tran Portfolio Dashboard.

## Overview

The demo system uses:
- **`is_demo` flag** to isolate demo data from production data
- **Row Level Security (RLS)** to enforce access control
- **Demo auth user** (demo@kyletran.dev) with read-only access to demo data
- **Real users** with full CRUD access to their own data

## Prerequisites

- Access to Supabase Dashboard: https://app.supabase.com
- Your project's Supabase credentials configured in `.env.local`
- SQL Editor access in Supabase Dashboard

---

## Step 1: Add `user_id` Column to Properties Table

Before enabling RLS, we need to add a `user_id` column to link properties to their owners.

```sql
-- Add user_id column to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);

-- Add comment for documentation
COMMENT ON COLUMN properties.user_id IS 'Foreign key to auth.users. NULL for demo properties.';
```

**How to run:**
1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Paste the SQL above
4. Click "Run" or press `Ctrl/Cmd + Enter`

---

## Step 2: Apply Migration - Add Demo Flags

This migration adds the `is_demo` boolean flag to isolate demo data.

**File:** `sql/migrations/add_demo_flags.sql`

**How to run:**
1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy the entire contents of `sql/migrations/add_demo_flags.sql`
4. Paste into the SQL Editor
5. Click "Run"

**What it does:**
- Adds `is_demo` column to `properties` and `monthlyfinancials` tables
- Creates indexes for query performance
- Creates views for filtering demo vs production data

**Verification:**
```sql
-- Check if columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name IN ('properties', 'monthlyfinancials')
AND column_name = 'is_demo';

-- Should return 2 rows (one for each table)
```

---

## Step 3: Seed Demo Data

This script creates 5 realistic demo properties with 12 months of financial data.

**File:** `sql/seed_demo_data.sql`

**How to run:**
1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy the entire contents of `sql/seed_demo_data.sql`
4. Paste into the SQL Editor
5. Click "Run"

**What it creates:**
- 5 demo properties in different cities:
  - Sunset Towers Apartments (Los Angeles, CA) - 48 units
  - Harbor View Residences (San Diego, CA) - 36 units
  - Mountain Peak Lofts (Denver, CO) - 24 units
  - Riverside Commons (Austin, TX) - 60 units
  - Metro Heights Plaza (Seattle, WA) - 42 units
- 12 months of financial data for each property (60 total records)
- Realistic financials with variance and occupancy rates

**Verification:**
```sql
-- Check demo properties
SELECT propertyname, city, state, units, is_demo
FROM properties
WHERE is_demo = TRUE;

-- Should return 5 properties

-- Check demo financials
SELECT COUNT(*) as demo_financial_count
FROM monthlyfinancials
WHERE is_demo = TRUE;

-- Should return 60 (5 properties × 12 months)
```

---

## Step 4: Enable Row Level Security (RLS)

This migration enables RLS and creates policies for data isolation.

**File:** `sql/migrations/enable_rls.sql`

**⚠️ IMPORTANT:** Before running this migration, ensure:
1. You have created the demo user (see Step 5)
2. All existing production data has `is_demo = FALSE`
3. All demo data has `is_demo = TRUE`

**How to run:**
1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy the entire contents of `sql/migrations/enable_rls.sql`
4. Paste into the SQL Editor
5. Click "Run"

**What it does:**
- Enables RLS on `properties` and `monthlyfinancials` tables
- Creates policies for:
  - **Demo users:** Read-only access to `is_demo = TRUE` rows
  - **Authenticated users:** Full CRUD access to their own data (`user_id = auth.uid()`)
  - **Temporary:** Allows unauthenticated access (remove in production)

**Verification:**
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('properties', 'monthlyfinancials');

-- Should show rowsecurity = true for both tables

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('properties', 'monthlyfinancials');

-- Should return multiple policies
```

---

## Step 5: Create Demo Auth User

The demo user account must be created in Supabase Auth.

### Option A: Using Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Fill in the form:
   - **Email:** `demo@kyletran.dev`
   - **Password:** `demo123`
   - **Auto Confirm User:** ✅ Check this box
4. Click "Create user"

### Option B: Using Supabase Admin API

If you prefer to use the API, you can create the user via the Admin API:

```bash
curl -X POST 'https://your-project.supabase.co/auth/v1/admin/users' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@kyletran.dev",
    "password": "demo123",
    "email_confirm": true,
    "user_metadata": {
      "name": "Demo User",
      "is_demo": true
    }
  }'
```

**⚠️ Security Note:** The service role key should NEVER be exposed in client-side code. Only use it in secure server environments.

### Option C: Using Supabase CLI

```bash
supabase auth signup --email demo@kyletran.dev --password demo123
```

**Verification:**
1. Go to Supabase Dashboard → Authentication → Users
2. You should see `demo@kyletran.dev` in the user list
3. The email should be marked as "Confirmed"

---

## Step 6: Test Demo Login

### Test in the Application

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the login page: http://localhost:3000/login

3. Click the "Login as Demo" button

4. You should be:
   - Logged in successfully
   - Redirected to the dashboard
   - See only demo properties and financials

### Test with Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Test demo login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'demo@kyletran.dev',
  password: 'demo123',
});

console.log('Login result:', { data, error });

// Test demo data access
const { data: properties, error: propError } = await supabase
  .from('properties')
  .select('*');

console.log('Demo user sees properties:', properties);
// Should only see properties where is_demo = TRUE
```

---

## Step 7: Production Checklist

Before deploying to production:

### ✅ Remove Temporary Access Policies

The RLS policies include `OR auth.uid() IS NULL` conditions that allow unauthenticated access. **Remove these in production:**

```sql
-- Update the policies to remove unauthenticated access
DROP POLICY IF EXISTS "Users can view their own properties" ON properties;
DROP POLICY IF EXISTS "Users can view their own financials" ON monthlyfinancials;

-- Recreate without unauthenticated access
CREATE POLICY "Users can view their own properties"
ON properties
FOR SELECT
USING (
    is_demo = FALSE
    AND user_id = auth.uid()
);

CREATE POLICY "Users can view their own financials"
ON monthlyfinancials
FOR SELECT
USING (
    is_demo = FALSE
    AND EXISTS (
        SELECT 1 FROM properties
        WHERE properties.propertyid = monthlyfinancials.propertyid
        AND properties.user_id = auth.uid()
    )
);
```

### ✅ Verify All Production Data is Marked

```sql
-- Check for any properties without user_id (except demo)
SELECT propertyid, propertyname, user_id, is_demo
FROM properties
WHERE user_id IS NULL AND is_demo = FALSE;

-- Should return 0 rows
```

### ✅ Test RLS Enforcement

```sql
-- Test as anonymous user (should only see demo data)
SET LOCAL role TO anon;
SELECT COUNT(*) FROM properties; -- Should only count is_demo = TRUE

-- Test as authenticated user
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "some-user-id"}';
SELECT COUNT(*) FROM properties; -- Should see demo + their own

-- Reset
RESET role;
```

---

## Troubleshooting

### Issue: Can't log in with demo user

**Solution:**
- Verify the user exists in Supabase Dashboard → Authentication → Users
- Check that email is confirmed
- Ensure correct credentials: `demo@kyletran.dev` / `demo123`

### Issue: Demo user sees no data

**Solution:**
```sql
-- Verify demo data exists
SELECT COUNT(*) FROM properties WHERE is_demo = TRUE;
SELECT COUNT(*) FROM monthlyfinancials WHERE is_demo = TRUE;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'properties';
```

### Issue: RLS blocks all access

**Solution:**
```sql
-- Temporarily disable RLS for debugging
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE monthlyfinancials DISABLE ROW LEVEL SECURITY;

-- Test queries
-- Then re-enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthlyfinancials ENABLE ROW LEVEL SECURITY;
```

### Issue: Production users can't see their data

**Solution:**
- Ensure `user_id` column is set correctly on properties
- Verify the user is authenticated (`auth.uid()` returns their ID)
- Check that `is_demo = FALSE` for their properties

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────┐  ┌──────────────────────────┐  │
│  │   properties table      │  │  monthlyfinancials       │  │
│  ├─────────────────────────┤  ├──────────────────────────┤  │
│  │ propertyid (PK)         │  │ financialid (PK)         │  │
│  │ propertyname            │  │ propertyid (FK)          │  │
│  │ user_id (FK to auth)    │  │ reportingmonth           │  │
│  │ is_demo (boolean)       │  │ is_demo (boolean)        │  │
│  │ ...other fields         │  │ ...financial fields      │  │
│  └─────────────────────────┘  └──────────────────────────┘  │
│                                                               │
│  RLS Policies:                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Demo Properties: is_demo = TRUE → Everyone can read   │  │
│  │ User Properties: user_id = auth.uid() → Full CRUD     │  │
│  │ Demo Financials: is_demo = TRUE → Everyone can read   │  │
│  │ User Financials: via property ownership → Full CRUD   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
                              │ Authenticated queries
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                             │
  ┌─────▼──────┐                            ┌────────▼────────┐
  │ Demo User  │                            │  Real User      │
  │ (demo@...) │                            │  (their email)  │
  ├────────────┤                            ├─────────────────┤
  │ READ ONLY  │                            │  Full CRUD      │
  │ Demo data  │                            │  Their data +   │
  │ only       │                            │  Demo data      │
  └────────────┘                            └─────────────────┘
```

---

## Next Steps

After completing this setup:

1. **Test the demo login** thoroughly
2. **Update your AuthContext** to use Supabase Auth instead of localStorage
3. **Add user registration** flow for real users
4. **Implement auth middleware** to protect routes
5. **Remove demo credentials** from the UI before public release (or keep for recruiters)

---

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js with Supabase](https://supabase.com/docs/guides/auth/server-side/nextjs)
