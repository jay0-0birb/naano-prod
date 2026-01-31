# Migration Order - Clear Plan

Run these SQL files **in this exact order**. Skip any you've already run.

---

## Step 1: Base schema (if fresh DB)

```bash
supabase db execute -f supabase/schema.sql
```

**Skip if:** You already have `profiles`, `saas_companies`, `creator_profiles` tables.

---

## Step 2: Payment system (creates leads, wallets)

```bash
supabase db execute -f supabase/bp1-payment-system.sql
supabase db execute -f supabase/bp1-billing-payout.sql
```

**Skip if:** You already have `leads`, `creator_wallets`, `saas_billing_debt` tables.

---

## Step 3: Tracking system

```bash
supabase db execute -f supabase/tracking-system-v2.sql
```

**Skip if:** You already have `tracked_links` and `link_events` tables.  
**Note:** This drops old `link_clicks` if it exists.

---

## Step 4: Credit system (the new payment model)

```bash
supabase db execute -f supabase/credit-system-migration.sql
```

**Skip if:** You already have `wallet_credits` on `saas_companies` and `create_lead_with_credits` function.

---

## Step 5: Creator wallet fix (required after credit-system-migration)

```bash
supabase db execute -f supabase/fix-creator-wallet-credit-system.sql
```

**Always run** if you ran Step 4. Fixes creator payouts (earnings → available immediately).

---

## Step 6: Remove old BP1 payment system

```bash
supabase db execute -f supabase/remove-old-payment-system.sql
```

**Run last.** Drops obsolete BP1 functions and `saas_billing_debt` table.

---

## Quick check: what have you already run?

```sql
-- Run in Supabase SQL Editor to check your current state:

-- Do you have credit system?
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'saas_companies' AND column_name = 'wallet_credits';
-- If returns 1 row → credit-system-migration already run

-- Do you have tracking v2?
SELECT 1 FROM information_schema.tables WHERE table_name = 'tracked_links';
-- If returns 1 row → tracking-system-v2 already run

-- Do you have BP1?
SELECT 1 FROM information_schema.tables WHERE table_name = 'saas_billing_debt';
-- If returns 1 row → bp1 still present (run remove-old-payment-system after step 5)
```

---

## TL;DR - Most likely you need:

If your app is already running and you're migrating from BP1 to credit system:

```bash
supabase db execute -f supabase/credit-system-migration.sql      # if not run yet
supabase db execute -f supabase/fix-creator-wallet-credit-system.sql
supabase db execute -f supabase/remove-old-payment-system.sql
```

If you're setting up from scratch:

```bash
supabase db execute -f supabase/schema.sql
supabase db execute -f supabase/bp1-payment-system.sql
supabase db execute -f supabase/bp1-billing-payout.sql
supabase db execute -f supabase/tracking-system-v2.sql
supabase db execute -f supabase/credit-system-migration.sql
supabase db execute -f supabase/fix-creator-wallet-credit-system.sql
supabase db execute -f supabase/remove-old-payment-system.sql
```
