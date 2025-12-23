# 💰 Creator Payout Flow - Complete Guide

## 🎯 How Creators Earn Money

### Step 1: Lead Generation
```
User clicks creator's tracking link
    ↓
Lead created automatically
    ↓
Creator earns: €1.20 (FIXED, always the same)
    ↓
Money goes to: Creator's Wallet (Pending Balance)
```

**What happens:**
- Every click on tracking link = 1 lead = €1.20 earned
- Money is added to "Pending balance" immediately
- Creator can see this in `/dashboard/finances`

---

## 💳 How Creators Get Paid

### Step 2: Money Becomes Available
```
SaaS pays their debt (≥€100 or month-end)
    ↓
Stripe charges SaaS card
    ↓
Payment succeeds
    ↓
Creator wallets updated:
  - Pending balance: €48 → €0
  - Available balance: €0 → €48
```

**What happens:**
- Money moves from "Pending" → "Available" automatically
- This happens when SaaS payment succeeds (via webhook)
- Creator can now request payout

---

### Step 3: Creator Requests Payout

**Prerequisites:**
1. ✅ Creator has Stripe Connect account connected (in Settings)
2. ✅ Available balance ≥ €50 (minimum threshold)

**How to Request:**
1. Go to `/dashboard/finances` (Creator account)
2. Scroll to "Solde disponible" section
3. Click "Retirer" button (appears when ≥€50 available)
4. Confirm payout

**What happens:**
1. System creates payout record in database
2. Stripe Transfer created: Naano → Creator's Stripe Connect
3. Money sent to creator's Stripe Connect account
4. Creator's available balance decreases
5. Payout appears in "Historique des paiements"

---

### Step 4: Creator Withdraws to Bank

**After payout succeeds:**
1. Money is in creator's Stripe Connect account
2. Creator goes to their Stripe Dashboard (or receives email)
3. Creator can withdraw to their bank account
4. Usually takes 2-7 business days to reach bank

**Note**: Creators manage their own Stripe Connect accounts. Naano doesn't see their bank details.

---

## 🔄 Complete Flow Example

### Scenario: Creator gets 40 clicks

**1. Leads Created (40 clicks):**
```
Creator wallet:
  - Pending: €0 → €48 (40 × €1.20)
  - Available: €0
  - Total earned: €48
```

**2. SaaS Pays (after debt reaches €100):**
```
SaaS pays: €100
    ↓
Webhook: payment_intent.succeeded
    ↓
Creator wallet updated:
  - Pending: €48 → €0
  - Available: €0 → €48
  - Total earned: €48 (unchanged)
```

**3. Creator Requests Payout:**
```
Creator clicks "Retirer" button
    ↓
Stripe Transfer: €48 from Naano → Creator
    ↓
Creator wallet:
  - Available: €48 → €0
  - Total earned: €48 (unchanged)
    ↓
Money in creator's Stripe Connect account
```

**4. Creator Withdraws to Bank:**
```
Creator's Stripe Connect account: €48
    ↓
Creator withdraws to bank
    ↓
Money in creator's bank account (2-7 days)
```

---

## 🎨 UI Flow for Creators

### Finances Page (`/dashboard/finances`)

**Wallet Overview:**
- **Pending balance**: Money waiting for SaaS payment (€X.XX)
- **Available balance**: Money ready for payout (€X.XX)
- **Total earned**: Lifetime total (€X.XX)

**Payout Button:**
- Only shows when:
  - Stripe Connect is connected ✅
  - Available balance ≥ €50 ✅
- Button text: "Retirer (€X.XX)"
- Click → Payout processed → Balance decreases

**Payout History:**
- Shows all past payouts
- Status: "Complété", "En cours", "Échoué"
- Amount and date for each payout

---

## ⚙️ Technical Details

### Payout API: `/api/payouts/request`

**Requirements:**
- User must be authenticated (creator)
- Creator must have Stripe Connect account
- Available balance ≥ €50

**Process:**
1. Validates creator and wallet
2. Creates payout record in database
3. Creates Stripe Transfer to creator's account
4. Updates wallet (decreases available balance)
5. Returns payout details

**Code**: `app/api/payouts/request/route.ts`

---

## ⚠️ Important Notes

1. **Minimum Payout**: €50 (from BP1.md)
   - Creator must have ≥€50 available to request payout
   - Can't request smaller amounts

2. **Stripe Connect Required**:
   - Creator must connect Stripe in Settings first
   - They provide bank details to Stripe (not to Naano)
   - Privacy: Naano never sees creator bank details

3. **Payout Timing**:
   - Transfer happens immediately (Stripe processes it)
   - Creator receives money in their Stripe Connect account
   - Creator then withdraws to bank (2-7 days)

4. **Fees**:
   - Creator receives full amount (€1.20 per lead, no fees)
   - Naano pays all Stripe fees (from margin)

5. **Automatic vs Manual**:
   - Currently: Manual (creator clicks "Retirer")
   - Future: Can add automatic payouts (when ≥€50, auto-transfer)

---

## 🧪 Testing Creator Payout

### Step 1: Ensure Creator Has Stripe Connect
1. Go to Creator account → `/dashboard/settings`
2. Connect Stripe account (if not already)
3. Complete onboarding

### Step 2: Generate Available Balance
1. Create leads (click tracking link)
2. Wait for SaaS to pay (or trigger billing manually)
3. Creator's available balance should increase

### Step 3: Request Payout
1. Go to Creator account → `/dashboard/finances`
2. Check "Available balance" (should be ≥€50)
3. Click "Retirer" button
4. Confirm payout

### Step 4: Verify
- **In App**: Available balance decreases, payout appears in history
- **In Stripe Dashboard**: Go to Transfers → See transfer to creator's account
- **Creator's Stripe**: Money should appear in their Stripe Connect account

---

## 📊 Summary

**How creators earn:**
- From tracking link clicks (€1.20 per lead)
- Money goes to wallet automatically

**How creators get paid:**
1. Money moves from "Pending" → "Available" when SaaS pays
2. Creator clicks "Retirer" button (when ≥€50 available)
3. Naano transfers money to creator's Stripe Connect account
4. Creator withdraws to their bank

**Key Points:**
- ✅ Automatic earning (from clicks)
- ✅ Manual payout request (creator clicks button)
- ✅ Minimum €50 to request payout
- ✅ Stripe Connect required
- ✅ Creator manages their own bank withdrawals

