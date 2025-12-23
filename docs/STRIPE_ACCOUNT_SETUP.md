# 💳 Stripe Account Setup & Money Flow

## 🏦 How Stripe Accounts Work

### Naano's Stripe Account (Platform Account)
- **Type**: Standard Stripe Account (your main account)
- **Configuration**: Set via `STRIPE_SECRET_KEY` environment variable
- **Purpose**: Receives all SaaS payments, holds Naano's balance

### Creator Stripe Connect Accounts
- **Type**: Stripe Connect Express Accounts
- **Configuration**: Created via Stripe Connect API
- **Purpose**: Creators receive payouts here, then withdraw to their bank

---

## 💰 Money Flow

### Step 1: SaaS Pays → Naano
```
SaaS Card (Visa **** 4242)
    ↓
Stripe PaymentIntent created
    ↓
SaaS card charged: €100
    ↓
💰 Money goes to: Naano's Stripe Account Balance
```

**Code**: `app/api/billing/check-and-bill/route.ts`
- Creates PaymentIntent with `stripe.paymentIntents.create()`
- Uses Naano's Stripe account (from `STRIPE_SECRET_KEY`)
- Money automatically goes to Naano's Stripe balance

---

### Step 2: Naano → Creator
```
Naano's Stripe Account Balance: €100
    ↓
Creator requests payout: €50
    ↓
Stripe Transfer created
    ↓
💰 Money transferred to: Creator's Stripe Connect Account
    ↓
Creator can withdraw to their bank
```

**Code**: `app/api/payouts/request/route.ts`
- Creates Transfer with `stripe.transfers.create()`
- Transfers from Naano's account to creator's `stripe_account_id`
- Creator receives money in their Stripe Connect account

---

## ⚙️ Configuration

### Environment Variables Needed:

```env
# Naano's Stripe Account (Platform)
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Your Stripe publishable key

# Webhook Secret (for verifying webhook events)
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Where to Get These:

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com
2. **Get API Keys**:
   - Go to Developers → API Keys
   - Copy "Secret key" → `STRIPE_SECRET_KEY`
   - Copy "Publishable key" → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

3. **Set Up Webhook**:
   - Go to Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Select events: `payment_intent.succeeded`, `transfer.paid`, etc.
   - Copy "Signing secret" → `STRIPE_WEBHOOK_SECRET`

---

## 🔍 How to Verify

### Check Naano's Stripe Balance:
1. Go to Stripe Dashboard → Balance
2. You should see money coming in when SaaS pays
3. You should see transfers going out when creators get paid

### Check Payments:
1. Go to Stripe Dashboard → Payments
2. You'll see all SaaS payments (€100, €200, etc.)
3. Status should be "Succeeded"

### Check Transfers:
1. Go to Stripe Dashboard → Transfers
2. You'll see transfers to creator accounts
3. Status should be "Paid"

---

## 📊 Example Flow

### Scenario: 40 Leads Generated

1. **Leads Created**:
   - SaaS debt: €100 (40 × €2.50)
   - Creator pending: €48 (40 × €1.20)

2. **SaaS Pays**:
   - Stripe charges SaaS card: €100
   - **Naano's Stripe balance: +€100**
   - Stripe fees: -€1.75 (Naano pays)
   - **Naano's actual balance: €98.25**

3. **Creator Wallets Updated**:
   - Creator pending: €48 → €0
   - Creator available: €0 → €48

4. **Creator Requests Payout** (when ≥€50):
   - Stripe Transfer: €48 from Naano → Creator
   - **Naano's Stripe balance: -€48**
   - **Creator's Stripe Connect: +€48**
   - Creator can withdraw to bank

5. **Naano's Final Balance**:
   - Received: €100
   - Stripe fees: -€1.75
   - Paid to creator: -€48
   - **Net: €50.25** (Naano's margin)

---

## 💰 Understanding Stripe Balance States

### "Incoming" vs "Available"

**Incoming Balance (€96.50)**:
- Money that's been charged but is still in the **holding period**
- Stripe holds funds for risk management (fraud, disputes, refunds)
- **Holding period**: Usually 2-7 days for new accounts, 2 business days for established accounts
- You can't transfer or payout "incoming" funds yet

**Available Balance (€199.52)**:
- Money that has **cleared** the holding period
- Can be transferred to creators or paid out to your bank
- Ready for use immediately

### When Does "Incoming" Become "Available"?

1. **New Accounts**: 7 days holding period
2. **Established Accounts**: 2 business days
3. **High-Risk Payments**: May be held longer
4. **Check in Stripe Dashboard**: Go to Balance → See "Available on [date]"

### How to Get Money to Naano's Bank Account

**Option 1: Automatic Payouts (Recommended)**
1. Go to Stripe Dashboard → Settings → Payouts
2. Add your bank account
3. Set payout schedule (daily, weekly, monthly)
4. Stripe automatically pays out "available" balance to your bank

**Option 2: Manual Payout**
1. Go to Stripe Dashboard → Balance
2. Click "Pay out funds"
3. Manually transfer available balance to your bank

**Important**: Only "Available" balance can be paid out. "Incoming" must wait for the holding period.

---

## ⚠️ Important Notes

1. **Test Mode vs Live Mode**:
   - Use `sk_test_...` for development (test mode)
   - Use `sk_live_...` for production (live mode)
   - Test mode money is fake, live mode is real!

2. **Stripe Connect**:
   - Creators need to complete Stripe Connect onboarding
   - They provide their bank details to Stripe
   - Naano never sees creator bank details (privacy)

3. **Stripe Fees**:
   - Naano pays all Stripe fees (from margin)
   - SaaS pays full amount (no fees)
   - Creator receives full amount (no fees)

4. **Holding Period**:
   - New accounts: 7 days
   - Established accounts: 2 business days
   - Funds move from "Incoming" → "Available" automatically
   - You can still transfer to creators from "Available" balance (even if not yet in your bank)

5. **Webhooks**:
   - Critical for updating database when payments succeed
   - Must be configured correctly
   - Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

---

## 🧪 Testing Locally

1. **Install Stripe CLI**: https://stripe.com/docs/stripe-cli
2. **Login**: `stripe login`
3. **Forward webhooks**: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. **Get webhook secret**: Copy the `whsec_...` from CLI output
5. **Add to `.env.local`**: `STRIPE_WEBHOOK_SECRET=whsec_...`

Now you can test payments and see webhook events in real-time!

