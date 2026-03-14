# Database Setup Guide for Logisphere

## Issue: "Unable to create the company workspace"

This error occurs when the database tables don't exist or RLS policies are not configured properly.

---

## Solution: Run Database Migrations

### Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your **Logisphere project**
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Copy and Execute the Migration

1. Open the file: `/migrations/001_initial_schema.sql`
2. Copy **ALL** the SQL code
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or Ctrl+Enter)

**Expected Result:** All queries execute without errors. You should see:
- ✅ Extensions created
- ✅ Enums created
- ✅ Tables created
- ✅ Indexes created
- ✅ RLS enabled
- ✅ Policies created

---

## Step 3: Verify Tables Were Created

In Supabase:
1. Go to **Table Editor**
2. You should see these tables:
   - `companies`
   - `profiles`
   - `regions`
   - `business_units`
   - `facilities`
   - `carriers`
   - `contracts`
   - `rates`
   - `shipments`
   - `invoices`
   - `activity_logs`

---

## Step 4: Test Onboarding

1. Go to `http://localhost:3000/auth`
2. Create a new account
3. Navigate to `http://localhost:3000/onboarding`
4. Fill out the form:
   - Your name: `John Smith`
   - Job title: `Operations Manager`
   - Company name: `Sample Logistics`
   - Primary region: `North America`
   - Business unit: `Operations`
   - Headquarters facility: `Chicago Hub`
   - Facility code: `CHI-HQ` (optional)
   - City: `Chicago` (optional)
   - Country: `United States` (optional)
5. Click **Create Workspace**

You should now see:
- ✅ A success redirect to `/dashboard`
- ✅ Console logs showing successful creation with IDs
- ✅ No error messages

---

## Troubleshooting

### If you still see "Unable to create the company workspace"

**Check the browser console (F12) for detailed errors:**

Look for messages like:
- `❌ Company creation failed: [error details]`
- `❌ Region creation failed: [error details]`
- `❌ Business unit creation failed: [error details]`
- `❌ Facility creation failed: [error details]`

**Common Issues:**

1. **Table doesn't exist**
   - Run the migration again
   - Check SQL Editor for execution errors

2. **RLS policy blocking insert**
   - Ensure you're logged in (authenticated)
   - Check Supabase RLS policies are created
   - Try disabling RLS temporarily (in Supabase):
     ```sql
     ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
     ```
     Then test. If it works, RLS is the issue.

3. **Missing columns in table**
   - Compare table schema in Supabase with `database-structure.md`
   - Add missing columns manually in Supabase UI or via SQL

4. **Foreign key constraint violation**
   - Ensure auth.users exists for the current user
   - Check that company_id is a valid UUID

---

## Step 5: Optional - Seed Initial Data

Once tables are created, optionally seed some test data:

```sql
-- Insert a test carrier
INSERT INTO carriers (name, code, status)
VALUES ('FedEx', 'FEDEX', 'active');

INSERT INTO carriers (name, code, status)
VALUES ('UPS', 'UPS', 'active');

INSERT INTO carriers (name, code, status)
VALUES ('XPO', 'XPO', 'active');
```

---

## Production Deployment

When deploying to production:

1. Run migrations on production Supabase project
2. Verify all tables exist
3. Test onboarding with a test account
4. Monitor error logs during launch

---

## Key Tables Explained

| Table | Purpose |
|-------|---------|
| `companies` | Tenants/organizations |
| `profiles` | User profiles linked to auth.users |
| `regions` | Geographic regions within a company |
| `business_units` | Business divisions |
| `facilities` | Warehouses, distribution centers, offices |
| `shipments` | Freight shipments being tracked |
| `invoices` | Carrier invoices for auditing |
| `carriers` | Carrier/transportation provider master data |
| `activity_logs` | Audit trail of all user actions |

---

## Row Level Security (RLS)

RLS ensures users only see their company's data:

- `profiles`: Users see their own profile + company members' profiles
- `regions`: Users see regions for their company
- `facilities`: Users see facilities for their company
- `shipments`: Users see shipments for their company
- `invoices`: Users see invoices for their company

**RLS is enabled but allowing inserts during onboarding for new users.**

---

## Need Help?

Check:
1. Supabase logs for database errors
2. Browser console (F12) for client-side errors
3. Ensure Supabase project is running and accessible
4. Verify your auth token is valid
