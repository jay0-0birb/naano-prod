# 🧪 Credit System Testing Guide

**Date**: 2026-01-24  
**Status**: Ready for Testing

---

## 🔧 PRE-TESTING SETUP

### 1. Environment Variables Check

Make sure these are in your `.env.local`:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # ⚠️ CRITICAL - Get from Stripe Dashboard

# Credit Subscription (from Stripe Dashboard)
STRIPE_PRICE_CREDIT_SUBSCRIPTION=price_...  # The base price you created

# Pro Subscription (from Stripe Dashboard)
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...  # Optional

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

### 2. Stripe Webhook Setup ⚠️ CRITICAL

**This is the most important step!** Without webhooks, subscriptions won't activate.

#### Option A: Local Testing (ngrok)

1. **Install ngrok** (if not already):
   ```bash
   brew install ngrok  # macOS
   # or download from https://ngrok.com
   ```

2. **Start your Next.js dev server**:
   ```bash
   npm run dev
   ```

3. **Start ngrok** (in another terminal):
   ```bash
   ngrok http 3002  # Use the port your Next.js app runs on (3000, 3002, etc.)
   ```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **Add webhook in Stripe Dashboard**:
   - Go to: https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://abc123.ngrok.io/api/stripe/webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
   - Click "Add endpoint"
   - **Copy the "Signing secret"** (starts with `whsec_`)
   - Add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`

#### Option B: Production/Deployed Testing

1. **Deploy your app** (Vercel, etc.)

2. **Add webhook in Stripe Dashboard**:
   - Endpoint URL: `https://your-domain.com/api/stripe/webhook`
   - Select the same events as above
   - Copy the signing secret to your environment variables

---

## 🧪 TESTING ORDER

Test in this order to avoid dependencies:

1. ✅ **Credit Subscription Purchase** (SaaS)
2. ✅ **Qualified Click → Credit Deduction** (Core flow)
3. ✅ **Pro Subscription** (Creator)
4. ✅ **Payout Difference** (Pro vs Standard)
5. ✅ **Hard Cap** (0 credits blocks clicks)
6. ✅ **Credit Renewal** (Monthly roll-over)

---

## 📋 DETAILED TESTING STEPS

### Test 1: Credit Subscription Purchase (SaaS)

**Goal**: Verify SaaS can purchase credits via slider

**Steps**:
1. **Login as SaaS user**
2. **Go to**: `/dashboard/finances`
3. **Click "Mon Plan" tab**
4. **Use the slider** to select credit volume (e.g., 500 credits)
5. **Verify pricing**:
   - Unit price should show: €2.45/credit
   - Total should show: €1,225.00
6. **Click "S'abonner"**
7. **Complete Stripe Checkout** (use test card: `4242 4242 4242 4242`)
8. **After payment**:
   - ✅ Should redirect back to finances page
   - ✅ Credit balance widget should show 500 credits
   - ✅ Subscription info should be visible

**Verify in Database**:
```sql
SELECT 
  company_name,
  wallet_credits,
  monthly_credit_subscription,
  credit_renewal_date,
  stripe_subscription_id_credits
FROM saas_companies
WHERE id = 'YOUR_SAAS_ID';
```

**Expected**:
- `wallet_credits` = 500
- `monthly_credit_subscription` = 500
- `credit_renewal_date` = ~30 days from now
- `stripe_subscription_id_credits` = `sub_...`

**Verify in Stripe Dashboard**:
- Go to: https://dashboard.stripe.com/test/subscriptions
- Find the subscription
- Status should be "Active"

**Verify Webhook**:
- Go to: https://dashboard.stripe.com/test/webhooks
- Click on your webhook endpoint
- Check "Events" tab
- Should see `checkout.session.completed` event
- Click event → Should show successful response (200)

---

### Test 2: Qualified Click → Credit Deduction

**Goal**: Verify clicking a tracking link deducts 1 credit and pays creator

**Steps**:
1. **Get a tracking link** from a collaboration
2. **Click the link** (or visit `/c/[hash]`)
3. **Wait for redirect** (should still work)
4. **Check credit balance**:
   - Go to `/dashboard/finances` (SaaS view)
   - Credit balance should decrease by 1

**Verify in Database**:
```sql
-- Check credit balance
SELECT wallet_credits FROM saas_companies WHERE id = 'YOUR_SAAS_ID';

-- Check lead was created
SELECT 
  id,
  creator_payout_amount,
  credits_deducted,
  status
FROM leads
WHERE saas_id = 'YOUR_SAAS_ID'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected**:
- `wallet_credits` decreased by 1
- Lead created with `credits_deducted = true`
- `creator_payout_amount` = €0.90 (Standard) or €1.10 (Pro)

**Verify Creator Wallet**:
```sql
SELECT 
  pending_balance,
  total_earned
FROM creator_wallets
WHERE creator_id = 'YOUR_CREATOR_ID';
```

**Expected**:
- `pending_balance` increased by €0.90 or €1.10
- `total_earned` increased by same amount

**Verify Transaction Log**:
```sql
SELECT 
  transaction_type,
  credits_amount,
  balance_before,
  balance_after
FROM saas_credit_transactions
WHERE saas_id = 'YOUR_SAAS_ID'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected**:
- `transaction_type` = 'deduction'
- `credits_amount` = -1
- `balance_after` = `balance_before` - 1

---

### Test 3: Pro Subscription (Creator)

**Goal**: Verify creator can subscribe to Pro and get €1.10/click

**Steps**:
1. **Login as Creator**
2. **Go to**: `/dashboard/finances`
3. **Find Pro upgrade banner**
4. **Select plan**: Monthly (€25/mo) or Annual
5. **Click upgrade**
6. **Complete Stripe Checkout**
7. **After payment**:
   - ✅ Banner should show "Membre Pro"
   - ✅ Should show expiration date

**Verify in Database**:
```sql
SELECT 
  is_pro,
  pro_status_source,
  pro_expiration_date,
  stripe_subscription_id_pro
FROM creator_profiles
WHERE id = 'YOUR_CREATOR_ID';
```

**Expected**:
- `is_pro` = true
- `pro_status_source` = 'PAYMENT'
- `pro_expiration_date` = ~30 days from now (monthly) or ~365 days (annual)
- `stripe_subscription_id_pro` = `sub_...`

**Verify in Stripe Dashboard**:
- Subscription should be "Active"
- Webhook should have fired `checkout.session.completed`

---

### Test 4: Payout Difference (Pro vs Standard)

**Goal**: Verify Pro creators get €1.10, Standard get €0.90

**Steps**:
1. **Create a click** with a Pro creator
2. **Check lead payout amount**:
   ```sql
   SELECT creator_payout_amount
   FROM leads
   WHERE creator_id = 'PRO_CREATOR_ID'
   ORDER BY created_at DESC
   LIMIT 1;
   ```
3. **Should be**: €1.10

4. **Create a click** with a Standard creator
5. **Check lead payout amount**:
   ```sql
   SELECT creator_payout_amount
   FROM leads
   WHERE creator_id = 'STANDARD_CREATOR_ID'
   ORDER BY created_at DESC
   LIMIT 1;
   ```
6. **Should be**: €0.90

**Verify Creator Wallets**:
```sql
-- Pro creator
SELECT pending_balance FROM creator_wallets WHERE creator_id = 'PRO_CREATOR_ID';

-- Standard creator
SELECT pending_balance FROM creator_wallets WHERE creator_id = 'STANDARD_CREATOR_ID';
```

**Expected**:
- Pro wallet increased by €1.10
- Standard wallet increased by €0.90

---

### Test 5: Hard Cap (0 Credits Blocks Clicks)

**Goal**: Verify clicks are blocked when credits = 0

**Steps**:
1. **Set SaaS credits to 0** (manually in database):
   ```sql
   UPDATE saas_companies
   SET wallet_credits = 0
   WHERE id = 'YOUR_SAAS_ID';
   ```

2. **Try to click tracking link**
   - ✅ Should still redirect (user experience)
   - ❌ Should NOT create lead
   - ❌ Should NOT deduct credits
   - ❌ Should NOT pay creator

3. **Try to submit post** (as creator on collaboration page)
   - ✅ Form should be disabled
   - ✅ Should show warning message

**Verify in Database**:
```sql
-- Check no new lead was created
SELECT COUNT(*) 
FROM leads 
WHERE saas_id = 'YOUR_SAAS_ID' 
  AND created_at > NOW() - INTERVAL '5 minutes';
```

**Expected**: 0 new leads

**Verify in API**:
- Check browser console or server logs
- Should see error: "Insufficient credits. SaaS has 0 credits remaining."

---

### Test 6: Credit Renewal (Monthly Roll-over)

**Goal**: Verify monthly renewal adds credits and rolls over unused credits

**Steps**:
1. **Set up subscription** (from Test 1)
2. **Use some credits** (e.g., 50 out of 500)
3. **Current balance**: 450 credits
4. **Simulate renewal** (or wait for actual renewal):
   - Option A: Wait for actual renewal (30 days)
   - Option B: Manually trigger webhook (see below)

**Manual Webhook Trigger** (for testing):
1. **Go to Stripe Dashboard** → Subscriptions
2. **Find the subscription**
3. **Click "..." → "Send test webhook"**
4. **Select event**: `invoice.paid`
5. **Send**

**Verify in Database**:
```sql
SELECT 
  wallet_credits,
  monthly_credit_subscription,
  credit_renewal_date
FROM saas_companies
WHERE id = 'YOUR_SAAS_ID';
```

**Expected**:
- `wallet_credits` = 450 + 500 = **950 credits** (roll-over!)
- `credit_renewal_date` = ~30 days from now

**Verify Transaction Log**:
```sql
SELECT 
  transaction_type,
  credits_amount,
  balance_before,
  balance_after
FROM saas_credit_transactions
WHERE saas_id = 'YOUR_SAAS_ID'
  AND transaction_type = 'rollover'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected**:
- `transaction_type` = 'rollover'
- `credits_amount` = 500 (new credits)
- `balance_before` = 450 (old balance)
- `balance_after` = 950 (roll-over!)

---

## 🔍 DEBUGGING TIPS

### Webhook Not Firing?

1. **Check webhook URL** is correct
2. **Check ngrok is running** (if local)
3. **Check Stripe Dashboard** → Webhooks → Events
4. **Check server logs** for webhook errors
5. **Verify `STRIPE_WEBHOOK_SECRET`** is correct

### Credits Not Deducting?

1. **Check `wallet_credits`** in database
2. **Check lead creation** in `/api/track/lead` logs
3. **Check RPC function** `create_lead_with_credits` is being called
4. **Verify credits > 0** before click

### Pro Status Not Activating?

1. **Check webhook** received `checkout.session.completed`
2. **Check webhook handler** in `/api/stripe/webhook/route.ts`
3. **Verify `STRIPE_PRICE_PRO_MONTHLY`** is correct
4. **Check database** for `is_pro` flag

### Pricing Wrong?

1. **Check `get_credit_unit_price`** function in database
2. **Verify volume tiers** match planP.md
3. **Check API** `/api/calculate-credit-price` response

---

## 📊 QUICK VERIFICATION QUERIES

Run these to verify everything is working:

```sql
-- Check all SaaS credit subscriptions
SELECT 
  company_name,
  wallet_credits,
  monthly_credit_subscription,
  credit_renewal_date
FROM saas_companies
WHERE monthly_credit_subscription IS NOT NULL;

-- Check all Pro creators
SELECT 
  p.email,
  cp.is_pro,
  cp.pro_status_source,
  cp.pro_expiration_date
FROM creator_profiles cp
JOIN profiles p ON p.id = cp.profile_id
WHERE cp.is_pro = true;

-- Check recent credit transactions
SELECT 
  sc.company_name,
  sct.transaction_type,
  sct.credits_amount,
  sct.balance_before,
  sct.balance_after,
  sct.created_at
FROM saas_credit_transactions sct
JOIN saas_companies sc ON sc.id = sct.saas_id
ORDER BY sct.created_at DESC
LIMIT 10;

-- Check recent leads with payout amounts
SELECT 
  l.id,
  l.creator_payout_amount,
  l.credits_deducted,
  l.created_at
FROM leads l
ORDER BY l.created_at DESC
LIMIT 10;
```

---

## ✅ TESTING CHECKLIST

- [ ] Environment variables set
- [ ] Stripe webhook configured
- [ ] Credit subscription purchase works
- [ ] Credit balance updates after purchase
- [ ] Qualified click deducts 1 credit
- [ ] Creator wallet updates with correct payout
- [ ] Pro subscription works
- [ ] Pro status activates after payment
- [ ] Pro creators get €1.10, Standard get €0.90
- [ ] Hard cap blocks clicks at 0 credits
- [ ] Post submission disabled at 0 credits
- [ ] Credit renewal adds credits
- [ ] Roll-over works (old + new credits)
- [ ] Budget widget shows correct status
- [ ] Pro badge appears on creator cards

---

## 🚨 COMMON ISSUES

### Issue: "Webhook secret mismatch"
**Fix**: Copy the exact secret from Stripe Dashboard (starts with `whsec_`)

### Issue: "Credits not adding after purchase"
**Fix**: Check webhook is firing and handler is updating database

### Issue: "Pro status not showing"
**Fix**: Check `is_pro` flag in database, verify webhook updated it

### Issue: "Pricing wrong"
**Fix**: Check `get_credit_unit_price` function matches planP.md tiers

---

**Ready to test!** Start with Test 1 and work through them in order. 🚀
