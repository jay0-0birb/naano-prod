# 🧪 Testing the Complete Payment Flow

## Prerequisites

1. **SaaS Account**: Has a card registered (Visa **** 4242)
2. **Creator Account**: Has Stripe Connect account connected
3. **Active Collaboration**: Between SaaS and Creator
4. **Stripe Webhook**: Configured to point to `/api/stripe/webhook`

---

## Step 1: Create Leads (Generate Debt)

### On Creator Side:
1. Go to `/dashboard/collaborations`
2. Open an active collaboration
3. Copy the tracking link (format: `https://yourdomain.com/c/[hash]`)
4. Click the link multiple times to create leads

**OR** Use browser console to create leads quickly:
```javascript
// Replace YOUR_LINK_ID with actual link ID from collaboration
for(let i = 0; i < 40; i++) {
  fetch('/api/track/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      session_id: `test_${Date.now()}_${i}`, 
      link_id: 'YOUR_LINK_ID' 
    })
  });
}
```

### Verify:
- **SaaS Side** (`/dashboard/finances`):
  - "Dette actuelle" should increase (€2.50 per lead for Starter plan)
  - "Total leads" should increase
- **Creator Side** (`/dashboard/finances`):
  - "Pending balance" should increase (€1.20 per lead)
  - "Total earned" should increase

### Database Check:
```sql
-- Check leads
SELECT COUNT(*), SUM(lead_value) FROM leads WHERE saas_id = 'YOUR_SAAS_ID';

-- Check SaaS debt
SELECT current_debt FROM saas_billing_debt WHERE saas_id = 'YOUR_SAAS_ID';

-- Check creator wallet
SELECT pending_balance, available_balance FROM creator_wallets WHERE creator_id = 'YOUR_CREATOR_ID';
```

---

## Step 2: Trigger Billing (SaaS → Naano)

### Option A: Wait for Automatic Threshold (€100)
- Create 40 leads (40 × €2.50 = €100 for Starter plan)
- System should automatically bill when debt ≥ €100

### Option B: Manual Trigger (For Testing)
```javascript
// In browser console on SaaS account
fetch('/api/billing/check-and-bill', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    saas_id: 'YOUR_SAAS_ID' // Get from database or URL
  })
}).then(r => r.json()).then(console.log);
```

### What Should Happen:
1. ✅ Invoice created in database
2. ✅ Stripe PaymentIntent created
3. ✅ SaaS card charged (check Stripe Dashboard)
4. ✅ Webhook receives `payment_intent.succeeded`
5. ✅ Invoice status updated to "paid"
6. ✅ Creator wallets updated: `pending_balance` → `available_balance`
7. ✅ SaaS debt reset to €0

### Verify:
- **SaaS Side** (`/dashboard/finances`):
  - "Dette actuelle" should be €0 (or remaining amount)
  - "Total facturé" should increase
  - "Historique des factures" should show new invoice
- **Creator Side** (`/dashboard/finances`):
  - "Pending balance" should decrease
  - "Available balance" should increase (now ready for payout)

### Database Check:
```sql
-- Check invoice
SELECT * FROM billing_invoices WHERE saas_id = 'YOUR_SAAS_ID' ORDER BY created_at DESC LIMIT 1;

-- Check creator wallet (should have available balance now)
SELECT pending_balance, available_balance FROM creator_wallets WHERE creator_id = 'YOUR_CREATOR_ID';

-- Check SaaS debt (should be reset)
SELECT current_debt FROM saas_billing_debt WHERE saas_id = 'YOUR_SAAS_ID';
```

### Stripe Dashboard Check:
- Go to Stripe Dashboard → Payments
- Should see a payment for the invoice amount
- Status should be "Succeeded"

---

## Step 3: Creator Payout (Naano → Creator)

### Prerequisites:
- Creator must have ≥ €50 in `available_balance`
- Creator must have Stripe Connect account connected

### On Creator Side:
1. Go to `/dashboard/finances`
2. Check "Available balance" (should be ≥ €50)
3. Click "Request Payout" button

### What Should Happen:
1. ✅ Payout record created in database
2. ✅ Creator invoice/receipt generated
3. ✅ Stripe Transfer created (Naano → Creator's Stripe Connect)
4. ✅ Webhook receives `transfer.paid`
5. ✅ Payout status updated to "completed"
6. ✅ Creator wallet updated: `available_balance` decreases

### Verify:
- **Creator Side** (`/dashboard/finances`):
  - "Available balance" should decrease by payout amount
  - "Payout history" should show new payout
- **Stripe Dashboard**:
  - Go to Stripe Dashboard → Transfers
  - Should see transfer to creator's account
  - Status should be "Paid"

### Database Check:
```sql
-- Check payout
SELECT * FROM creator_payouts WHERE creator_id = 'YOUR_CREATOR_ID' ORDER BY created_at DESC LIMIT 1;

-- Check creator invoice
SELECT * FROM creator_invoices WHERE payout_id = 'PAYOUT_ID';

-- Check creator wallet (available balance should decrease)
SELECT pending_balance, available_balance FROM creator_wallets WHERE creator_id = 'YOUR_CREATOR_ID';
```

---

## Step 4: Verify Webhook Events

### Check Webhook Logs:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Check "Events" tab for:
   - `payment_intent.succeeded` (when SaaS is billed)
   - `transfer.created` (when payout is initiated)
   - `transfer.paid` (when payout completes)

### Check Server Logs:
Your Next.js server should log:
- `Billing invoice [ID] paid successfully`
- `Moved €X from pending to available for creator [ID]`
- `Transfer created for payout [ID]`
- `Transfer completed for payout [ID]`

---

## Troubleshooting

### Issue: Billing doesn't trigger automatically
**Solution**: Set up a cron job to call `/api/billing/check-and-bill` periodically, or trigger manually for testing.

### Issue: Payment fails
**Check**:
- SaaS has valid card on file
- Card has sufficient funds
- Stripe webhook is configured correctly

### Issue: Creator wallet doesn't update after billing
**Check**:
- Webhook is receiving `payment_intent.succeeded` events
- Check server logs for errors
- Verify `bill_saas()` function is working correctly

### Issue: Payout fails
**Check**:
- Creator has Stripe Connect account connected
- Creator has ≥ €50 available balance
- Stripe Connect account is fully onboarded

---

## Complete Flow Summary

```
1. Lead Created
   ↓
   SaaS debt: +€2.50
   Creator pending: +€1.20

2. Debt ≥ €100 OR Month-End
   ↓
   Invoice Created
   Stripe PaymentIntent Created
   ↓
   SaaS Card Charged
   ↓
   Webhook: payment_intent.succeeded
   ↓
   Creator wallets: pending → available
   SaaS debt: reset to €0

3. Creator Available Balance ≥ €50
   ↓
   Creator Requests Payout
   ↓
   Stripe Transfer Created
   ↓
   Webhook: transfer.paid
   ↓
   Creator receives money
   Creator wallet: available decreases
```

---

## Quick Test Checklist

- [ ] Card registered on SaaS account
- [ ] Stripe Connect connected on Creator account
- [ ] Active collaboration exists
- [ ] Leads created (debt increases)
- [ ] Billing triggered (invoice created, payment succeeds)
- [ ] Creator wallets updated (pending → available)
- [ ] Creator requests payout (transfer succeeds)
- [ ] All webhook events received
- [ ] All database records updated correctly

