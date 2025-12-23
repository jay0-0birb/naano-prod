# Testing Guide: BP1 Payment System

## Prerequisites

1. **Stripe Test Mode**: Ensure you're using Stripe test mode

   - Check `.env.local` has `STRIPE_SECRET_KEY` with `sk_test_...`
   - Webhook endpoint should be configured in Stripe Dashboard

2. **Database Setup**: Run all SQL migrations

   ```bash
   # Run these in Supabase SQL Editor:
   - supabase/bp1-payment-system.sql
   - supabase/bp1-billing-payout.sql
   ```

3. **Test Accounts**:
   - At least 1 SaaS company account
   - At least 1 Creator account
   - Both should have Stripe Connect accounts set up

---

## 🧪 TEST 1: Lead Tracking (Foundation)

### Goal

Verify that leads are created when tracking links are clicked.

### Steps

#### A. Set Up a Collaboration

1. **SaaS Side**:
   - Go to `/dashboard/collaborations`
   - Create or open an active collaboration with a creator
   - Copy the tracking link (should look like: `https://yourdomain.com/track/[link_id]`)

#### B. Simulate Lead Click

**Option 1: Manual API Call**

```bash
# Get the tracking link ID from the collaboration
curl -X POST http://localhost:3001/api/track/lead \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test_session_123",
    "link_id": "YOUR_LINK_ID_HERE"
  }'
```

**Option 2: Pixel Tracking (Browser)**

1. Open the tracking link in a browser
2. The pixel should automatically create a lead

#### C. Verify Lead Creation

```sql
-- Check in Supabase SQL Editor
SELECT
  id,
  saas_id,
  creator_id,
  collaboration_id,
  lead_value,
  creator_earnings,
  status,
  created_at
FROM leads
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Results**:

- ✅ Lead created with `status = 'pending'`
- ✅ `lead_value` matches SaaS plan (€2.50 for starter, €2.00 for growth, €1.60 for scale)
- ✅ `creator_earnings = 1.20`
- ✅ `saas_id` and `creator_id` are correct

---

## 🧪 TEST 2: SaaS Billing System

### Goal

Verify that SaaS debt accumulates and billing works when threshold is reached.

### Steps

#### A. Create Multiple Leads

```bash
# Create 10 leads (should create €25 debt for starter plan)
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/track/lead \
    -H "Content-Type: application/json" \
    -d "{\"session_id\": \"test_$i\", \"link_id\": \"YOUR_LINK_ID\"}"
done
```

#### B. Check Debt Accumulation

```sql
-- Check SaaS debt
SELECT
  saas_id,
  current_debt,
  last_billed_at,
  next_billing_date
FROM saas_billing_debt
WHERE saas_id = 'YOUR_SAAS_ID';
```

**Expected**: `current_debt` should increase (e.g., €25 for 10 leads on starter plan)

#### C. Check Wallet Updates (Creator Side)

```sql
-- Check creator wallet
SELECT
  creator_id,
  pending_balance,
  available_balance,
  total_earned
FROM creator_wallets
WHERE creator_id = 'YOUR_CREATOR_ID';
```

**Expected**:

- `pending_balance` should increase (€12.00 for 10 leads)
- `available_balance` should still be 0 (not billed yet)
- `total_earned` should increase

#### D. Trigger Billing (Manual)

```bash
# Option 1: Bill specific SaaS
curl -X POST http://localhost:3001/api/billing/check-and-bill \
  -H "Content-Type: application/json" \
  -d '{"saas_id": "YOUR_SAAS_ID"}'

# Option 2: Check all SaaS (cron simulation)
curl -X POST http://localhost:3001/api/billing/check-and-bill \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Note**: Billing only triggers if:

- `current_debt >= 100` OR
- It's month-end

#### E. Verify Invoice Creation

```sql
-- Check invoices
SELECT
  id,
  invoice_number,
  saas_id,
  amount_ht,
  amount_ttc,
  leads_count,
  status,
  stripe_payment_intent_id,
  created_at
FROM billing_invoices
WHERE saas_id = 'YOUR_SAAS_ID'
ORDER BY created_at DESC;
```

**Expected**:

- ✅ Invoice created with `status = 'sent'` or `'paid'`
- ✅ `leads_count` matches number of leads
- ✅ `amount_ht` = `leads_count × lead_price`
- ✅ `stripe_payment_intent_id` is set (if payment succeeded)

#### F. Verify Debt Reset

```sql
-- Check debt after billing
SELECT current_debt FROM saas_billing_debt WHERE saas_id = 'YOUR_SAAS_ID';
```

**Expected**: `current_debt` should be reset to 0 (or remaining amount if partial)

#### G. Verify Wallet Update (Creator)

```sql
-- Check creator wallet after billing
SELECT
  pending_balance,
  available_balance,
  total_earned
FROM creator_wallets
WHERE creator_id = 'YOUR_CREATOR_ID';
```

**Expected**:

- ✅ `pending_balance` decreased (moved to available)
- ✅ `available_balance` increased (now ready for payout)
- ✅ `total_earned` unchanged (lifetime total)

---

## 🧪 TEST 3: Creator Payout System

### Goal

Verify creators can request payouts when they have ≥€50 available.

### Prerequisites

- Creator must have `available_balance >= 50`
- Creator must have Stripe Connect account set up

### Steps

#### A. Check Available Balance

```sql
-- Check creator wallet
SELECT
  available_balance,
  pending_balance,
  total_earned
FROM creator_wallets
WHERE creator_id = 'YOUR_CREATOR_ID';
```

**Required**: `available_balance >= 50`

#### B. Request Payout (UI)

1. **Creator Side**:
   - Go to `/dashboard/finances`
   - Click "Request Payout" button
   - Should show success message

#### C. Request Payout (API)

```bash
# Get auth token first (from browser dev tools > Application > Cookies)
curl -X POST http://localhost:3001/api/payouts/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

#### D. Verify Payout Creation

```sql
-- Check payout
SELECT
  id,
  creator_id,
  amount,
  status,
  stripe_transfer_id,
  created_at
FROM creator_payouts
WHERE creator_id = 'YOUR_CREATOR_ID'
ORDER BY created_at DESC;
```

**Expected**:

- ✅ Payout created with `status = 'pending'`
- ✅ `amount` matches requested amount (≥€50)
- ✅ `stripe_transfer_id` is set (Stripe transfer created)

#### E. Verify Wallet Update

```sql
-- Check wallet after payout request
SELECT
  available_balance,
  pending_balance
FROM creator_wallets
WHERE creator_id = 'YOUR_CREATOR_ID';
```

**Expected**:

- ✅ `available_balance` decreased by payout amount
- ✅ `pending_balance` unchanged

#### F. Simulate Stripe Webhook (Transfer Paid)

```bash
# Use Stripe CLI to simulate webhook
stripe listen --forward-to localhost:3001/api/stripe/webhook

# In another terminal, trigger transfer.paid event
stripe trigger transfer.paid
```

**Or manually update in database** (for testing):

```sql
UPDATE creator_payouts
SET
  status = 'completed',
  completed_at = NOW()
WHERE id = 'YOUR_PAYOUT_ID';
```

#### G. Verify Final Status

```sql
-- Check payout status
SELECT status, completed_at FROM creator_payouts WHERE id = 'YOUR_PAYOUT_ID';
```

**Expected**: `status = 'completed'`

---

## 🧪 TEST 4: Card Validation (SaaS)

### Goal

Verify SaaS can add and validate a card.

### Steps

#### A. Set Up Card (UI)

1. **SaaS Side**:
   - Go to `/dashboard/settings`
   - Click "Add Card" or "Validate Card"
   - Complete Stripe card setup

#### B. Set Up Card (API)

```bash
# Create setup intent
curl -X POST http://localhost:3001/api/stripe/setup-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "purpose": "card_validation"
  }'
```

#### C. Validate Card

```bash
# Validate card
curl -X POST http://localhost:3001/api/stripe/validate-card \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "setup_intent_id": "seti_xxxxx",
    "payment_method_id": "pm_xxxxx"
  }'
```

#### D. Verify Card Status

```sql
-- Check SaaS card status
SELECT
  id,
  card_on_file,
  card_last4,
  card_brand,
  stripe_setup_intent_id
FROM saas_companies
WHERE id = 'YOUR_SAAS_ID';
```

**Expected**:

- ✅ `card_on_file = true`
- ✅ `card_last4` is set (last 4 digits)
- ✅ `card_brand` is set (visa, mastercard, etc.)

---

## 🧪 TEST 5: End-to-End Flow

### Goal

Test the complete flow from lead → billing → payout.

### Steps

1. **Create 50 Leads** (to reach €100 threshold for starter plan)

   ```bash
   for i in {1..50}; do
     curl -X POST http://localhost:3001/api/track/lead \
       -H "Content-Type: application/json" \
       -d "{\"session_id\": \"e2e_$i\", \"link_id\": \"YOUR_LINK_ID\"}"
   done
   ```

2. **Verify Debt**: Should be €125 (50 × €2.50)

3. **Trigger Billing**: Should create invoice and charge SaaS

4. **Verify Creator Wallet**:

   - `available_balance` should be €60 (50 × €1.20)

5. **Request Payout**: Creator requests €50 payout

6. **Verify Payout**: Should create Stripe transfer

7. **Check Final State**:
   - SaaS debt: €0
   - Creator available balance: €10 (€60 - €50)
   - Invoice status: `paid`
   - Payout status: `completed`

---

## 🧪 TEST 6: UI Testing

### SaaS Side

1. **Finances Page** (`/dashboard/finances`):

   - ✅ Should show current debt
   - ✅ Should show total leads
   - ✅ Should show total invoiced
   - ✅ Should show invoice history
   - ✅ Should show lead price based on plan

2. **Settings Page** (`/dashboard/settings`):
   - ✅ Should show card status
   - ✅ Should allow card setup/validation

### Creator Side

1. **Finances Page** (`/dashboard/finances`):
   - ✅ Should show pending balance
   - ✅ Should show available balance
   - ✅ Should show total earned
   - ✅ Should show payout history
   - ✅ Should have "Request Payout" button (if ≥€50 available)

---

## 🐛 Troubleshooting

### Issue: Leads not creating

- Check `link_events` table has the link
- Verify collaboration is active
- Check API logs for errors

### Issue: Billing not triggering

- Verify `current_debt >= 100` OR it's month-end
- Check SaaS has `card_on_file = true`
- Check `stripe_customer_id` is set

### Issue: Payout failing

- Verify creator has Stripe Connect account
- Check `available_balance >= 50`
- Verify Stripe transfer was created

### Issue: Webhooks not working

- Check Stripe webhook endpoint is configured
- Verify `STRIPE_WEBHOOK_SECRET` in `.env.local`
- Use Stripe CLI to test: `stripe listen --forward-to localhost:3001/api/stripe/webhook`

---

## 📊 Database Queries for Verification

### Check All Leads

```sql
SELECT
  l.id,
  l.lead_value,
  l.creator_earnings,
  l.status,
  s.company_name,
  c.full_name as creator_name,
  l.created_at
FROM leads l
JOIN saas_companies s ON l.saas_id = s.id
JOIN creator_profiles cp ON l.creator_id = cp.id
JOIN profiles c ON cp.profile_id = c.id
ORDER BY l.created_at DESC;
```

### Check All Invoices

```sql
SELECT
  bi.id,
  bi.invoice_number,
  s.company_name,
  bi.amount_ht,
  bi.leads_count,
  bi.status,
  bi.created_at
FROM billing_invoices bi
JOIN saas_companies s ON bi.saas_id = s.id
ORDER BY bi.created_at DESC;
```

### Check All Payouts

```sql
SELECT
  cp.id,
  cp.amount,
  cp.status,
  c.full_name as creator_name,
  cp.created_at
FROM creator_payouts cp
JOIN creator_profiles crp ON cp.creator_id = crp.id
JOIN profiles c ON crp.profile_id = c.id
ORDER BY cp.created_at DESC;
```

### Check Wallet Summary

```sql
SELECT
  cw.creator_id,
  c.full_name,
  cw.pending_balance,
  cw.available_balance,
  cw.total_earned
FROM creator_wallets cw
JOIN creator_profiles cp ON cw.creator_id = cp.id
JOIN profiles c ON cp.profile_id = c.id;
```

---

## ✅ Testing Checklist

- [ ] Lead creation works
- [ ] Debt accumulates correctly
- [ ] Billing triggers at threshold
- [ ] Invoice created and charged
- [ ] Creator wallet updates (pending → available)
- [ ] Payout request works
- [ ] Stripe transfer created
- [ ] Webhook updates payout status
- [ ] Card validation works
- [ ] UI displays correct data
- [ ] End-to-end flow works

---

## 🚀 Quick Test Script

Save this as `test-payment-flow.sh`:

```bash
#!/bin/bash

# Configuration
LINK_ID="YOUR_LINK_ID"
SAAS_ID="YOUR_SAAS_ID"
CREATOR_ID="YOUR_CREATOR_ID"
AUTH_TOKEN="YOUR_AUTH_TOKEN"

echo "🧪 Testing Payment Flow..."

# 1. Create 10 leads
echo "1. Creating 10 leads..."
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/track/lead \
    -H "Content-Type: application/json" \
    -d "{\"session_id\": \"test_$i\", \"link_id\": \"$LINK_ID\"}" \
    -s > /dev/null
done
echo "✅ Leads created"

# 2. Check debt
echo "2. Checking debt..."
curl -s "http://localhost:3001/api/billing/check-and-bill" | jq

# 3. Trigger billing (if threshold reached)
echo "3. Triggering billing..."
curl -X POST http://localhost:3001/api/billing/check-and-bill \
  -H "Content-Type: application/json" \
  -d "{\"saas_id\": \"$SAAS_ID\"}" \
  -s | jq

# 4. Request payout (if available balance >= 50)
echo "4. Requesting payout..."
curl -X POST http://localhost:3001/api/payouts/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -s | jq

echo "✅ Test complete!"
```

Make it executable:

```bash
chmod +x test-payment-flow.sh
./test-payment-flow.sh
```

---

## 📝 Notes

- All amounts are in **EUR (€)**
- Use **Stripe test mode** for testing
- Test cards: `4242 4242 4242 4242` (Visa, any future date, any CVC)
- Webhooks require Stripe CLI or configured endpoint
- Database queries use Supabase SQL Editor
