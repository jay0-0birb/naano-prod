# Payment Integration Status & Money Flow

## Overview

Konex has **TWO separate payment flows**:

1. **Collaboration Payments** - SaaS pays creator for collaboration (one-time payment)
2. **Commission Payouts** - Creator gets paid for revenue generated (monthly commissions)

---

## 1. COLLABORATION PAYMENTS (SaaS → Creator)

### What Exists ✅

**API Endpoint**: `/api/stripe/checkout`
- Creates Stripe Checkout session
- Uses Stripe Connect with application fees
- 10% platform fee goes to Konex
- 90% goes directly to creator's Stripe Connect account

**Flow**:
```
SaaS clicks "Pay Creator" button
    ↓
Stripe Checkout session created
    ↓
SaaS pays (e.g., €100)
    ↓
Stripe splits payment:
  - €10 → Konex (platform fee)
  - €90 → Creator's Stripe Connect account (direct transfer)
    ↓
Payment record created in `payments` table
```

**Database Table**: `payments`
- `collaboration_id` - Which collaboration
- `amount` - Payment amount (in cents)
- `stripe_payment_intent_id` - Stripe payment ID
- `status` - `pending` → `completed` / `failed`
- `paid_at` - When payment completed

**Status**: ✅ **WORKING** - Fully implemented

---

## 2. COMMISSION PAYOUTS (Revenue-Based Earnings)

### What Exists ✅

#### A. Revenue Tracking
- **Stripe Webhook** (`/api/stripe/webhook`) tracks payments from SaaS Stripe accounts
- Automatically attributes revenue to creators via tracking links
- Stores gross/net revenue and Stripe fees in `link_events` table

#### B. Commission Calculation
- **Function**: `calculate_commission_for_period()` in database
- Calculates monthly commissions based on net revenue (after Stripe fees)
- Stores in `commissions` table with status `pending`

#### C. Payout System
- **API Endpoint**: `/api/payouts/request`
- Creator can request payout when ≥€50 accumulated
- Creates Stripe transfer from Konex's account → Creator's Stripe Connect account
- Updates commissions to `paid` status

**Flow**:
```
Customer pays SaaS (€100)
    ↓
Stripe webhook detects payment
    ↓
Revenue logged in link_events (gross: €100, net: €96.55, fees: €3.45)
    ↓
Monthly commission calculated (15% of net = €14.48)
    ↓
Commission stored in `commissions` table (status: pending)
    ↓
Creator requests payout (when ≥€50)
    ↓
Stripe transfer created: Konex account → Creator's account
    ↓
Commissions marked as 'paid'
```

**Database Tables**:
- `link_events` - Revenue tracking (gross, net, fees)
- `commissions` - Calculated earnings per collaboration/month
- `commission_payouts` - Payout requests and transfers

**Status**: ✅ **WORKING** - Fully implemented

---

## WHERE MONEY SITS

### 1. Collaboration Payments (One-Time)

**Money Flow**:
```
SaaS pays €100
    ↓
Stripe holds payment temporarily
    ↓
Payment splits:
  - €10 → Konex Stripe account (platform fee)
  - €90 → Creator's Stripe Connect account (direct)
    ↓
Money sits in Creator's Stripe Connect account
    ↓
Creator can withdraw to their bank (via Stripe)
```

**Where it sits**:
- **Konex fee**: Konex's Stripe account balance
- **Creator payment**: Creator's Stripe Connect account balance
- **NOT in Konex's account** - Goes directly to creator via Connect

---

### 2. Commission Payouts (Revenue-Based)

**Money Flow**:
```
Customer pays SaaS €100
    ↓
SaaS receives €96.55 (after Stripe fees) → SaaS's Stripe account
    ↓
Commission calculated: €14.48 (15% of net)
    ↓
Commission stored as 'pending' in database
    ↓
Money sits in Konex's Stripe account (waiting for payout)
    ↓
Creator requests payout (≥€50)
    ↓
Stripe transfer: Konex account → Creator's Stripe Connect account
    ↓
Creator can withdraw to their bank
```

**Where it sits**:
- **Before payout**: Konex's Stripe account balance (pending earnings)
- **After payout**: Creator's Stripe Connect account balance
- **SaaS keeps**: Their Stripe account (net revenue minus commissions)

---

## CURRENT IMPLEMENTATION STATUS

### ✅ Fully Working

1. **Stripe Connect Setup**
   - Creator onboarding (`/api/stripe/connect`)
   - SaaS Connect (`/api/stripe/connect-saas`)
   - Status verification

2. **Collaboration Payments**
   - Checkout session creation
   - Payment processing
   - Webhook handling
   - Payment records

3. **Revenue Tracking**
   - Stripe webhook integration
   - Revenue attribution
   - Gross/net/fees tracking

4. **Commission System**
   - Monthly calculation
   - Net revenue based (after Stripe fees)
   - Auto-approval

5. **Payout System**
   - Minimum payout (€50)
   - Stripe transfer creation
   - Status tracking
   - Commission updates

6. **UI**
   - Finances page for creators
   - Earnings summary
   - Payout button
   - Stripe Connect setup

---

## WHAT'S MISSING / NEEDS FINISHING

### 🔴 Critical Issues

1. **Money Source for Payouts**
   - **Problem**: Commission payouts use `stripe.transfers.create()` which requires money to be in Konex's Stripe account
   - **Current**: Money sits in Konex's account, but we need to ensure we have enough balance
   - **Missing**: 
     - Balance checking before payout
     - Automatic collection from SaaS (currently commissions are just calculated, not collected)
     - Escrow system or payment collection mechanism

2. **Commission Collection from SaaS**
   - **Problem**: Commissions are calculated but money is NOT automatically collected from SaaS
   - **Current**: SaaS receives all revenue, commissions are just "owed"
   - **Missing**: 
     - Payment collection mechanism (charge SaaS for commissions)
     - Escrow system (hold commission amount when revenue is generated)
     - Automatic deduction system

3. **Payment Reconciliation**
   - **Missing**: Webhook to handle payout transfer status updates
   - **Missing**: Failed payout retry mechanism
   - **Missing**: Balance verification

### 🟡 Important Features

4. **Payout History**
   - **Missing**: UI to show payout history
   - **Missing**: Payout status tracking in UI
   - **Current**: Only shows pending/paid earnings, not payout history

5. **Payment Notifications**
   - **Missing**: Email notifications for payouts
   - **Missing**: Payment status updates

6. **SaaS Payment Dashboard**
   - **Missing**: View of commissions owed
   - **Missing**: Payment history for commissions
   - **Current**: Only shows commission summary, not payment tracking

7. **Refund Handling**
   - **Missing**: Handle refunds (reduce commissions)
   - **Missing**: Chargeback handling

### 🟢 Nice to Have

8. **Analytics**
   - Payment trends
   - Revenue reports
   - Commission breakdown charts

9. **Automated Payouts**
   - Scheduled payouts (e.g., monthly)
   - Auto-payout when threshold reached

10. **Multi-currency Support**
    - Currently EUR only
    - Support other currencies

---

## MONEY FLOW DIAGRAM

### Collaboration Payment
```
SaaS (€100) 
  → Stripe Checkout
    → €10 to Konex (platform fee)
    → €90 to Creator (direct via Connect)
      → Creator's Stripe Connect account
        → Creator's bank
```

### Commission Payout
```
Customer (€100)
  → SaaS Stripe account (€96.55 net)
    → Commission calculated (€14.48)
      → Stored as 'pending' in database
        → Money sits in Konex's Stripe account
          → Creator requests payout
            → Stripe transfer (€14.48)
              → Creator's Stripe Connect account
                → Creator's bank
```

---

## KEY ISSUE: Commission Collection

**The Big Problem**: 

When a customer pays €100:
1. ✅ SaaS receives €96.55 (net) in their Stripe account
2. ✅ Commission calculated: €14.48 (15% of net)
3. ❌ **BUT**: Money for commission is NOT collected from SaaS
4. ❌ **SO**: Konex needs to pay creator €14.48 from its own account
5. ❌ **PROBLEM**: Konex doesn't have this money unless we collect it

**Solutions**:

1. **Escrow System** (Recommended)
   - When revenue is generated, hold commission amount in escrow
   - Transfer to creator when payout requested
   - SaaS receives net revenue minus commission

2. **Direct Collection**
   - Charge SaaS's Stripe account for commission amount
   - Use Stripe Connect to collect from SaaS
   - Transfer to creator

3. **Pre-funded Account**
   - SaaS pre-funds account with commission amount
   - Deduct as commissions are calculated
   - Top up when balance low

---

## NEXT STEPS TO FINISH PAYMENT INTEGRATION

### Priority 1: Fix Commission Collection
1. Implement escrow or collection mechanism
2. Ensure money is available for payouts
3. Test end-to-end flow

### Priority 2: Add Missing Features
1. Payout history UI
2. Payment status webhooks
3. Balance verification

### Priority 3: Enhancements
1. Automated payouts
2. Notifications
3. Analytics

---

## Database Schema Summary

### `payments` - Collaboration payments
- One-time payments from SaaS to Creator
- Uses Stripe Connect with application fees

### `commissions` - Revenue-based earnings
- Monthly calculated commissions
- Status: `pending` → `paid`
- Linked to `commission_payouts`

### `commission_payouts` - Payout requests
- Tracks Stripe transfers to creators
- Links multiple commissions
- Status: `pending` → `processing` → `succeeded` / `failed`

### `link_events` - Revenue tracking
- Gross revenue (what customer paid)
- Net revenue (after Stripe fees)
- Stripe fees deducted

