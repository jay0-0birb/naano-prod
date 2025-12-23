# Debugging 500 Errors After Running Migrations

## Step 1: Verify Database Setup

Run the verification script in Supabase SQL Editor:

```sql
-- File: supabase/verify-bp1-setup.sql
```

This will show you:
- ✅ Which tables exist
- ✅ Which functions exist  
- ✅ Which columns exist
- ❌ What's missing

## Step 2: Check Next.js Server Logs

The 500 errors are likely coming from the Next.js app. Check your terminal where `npm run dev` is running.

Look for errors like:
- `relation "leads" does not exist` → Tables not created
- `function "create_lead" does not exist` → Functions not created
- `permission denied` → RLS policies blocking access
- `column "card_on_file" does not exist` → Columns not added

## Step 3: Common Issues

### Issue 1: Tables Don't Exist
**Error**: `relation "leads" does not exist`

**Solution**: 
1. Make sure you ran `supabase/bp1-payment-system.sql` first
2. Check Supabase Dashboard → Table Editor → verify tables exist
3. If tables don't exist, re-run the migration

### Issue 2: Functions Don't Exist
**Error**: `function "create_lead" does not exist`

**Solution**:
1. Make sure you ran `supabase/bp1-billing-payout.sql` after the first script
2. Check Supabase Dashboard → Database → Functions → verify functions exist
3. If functions don't exist, re-run the migration

### Issue 3: RLS Policies Blocking Access
**Error**: `permission denied for table "leads"`

**Solution**:
The migrations should have created RLS policies, but if they're blocking:
1. Check Supabase Dashboard → Authentication → Policies
2. Verify policies exist for `leads`, `creator_wallets`, etc.
3. Temporarily disable RLS for testing (NOT for production!)

### Issue 4: Missing Columns
**Error**: `column "card_on_file" does not exist`

**Solution**:
1. Make sure `bp1-payment-system.sql` ran successfully
2. Check if the ALTER TABLE statements executed
3. Re-run just the ALTER TABLE parts if needed

## Step 4: Test Database Functions Directly

Test if functions work in Supabase SQL Editor:

```sql
-- Test get_lead_price_by_plan
SELECT public.get_lead_price_by_plan('starter'); -- Should return 2.50
SELECT public.get_lead_price_by_plan('growth');  -- Should return 2.00
SELECT public.get_lead_price_by_plan('scale');   -- Should return 1.60

-- Test calculate_stripe_fees
SELECT public.calculate_stripe_fees(100.00); -- Should return ~1.75

-- Test get_next_billing_date
SELECT public.get_next_billing_date(); -- Should return a date
```

If these fail, the functions weren't created properly.

## Step 5: Check Application Code

If database is fine, the issue might be in the code:

1. **Check imports**: Make sure all imports are correct
2. **Check function calls**: Verify RPC calls match function names
3. **Check error handling**: Look at the actual error message in server logs

## Step 6: Quick Fix - Add Error Handling

If you need the app to work temporarily, you can add try-catch blocks:

```typescript
// In lib/wallet.ts
try {
  const { data: wallet } = await supabase
    .from('creator_wallets')
    .select('*')
    .eq('creator_id', creatorProfile.id)
    .single();
  
  if (error) {
    // Table doesn't exist or RLS issue
    console.error('Wallet error:', error);
    return { pendingBalance: 0, availableBalance: 0, totalEarned: 0 };
  }
} catch (err) {
  console.error('Wallet query failed:', err);
  return { pendingBalance: 0, availableBalance: 0, totalEarned: 0 };
}
```

## Step 7: Re-run Migrations

If nothing works, try:

1. **Drop and recreate** (⚠️ WARNING: This deletes data!)
   ```sql
   DROP TABLE IF EXISTS creator_invoices CASCADE;
   DROP TABLE IF EXISTS creator_payouts CASCADE;
   DROP TABLE IF EXISTS invoice_line_items CASCADE;
   DROP TABLE IF EXISTS billing_invoices CASCADE;
   DROP TABLE IF EXISTS leads CASCADE;
   DROP TABLE IF EXISTS creator_wallets CASCADE;
   DROP TABLE IF EXISTS saas_billing_debt CASCADE;
   ```

2. **Re-run migrations** in order:
   - `supabase/bp1-payment-system.sql`
   - `supabase/bp1-billing-payout.sql`

3. **Re-initialize data**:
   ```sql
   INSERT INTO public.creator_wallets (creator_id)
   SELECT id FROM public.creator_profiles
   ON CONFLICT (creator_id) DO NOTHING;
   
   INSERT INTO public.saas_billing_debt (saas_id, next_billing_date)
   SELECT id, public.get_next_billing_date()
   FROM public.saas_companies
   ON CONFLICT (saas_id) DO NOTHING;
   ```

## Still Having Issues?

1. Share the **exact error message** from Next.js server logs
2. Share the **verification script results** from Supabase
3. Check if you're using the **correct Supabase project** (dev vs prod)

