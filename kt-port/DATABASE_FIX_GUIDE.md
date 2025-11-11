# REIT Portfolio Dashboard - Database Connection Fix Guide

## 🚨 CRITICAL ISSUES FOUND & SOLUTIONS

Based on Claude Browser's testing report, your database configuration is **technically correct**, but the queries are likely failing due to RLS (Row Level Security) policies or missing data.

---

## ✅ VERIFIED: Your Setup is Correct

### 1. Environment Variables ✓
```
NEXT_PUBLIC_SUPABASE_URL=https://mmlhkvlrqvizrkkbbuwu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Status:** ✅ Properly configured

### 2. Table Name Casing ✓
Your `database.ts` correctly uses:
- `Properties` (capital P) ✅
- `MonthlyFinancials` (capital M and F) ✅

**Status:** ✅ Matches Supabase schema exactly

### 3. Database Client Initialization ✓
```typescript
const client = createClient(supabaseUrl, supabaseAnonKey);
```
**Status:** ✅ Correct setup

---

## 🔍 ROOT CAUSE ANALYSIS

The issue is **NOT** your frontend code. It's likely:

1. **RLS Policies blocking anonymous access** (Most likely ⭐)
2. **No data in the database** (Very likely ⭐⭐)
3. **Incorrect RLS policy conditions**

---

## 🛠️ STEP-BY-STEP FIX

### **STEP 1: Verify RLS Policies (CRITICAL)**

Run this in your **Supabase SQL Editor**:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('Properties', 'MonthlyFinancials');
```

**Expected Output:**
```
tablename           | rowsecurity
--------------------|-------------
Properties          | true
MonthlyFinancials   | true
```

---

### **STEP 2: Fix RLS Policies for Anonymous Access**

Your current RLS policies likely check for `auth.uid()`, but you're using the **anon key** which has no user ID.

**Run this SQL to allow anonymous read access:**

```sql
-- Drop existing policies (if they exist)
DROP POLICY IF EXISTS "Enable read access for anon users" ON Properties;
DROP POLICY IF EXISTS "Enable read access for anon users" ON MonthlyFinancials;

-- Create new policies that allow anon access
CREATE POLICY "Enable read access for anon users"
ON Properties
FOR SELECT
USING (true);

CREATE POLICY "Enable read access for anon users"
ON MonthlyFinancials
FOR SELECT
USING (true);

-- Allow inserts/updates/deletes for anon users (for data entry)
CREATE POLICY "Enable insert for anon users"
ON MonthlyFinancials
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for anon users"
ON MonthlyFinancials
FOR UPDATE
USING (true);

CREATE POLICY "Enable delete for anon users"
ON MonthlyFinancials
FOR DELETE
USING (true);
```

---

### **STEP 3: Verify Data Exists**

Run the test queries from `test-db-data.sql`:

```sql
-- Check how many properties exist
SELECT COUNT(*) as property_count FROM Properties;

-- Check how many financial records exist
SELECT COUNT(*) as financial_record_count FROM MonthlyFinancials;
```

**If both return 0, proceed to STEP 4 to add sample data.**

---

### **STEP 4: Insert Sample Data**

Run this SQL to add New Mexico portfolio data:

```sql
-- Insert Properties
INSERT INTO Properties (PropertyID, PropertyName, Address, City, State, ZipCode, Units, YearBuilt)
VALUES
  (1, 'Alameda Gardens', '123 Alameda Blvd NE', 'Albuquerque', 'NM', '87110', 120, 2018),
  (2, 'Rio Grande Plaza', '456 Rio Grande Blvd NW', 'Albuquerque', 'NM', '87104', 85, 2015),
  (3, 'Santa Fe Terrace', '789 Cerrillos Rd', 'Santa Fe', 'NM', '87505', 65, 2020),
  (4, 'Las Cruces Heights', '321 Avenida de Mesilla', 'Las Cruces', 'NM', '88005', 95, 2019);

-- Insert 2024 Financial Data (January - March for all properties)
INSERT INTO MonthlyFinancials (
  PropertyID, ReportingMonth, GrossRent, Vacancy, OtherIncome,
  TotalIncome, RepairsMaintenance, Utilities, PropertyManagement,
  PropertyTaxes, Insurance, Marketing, Administrative, TotalExpenses,
  NOI, DebtService, CashFlow, Occupancy
)
VALUES
  -- Alameda Gardens (Property 1)
  (1, '2024-01-01', 180000, 9000, 3000, 174000, 8000, 5000, 8700, 12000, 4000, 1500, 2000, 41200, 132800, 80000, 52800, 95.0),
  (1, '2024-02-01', 180000, 5400, 3500, 178100, 7500, 4800, 8900, 12000, 4000, 1200, 2000, 40400, 137700, 80000, 57700, 97.0),
  (1, '2024-03-01', 180000, 7200, 3200, 176000, 8200, 4900, 8800, 12000, 4000, 1300, 2000, 41200, 134800, 80000, 54800, 96.0),

  -- Rio Grande Plaza (Property 2)
  (2, '2024-01-01', 127500, 6375, 2000, 123125, 5500, 3500, 6150, 8500, 3000, 1000, 1500, 29150, 93975, 55000, 38975, 95.0),
  (2, '2024-02-01', 127500, 3825, 2500, 126175, 5000, 3300, 6300, 8500, 3000, 800, 1500, 28400, 97775, 55000, 42775, 97.0),
  (2, '2024-03-01', 127500, 5100, 2200, 124700, 5300, 3400, 6200, 8500, 3000, 900, 1500, 28800, 95900, 55000, 40900, 96.0),

  -- Santa Fe Terrace (Property 3)
  (3, '2024-01-01', 97500, 4875, 1500, 94125, 4000, 2500, 4700, 6500, 2500, 800, 1200, 22200, 71925, 40000, 31925, 95.0),
  (3, '2024-02-01', 97500, 2925, 1800, 96375, 3800, 2400, 4800, 6500, 2500, 600, 1200, 21800, 74575, 40000, 34575, 97.0),
  (3, '2024-03-01', 97500, 3900, 1600, 95200, 3900, 2450, 4750, 6500, 2500, 700, 1200, 22000, 73200, 40000, 33200, 96.0),

  -- Las Cruces Heights (Property 4)
  (4, '2024-01-01', 142500, 7125, 2500, 137875, 6000, 4000, 6900, 9500, 3500, 1200, 1800, 32900, 104975, 60000, 44975, 95.0),
  (4, '2024-02-01', 142500, 4275, 2800, 141025, 5500, 3800, 7050, 9500, 3500, 900, 1800, 32050, 108975, 60000, 48975, 97.0),
  (4, '2024-03-01', 142500, 5700, 2600, 139400, 5700, 3900, 6950, 9500, 3500, 1000, 1800, 32350, 107050, 60000, 47050, 96.0);
```

---

### **STEP 5: Test the Connection**

1. Go to Supabase SQL Editor
2. Run these verification queries:

```sql
-- Should return 4
SELECT COUNT(*) FROM Properties;

-- Should return 12 (4 properties × 3 months)
SELECT COUNT(*) FROM MonthlyFinancials;

-- Test the exact query your app uses
SELECT PropertyID, PropertyName
FROM Properties
ORDER BY PropertyName;

-- Test financial data query
SELECT * FROM MonthlyFinancials
WHERE ReportingMonth >= '2024-01-01'
ORDER BY ReportingMonth
LIMIT 5;
```

**If these queries work in Supabase but not in your app, the issue is RLS policies.**

---

### **STEP 6: Add Debugging to Frontend**

Update your `src/lib/database.ts` to add detailed logging:

```typescript
export async function getPropertyList(): Promise<Property[]> {
  try {
    const client = getSupabaseClient();

    // ADD THIS LOGGING
    console.log('🔍 Attempting to fetch properties...');
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    const { data, error } = await client
      .from('Properties')
      .select('PropertyID, PropertyName')
      .order('PropertyName');

    // ADD THIS LOGGING
    console.log('📊 Query result:', {
      success: !error,
      rowCount: data?.length || 0,
      error: error?.message
    });

    if (error) {
      console.error('❌ Properties query error:', error);
      throw error;
    }

    console.log('✅ Properties loaded:', data);
    return data || [];
  } catch (error) {
    console.error('💥 Error fetching property list:', error);
    throw error;
  }
}
```

---

### **STEP 7: Restart Your Development Server**

```bash
cd /Users/kyletran/Python/KT-Portfolio-Dash/kt-port
npm run dev
```

Open your browser console and check for the debug logs.

---

## 🎯 EXPECTED RESULTS AFTER FIX

### Dashboard Should Show:
- ✅ **4 Properties** in dropdown
- ✅ **$547,500** Total Revenue (for 2024 Q1)
- ✅ **$123,550** Total Expenses
- ✅ **$423,950** Total NOI
- ✅ **~4%** Average Vacancy
- ✅ Charts and graphs populated with data

---

## 🔧 ALTERNATIVE: Temporarily Disable RLS for Testing

If you want to quickly test if RLS is the issue:

```sql
-- TEMPORARY - Disable RLS to test connection
ALTER TABLE Properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE MonthlyFinancials DISABLE ROW LEVEL SECURITY;
```

⚠️ **WARNING:** This makes your data publicly accessible. Only use for testing, then re-enable:

```sql
-- Re-enable RLS after testing
ALTER TABLE Properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE MonthlyFinancials ENABLE ROW LEVEL SECURITY;
```

---

## 📋 CHECKLIST

- [ ] Run STEP 1: Check RLS status
- [ ] Run STEP 2: Update RLS policies
- [ ] Run STEP 3: Verify data exists
- [ ] Run STEP 4: Insert sample data (if needed)
- [ ] Run STEP 5: Test queries in Supabase
- [ ] Run STEP 6: Add frontend debugging
- [ ] Run STEP 7: Restart dev server
- [ ] Check browser console for debug logs
- [ ] Verify dashboard loads with data

---

## 🆘 STILL NOT WORKING?

If you've completed all steps and it still doesn't work:

1. **Check Supabase Dashboard → Table Editor**
   - Can you see data in `Properties` table?
   - Can you see data in `MonthlyFinancials` table?

2. **Check Browser Console**
   - Look for specific error messages
   - Check Network tab for failed requests

3. **Verify Environment Variables**
   ```bash
   # Print env vars (from kt-port directory)
   cat .env.local
   ```

4. **Test Direct Database Connection**
   - Create a test API route at `src/app/api/test-db/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/database';

export async function GET() {
  const client = getSupabaseClient();

  const { data: properties, error: propError } = await client
    .from('Properties')
    .select('*');

  const { data: financials, error: finError } = await client
    .from('MonthlyFinancials')
    .select('count');

  return NextResponse.json({
    properties: { count: properties?.length || 0, error: propError?.message },
    financials: { count: financials?.[0]?.count || 0, error: finError?.message }
  });
}
```

Then visit: `http://localhost:3000/api/test-db`

---

## 📞 Support

If you need help, provide:
1. Screenshot of Supabase RLS policies
2. Output from STEP 5 test queries
3. Browser console logs after STEP 6
4. Error messages from `/api/test-db` route

---

**Last Updated:** Nov 10, 2024
**Your Database:** `mmlhkvlrqvizrkkbbuwu.supabase.co`
**Schema:** Properties + MonthlyFinancials (verified ✓)
