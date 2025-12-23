# Quick Testing Guide - UI Based

## 🎯 Quick Start Testing

### Prerequisites
1. Two browser windows open:
   - **Window 1**: SaaS account (logged in)
   - **Window 2**: Creator account (logged in)

2. Have a collaboration set up between them

---

## 📋 TEST 1: Lead Creation (5 minutes)

### SaaS Side
1. Go to `/dashboard/collaborations`
2. Open an active collaboration
3. Copy the **tracking link** (looks like: `https://yourdomain.com/track/[id]`)

### Test Lead Click
1. Open the tracking link in a **new incognito/private window**
2. The page should load (even if it's just a blank page - that's OK)

### Verify Lead Created
**SaaS Side**:
- Go to `/dashboard/finances`
- Check "Total leads" - should increase by 1
- Check "Dette actuelle" - should increase by your plan's lead price:
  - Starter: +€2.50
  - Growth: +€2.00
  - Scale: +€1.60

**Creator Side**:
- Go to `/dashboard/finances`
- Check "Pending balance" - should increase by €1.20
- Check "Total earned" - should increase by €1.20

---

## 📋 TEST 2: Billing (10 minutes)

### Create Enough Leads to Reach Threshold

**Option A: Manual (Slow)**
- Click the tracking link 40 times (for starter plan: 40 × €2.50 = €100)

**Option B: Quick Test (Fast)**
- Use the browser console on the tracking link page:
```javascript
// Run this in browser console to simulate 40 clicks
for(let i = 0; i < 40; i++) {
  fetch('/api/track/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: `test_${i}`, link_id: 'YOUR_LINK_ID' })
  });
}
```

### Trigger Billing
**SaaS Side**:
1. Go to `/dashboard/finances`
2. You should see "Dette actuelle" = €100+ (or close to it)
3. **Manually trigger billing** (for testing):
   - Open browser console
   - Run:
   ```javascript
   fetch('/api/billing/check-and-bill', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ saas_id: 'YOUR_SAAS_ID' })
   }).then(r => r.json()).then(console.log);
   ```

### Verify Billing
**SaaS Side**:
- Go to `/dashboard/finances`
- Check "Dette actuelle" - should reset to €0 (or remaining amount)
- Check "Total facturé" - should increase
- Check "Historique des factures" - should show new invoice

**Creator Side**:
- Go to `/dashboard/finances`
- Check "Pending balance" - should decrease
- Check "Available balance" - should increase (now ready for payout!)

---

## 📋 TEST 3: Payout (5 minutes)

### Prerequisites
- Creator must have **Available balance ≥ €50**

### Request Payout
**Creator Side**:
1. Go to `/dashboard/finances`
2. Check "Available balance" - should be ≥ €50
3. Click **"Request Payout"** button
4. Should see success message

### Verify Payout
**Creator Side**:
- Go to `/dashboard/finances`
- Check "Available balance" - should decrease by payout amount
- Check "Payout history" - should show new payout with status "processing"

**Note**: In test mode, you may need to manually update the payout status in the database or wait for Stripe webhook.

---

## 📋 TEST 4: Card Validation (5 minutes)

### SaaS Side
1. Go to `/dashboard/settings`
2. Look for card section
3. Click "Add Card" or "Validate Card"
4. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)

### Verify Card
- After completing card setup, refresh `/dashboard/settings`
- Should see card status: "Card on file" with last 4 digits

---

## 📋 TEST 5: Full Flow (15 minutes)

### Step-by-Step

1. **SaaS**: Create collaboration with creator
2. **SaaS**: Get tracking link
3. **Test**: Click tracking link 50 times (or use console script)
4. **SaaS**: Check finances - debt should be €125 (50 × €2.50 for starter)
5. **SaaS**: Trigger billing (manual API call or wait for threshold)
6. **SaaS**: Verify invoice created and paid
7. **Creator**: Check finances - available balance should be €60 (50 × €1.20)
8. **Creator**: Request payout of €50
9. **Creator**: Verify payout created
10. **Both**: Check final balances

---

## 🐛 Common Issues & Fixes

### Issue: "No leads showing up"
**Fix**: 
- Check collaboration is active
- Verify tracking link is correct
- Check browser console for errors
- Verify API endpoint is working: `/api/track/lead`

### Issue: "Billing not triggering"
**Fix**:
- Check debt is ≥ €100 OR it's month-end
- Verify SaaS has card on file
- Manually trigger: `/api/billing/check-and-bill`

### Issue: "Payout button disabled"
**Fix**:
- Check available balance is ≥ €50
- Verify creator has Stripe Connect account
- Check payout history for errors

### Issue: "Card validation failing"
**Fix**:
- Use Stripe test card: `4242 4242 4242 4242`
- Check Stripe is in test mode
- Verify webhook is configured

---

## 🔍 Quick Database Checks

### Check Current State
```sql
-- SaaS debt
SELECT current_debt FROM saas_billing_debt WHERE saas_id = 'YOUR_SAAS_ID';

-- Creator wallet
SELECT pending_balance, available_balance FROM creator_wallets WHERE creator_id = 'YOUR_CREATOR_ID';

-- Recent leads
SELECT COUNT(*), SUM(lead_value) FROM leads WHERE saas_id = 'YOUR_SAAS_ID' AND status = 'validated';

-- Recent invoices
SELECT invoice_number, amount_ht, status FROM billing_invoices WHERE saas_id = 'YOUR_SAAS_ID' ORDER BY created_at DESC LIMIT 5;

-- Recent payouts
SELECT amount, status FROM creator_payouts WHERE creator_id = 'YOUR_CREATOR_ID' ORDER BY created_at DESC LIMIT 5;
```

---

## ✅ Testing Checklist

### Lead System
- [ ] Tracking link works
- [ ] Lead created in database
- [ ] SaaS debt increases
- [ ] Creator pending balance increases

### Billing System
- [ ] Debt accumulates correctly
- [ ] Billing triggers at threshold
- [ ] Invoice created
- [ ] Payment processed
- [ ] Debt resets
- [ ] Creator wallet updates (pending → available)

### Payout System
- [ ] Payout button appears when ≥€50
- [ ] Payout request works
- [ ] Stripe transfer created
- [ ] Wallet balance decreases
- [ ] Payout status updates

### Card System
- [ ] Card setup works
- [ ] Card validation works
- [ ] Card status shows in UI

---

## 🚀 Pro Tips

1. **Use Browser Console**: Faster testing with JavaScript
2. **Use Stripe Dashboard**: Monitor test payments and transfers
3. **Use Supabase SQL Editor**: Quick database checks
4. **Use Network Tab**: See API calls and responses
5. **Test in Incognito**: Avoid cookie/session issues

---

## 📞 Need Help?

- Check `/docs/TESTING_PAYMENT_SYSTEM.md` for detailed API testing
- Check browser console for errors
- Check Supabase logs for database errors
- Check Stripe Dashboard for payment issues

