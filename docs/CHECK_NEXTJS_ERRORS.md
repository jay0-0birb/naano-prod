# How to Find the Actual Next.js Error

Since the database functions exist (15 found ✅), the 500 errors are likely from:

1. **Missing tables** - Next.js trying to query tables that don't exist
2. **RLS policies** - Row Level Security blocking access
3. **Missing columns** - Code trying to access columns that weren't added

## Step 1: Check Your Terminal

Look at the terminal where you ran `npm run dev`. You should see error messages like:

```
Error: relation "leads" does not exist
```

or

```
Error: function "create_lead" does not exist
```

**Share that exact error message** - it will tell us exactly what's missing.

## Step 2: Check Tables Exist

Run this in Supabase SQL Editor:

```sql
-- File: supabase/quick-check-tables.sql
```

This will show which tables are missing.

## Step 3: Common Issues & Fixes

### If "leads" table doesn't exist:
→ Re-run `supabase/bp1-payment-system.sql`

### If RLS is blocking:
→ Check Supabase Dashboard → Authentication → Policies
→ Make sure policies exist for the new tables

### If columns missing on existing tables:
→ Check if `saas_companies.card_on_file` exists
→ Check if `creator_profiles.siret` exists
→ Re-run the ALTER TABLE statements from `bp1-payment-system.sql`

## Step 4: Test Database Access

Test if you can query the tables directly:

```sql
-- Test if you can read from tables
SELECT COUNT(*) FROM public.leads;
SELECT COUNT(*) FROM public.creator_wallets;
SELECT COUNT(*) FROM public.saas_billing_debt;
```

If these fail, the tables don't exist or RLS is blocking.

## Step 5: Check Next.js Code

The error might be in how the code is calling the database. Check:

1. **Server logs** - Look for the exact error
2. **Browser console** - Check for client-side errors
3. **Network tab** - See which API call is failing

## Quick Fix: Add Error Handling

If you need the app to work while debugging, add error handling:

```typescript
// In lib/wallet.ts - wrap queries in try-catch
try {
  const { data: wallet, error } = await supabase
    .from('creator_wallets')
    .select('*')
    .eq('creator_id', creatorProfile.id)
    .single();
  
  if (error) {
    console.error('Wallet query error:', error);
    // Return default values instead of crashing
    return { pendingBalance: 0, availableBalance: 0, totalEarned: 0 };
  }
} catch (err) {
  console.error('Wallet query failed:', err);
  return { pendingBalance: 0, availableBalance: 0, totalEarned: 0 };
}
```

## What to Share

To help debug, please share:

1. **The exact error message** from your Next.js terminal
2. **Results of the table check** (run `quick-check-tables.sql`)
3. **Which page/route** is showing the 500 error
4. **Browser console errors** (if any)

