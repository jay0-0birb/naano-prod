# Troubleshooting 500 Errors

## Problem
Getting 500 Internal Server Error when loading the dashboard, specifically on `/dashboard/finances` or other pages.

## Root Cause
The new BP1.md payment system requires database tables and functions that haven't been created yet.

## Solution

### Step 1: Run Database Migrations

You need to run the SQL migrations in Supabase:

1. **Open Supabase Dashboard** → Your project → SQL Editor

2. **Run these migrations in order:**

   ```sql
   -- 1. First, run the main payment system schema
   -- File: supabase/bp1-payment-system.sql
   ```

   ```sql
   -- 2. Then, run the billing and payout functions
   -- File: supabase/bp1-billing-payout.sql
   ```

3. **Verify tables exist:**
   - `leads`
   - `creator_wallets`
   - `saas_billing_debt`
   - `billing_invoices`
   - `invoice_line_items`
   - `creator_payouts`
   - `creator_invoices`

### Step 2: Check for Missing Functions

The code uses these database functions. Make sure they exist:

- `get_lead_price_by_plan()`
- `get_creator_earnings()`
- `calculate_naano_margin_brut()`
- `calculate_stripe_fees()`
- `create_lead()`
- `should_bill_saas()`
- `bill_saas()`
- `create_creator_payout()`
- `move_wallet_pending_to_available()`

### Step 3: Initialize Existing Data

After running migrations, initialize wallets and debt tracking:

```sql
-- Initialize wallets for existing creators
INSERT INTO public.creator_wallets (creator_id)
SELECT id FROM public.creator_profiles
ON CONFLICT (creator_id) DO NOTHING;

-- Initialize billing debt for existing SaaS
INSERT INTO public.saas_billing_debt (saas_id, next_billing_date)
SELECT id, public.get_next_billing_date()
FROM public.saas_companies
ON CONFLICT (saas_id) DO NOTHING;
```

### Step 4: Check Server Logs

If errors persist, check your Next.js server logs for specific error messages:

```bash
npm run dev
```

Look for:
- Database connection errors
- Missing table errors
- Function not found errors

### Step 5: Common Issues

1. **"relation does not exist"** → Tables not created, run migrations
2. **"function does not exist"** → Functions not created, run migrations
3. **"column does not exist"** → Schema mismatch, check migration files
4. **Type errors** → Make sure all TypeScript types match the database schema

## Quick Fix

If you just want to get the app running temporarily, you can:

1. Comment out the new wallet/billing code in `app/(dashboard)/dashboard/finances/page.tsx`
2. Use the old commission system temporarily
3. Then properly migrate when ready

But the **proper solution** is to run the migrations.

