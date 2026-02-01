# Payment Flow - Corrected Understanding

## ✅ THE CORRECT FLOW

```
SaaS Client → Pays → Naano → Pays → Creator
```

This is a **two-step process**:

### Step 1: SaaS → Naano
```
SaaS pays: €2.50 per lead
    ↓
Stripe processes payment
    ↓
Stripe fees deducted: ~€0.04 (1.5% + €0.25 on €2.50)
    ↓
Naano receives: ~€2.46 (in Naano's Stripe account)
```

### Step 2: Naano → Creator
```
Naano has: ~€2.46 in account
    ↓
Naano transfers: €1.20 to Creator
    ↓
Creator receives: €1.20 (in Creator's Stripe Connect account)
    ↓
Naano keeps: ~€1.26 (€2.46 - €1.20)
```

---

## 💰 COMPLETE FLOW EXAMPLE (40 Leads, Starter Plan)

### Step 1: Lead Generation
```
40 leads created:
  - Lead value: €2.50 each
  - Creator earnings: €1.20 each (fixed)
  - Total debt: 40 × €2.50 = €100
```

### Step 2: Threshold Billing (SaaS → Naano)
```
SaaS pays: €100
    ↓
Stripe fees: ~€1.75 (1.5% + €0.25)
    ↓
Naano receives: €98.25 (in Naano's Stripe account)
    ↓
Creator wallets updated:
  - pending_balance: 0
  - available_balance: 40 × €1.20 = €48
```

### Step 3: Creator Payout (Naano → Creator)
```
Creator requests payout: €48
    ↓
Naano transfers: €48 to Creator's Stripe Connect
    ↓
Creator receives: €48 (in Creator's account)
    ↓
Naano account: €98.25 - €48 = €50.25 remaining
```

### Step 4: Naano Margin
```
Naano received: €98.25 (after Stripe fees)
Creator paid: €48
Naano net margin: €50.25 ✅
```

---

## 🔧 TECHNICAL IMPLEMENTATION

### Step 1: Charge SaaS (SaaS → Naano)
```typescript
// When threshold reached (€100 or month-end)
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000, // €100 in cents
  currency: 'eur',
  customer: saasStripeCustomerId,
  payment_method: saasPaymentMethodId,
  confirm: true,
});

// Stripe automatically:
// - Charges SaaS: €100
// - Deducts fees: ~€1.75
// - Transfers to Naano: €98.25
```

### Step 2: Update Wallets
```typescript
// After payment succeeds
// Update creator wallets: pending → available
await updateCreatorWallets(leads, 'available');

// Store in billing_invoices:
// - amount_ht: €100
// - stripe_fee_amount: €1.75
// - naano_received_amount: €98.25
```

### Step 3: Transfer to Creator (Naano → Creator)
```typescript
// When creator requests payout (≥€50)
const transfer = await stripe.transfers.create({
  amount: 4800, // €48 in cents
  currency: 'eur',
  destination: creatorStripeConnectAccountId,
  description: 'Konex - Paiement commissions',
});

// Money moves: Naano account → Creator account
```

---

## 📊 MONEY LOCATION AT EACH STAGE

### After Lead Generation:
```
SaaS debt: €100 (not paid yet)
Creator pending: €48 (not available yet)
Naano: €0 (nothing yet)
```

### After Billing (SaaS → Naano):
```
SaaS: Paid €100 (money left their account)
Creator available: €48 (ready for payout)
Naano account: €98.25 (after Stripe fees)
```

### After Payout (Naano → Creator):
```
SaaS: Paid €100 (done)
Creator account: €48 (in Stripe Connect)
Naano account: €50.25 (remaining margin)
```

---

## 🗄️ DATABASE TRACKING

### `billing_invoices` Table
```sql
CREATE TABLE billing_invoices (
  id UUID PRIMARY KEY,
  saas_id UUID,
  
  -- What SaaS pays
  amount_ht DECIMAL(10, 2), -- €100 (what SaaS pays)
  
  -- Stripe fees (deducted automatically)
  stripe_fee_amount DECIMAL(10, 2), -- €1.75
  
  -- What Naano actually receives
  naano_received_amount DECIMAL(10, 2), -- €98.25
  
  -- Status
  status TEXT, -- 'draft' | 'paid' | 'failed'
  stripe_payment_intent_id TEXT,
  
  created_at TIMESTAMPTZ
);
```

### `creator_wallets` Table
```sql
CREATE TABLE creator_wallets (
  creator_id UUID PRIMARY KEY,
  
  -- Before SaaS pays
  pending_balance DECIMAL(10, 2), -- €48 (waiting for SaaS payment)
  
  -- After SaaS pays
  available_balance DECIMAL(10, 2), -- €48 (ready for payout)
  
  -- After payout
  total_earned DECIMAL(10, 2), -- Lifetime total
);
```

### `creator_payouts` Table
```sql
CREATE TABLE creator_payouts (
  id UUID PRIMARY KEY,
  creator_id UUID,
  
  -- Amount Naano transfers to creator
  amount DECIMAL(10, 2), -- €48
  
  -- Stripe transfer
  stripe_transfer_id TEXT,
  status TEXT, -- 'pending' | 'completed' | 'failed'
  
  created_at TIMESTAMPTZ
);
```

---

## ✅ KEY POINTS

1. **Two Separate Payments**:
   - Payment 1: SaaS → Naano (Stripe fees deducted)
   - Payment 2: Naano → Creator (from Naano's account)

2. **Stripe Fees**:
   - Deducted automatically when SaaS pays
   - Only affect what Naano receives
   - Do NOT affect creator earnings

3. **Money Flow**:
   - SaaS pays full price (€2.50 per lead)
   - Naano receives less (after Stripe fees)
   - Creator gets fixed amount (€1.20 per lead)
   - Naano keeps the difference (minus fees)

4. **Wallet States**:
   - `pending`: Creator earned it, but SaaS hasn't paid yet
   - `available`: SaaS paid, creator can request payout
   - After payout: Money in creator's Stripe Connect account

---

## 🔄 COMPLETE FLOW DIAGRAM

```
┌─────────────┐
│ SaaS Client │
└──────┬──────┘
       │ Pays €100
       │ (40 leads × €2.50)
       ↓
┌──────────────────┐
│   Stripe Fees    │
│   ~€1.75         │
└──────────────────┘
       │
       ↓
┌─────────────┐
│   Naano     │
│ Receives    │
│ €98.25      │
└──────┬──────┘
       │
       │ Updates wallets:
       │ - Creator: pending → available (€48)
       │
       │ Creator requests payout
       │
       ↓
┌─────────────┐
│   Creator   │
│ Receives    │
│ €48         │
└─────────────┘

Naano keeps: €50.25
```

---

## 🎯 IMPLEMENTATION CHECKLIST

- [ ] Step 1: Charge SaaS when threshold reached
- [ ] Step 2: Track Stripe fees (automatically deducted)
- [ ] Step 3: Update creator wallets (pending → available)
- [ ] Step 4: Store billing invoice with fees
- [ ] Step 5: Transfer to creator when payout requested
- [ ] Step 6: Track both payments separately
- [ ] Step 7: Calculate Naano margin correctly

---

## ✅ SUMMARY

**Flow**: SaaS → Naano → Creator

**Stripe Fees**: 
- Automatically deducted when SaaS pays
- Only affect what Naano receives
- Do NOT affect creator earnings

**Money Location**:
- After billing: In Naano's account (after fees)
- After payout: In Creator's account
- Naano keeps: Margin minus fees

This is the correct two-step payment flow!

