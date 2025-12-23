# BP1.md - Complete Flow Summary

## 🎯 THE NEW MODEL IN ONE PAGE

### Key Changes:
- ❌ **OLD**: Revenue-based commissions (15% of sales)
- ✅ **NEW**: Lead-based pricing (€1.20 per lead, fixed)

- ❌ **OLD**: Monthly commission calculation
- ✅ **NEW**: Real-time lead tracking + threshold billing

- ❌ **OLD**: Variable creator earnings
- ✅ **NEW**: Fixed €1.20 per lead (always)

---

## 📊 PRICING STRUCTURE

| Plan | Monthly Subscription | Cost per Lead | Creator Gets | Naano Margin |
|------|---------------------|---------------|--------------|--------------|
| **STARTER** | €0 | €2.50 | €1.20 | €1.30 (52%) |
| **GROWTH** | €99 | €2.00 | €1.20 | €0.80 (40%) |
| **SCALE** | €199 | €1.60 | €1.20 | €0.40 (25%) |

**Key Point**: Creator always gets €1.20, regardless of SaaS plan.

---

## 🔄 COMPLETE FLOW (Step by Step)

### 1️⃣ SaaS Onboarding
```
SaaS signs up
    ↓
[BLOCKING] Card required
    ↓
Stripe Setup Intent
    ↓
Pre-authorization (€0 or €1)
    ↓
Card validated ✅
    ↓
Access granted to dashboard
    ↓
Select plan (Starter/Growth/Scale)
    ↓
If Growth/Scale: Monthly subscription created
```

**What We Keep**: Stripe Connect setup flow
**What We Add**: Card validation requirement, Setup Intent

---

### 2️⃣ Lead Generation (Real-Time)
```
User clicks creator's link
    ↓
Lead tracked in link_events
    ↓
Lead validated (technical check)
    ↓
Lead created:
  - Lead value: €2.50 / €2.00 / €1.60 (based on plan)
  - Creator earnings: €1.20 (FIXED)
  - Naano margin: calculated
    ↓
Creator wallet: pending_balance += €1.20
    ↓
SaaS debt: current_debt += lead_value
```

**What We Keep**: Link tracking, attribution system
**What We Change**: Track "leads" not "conversions", real-time updates

---

### 3️⃣ Threshold Billing (Automatic)
```
System checks every lead:
  - Is debt ≥ €100? OR
  - Is it end of month?
    ↓
YES → Trigger billing
    ↓
Create Stripe invoice
    ↓
Charge SaaS card
    ↓
Payment successful:
  ✅ Update creator wallets:
     - pending_balance → available_balance
  ✅ Generate invoice PDF (generic, no creator names)
  ✅ Reset SaaS debt to 0
  ✅ Mark leads as 'billed'
```

**What We Add**: Threshold billing logic, invoice generation, debt tracking

---

### 4️⃣ Creator Payout (Automatic or Manual)
```
Creator wallet:
  - available_balance ≥ €50?
    ↓
YES → Auto-payout OR Manual "Retirer" button
    ↓
Create payout record
    ↓
Stripe transfer: Konex → Creator's Stripe Connect
    ↓
Transfer successful:
  ✅ Update wallet: available_balance -= amount
  ✅ Generate invoice/receipt PDF
  ✅ Update payout status
```

**What We Keep**: Stripe transfer mechanism
**What We Change**: Wallet-based instead of commission-based

---

### 5️⃣ Invoice Generation (Automatic)

#### For SaaS:
```
When SaaS is billed:
  ↓
Generate PDF invoice:
  - Generic description (no creator names)
  - "Campagne d'acquisition Naano - [Period] - [X] Leads"
  - Line items:
    * Talent part: €1.20 × leads (TVA 0%)
    * Tech fee: €X × leads (TVA 20%)
  - Total TTC
    ↓
Store PDF in billing_invoices table
    ↓
Email to SaaS (optional)
```

#### For Creator:
```
When creator receives payout:
  ↓
Check creator type:
  - Has SIRET? → Generate FACTURE
  - No SIRET? → Generate RÉCÉPISSÉ/RELEVÉ
    ↓
Generate PDF:
  - If FACTURE: "Facture émise par Naano au nom et pour le compte de [Creator]"
  - If RÉCÉPISSÉ: "Rémunération pour apport d'affaires occasionnel"
  - TVA: 0% (or 20% if creator is assujetti)
    ↓
Store PDF in creator_invoices table
    ↓
Email to creator (optional)
```

**What We Add**: PDF generation, invoice templates, document storage

---

## 💰 WHERE MONEY SITS

### During Lead Generation:
```
Lead created:
  - SaaS debt: +€2.50 (not paid yet)
  - Creator pending: +€1.20 (not available yet)
  - Naano margin: +€1.30 (not received yet)
```

### After Billing (Threshold Reached):
```
40 Leads = €100 debt
  ↓
Stripe charges SaaS: €100
  ↓
Money in Konex's Stripe account: €98.25 (after Stripe fees)
  ↓
Creator wallets:
  - pending: €0
  - available: €48 (40 × €1.20)
    ↓
Naano margin: €50.25 (after Stripe fees)
```

### After Payout:
```
Creator requests payout: €50
  ↓
Stripe transfer: €50 to creator's Stripe Connect
  ↓
Money in creator's Stripe Connect account: €50
  ↓
Creator can withdraw to bank
```

---

## 🗄️ DATABASE STRUCTURE

### New Tables:
1. **`leads`** - Each lead tracked
   - `lead_value`, `creator_earnings`, `status`, `validated_at`, `billed_at`

2. **`creator_wallets`** - Creator balance
   - `pending_balance`, `available_balance`, `total_earned`

3. **`saas_billing_debt`** - SaaS debt tracking
   - `current_debt`, `last_billed_at`, `next_billing_date`

4. **`billing_invoices`** - SaaS invoices
   - `amount_ht`, `amount_ttc`, `leads_count`, `pdf_url`, `status`

5. **`invoice_line_items`** - Invoice breakdown
   - `line_type` (talent/tech), `amount_ht`, `tva_rate`, `tva_amount`

6. **`creator_payouts`** - Payout requests
   - `amount`, `status`, `stripe_transfer_id`

7. **`creator_invoices`** - Creator invoices/receipts
   - `document_type` (facture/releve), `pdf_url`, `tva_rate`

### Modified Tables:
- **`link_events`** - Add 'lead' event type
- **`saas_companies`** - Add subscription, card fields
- **`creator_profiles`** - Add SIRET, TVA status

### Removed Tables:
- **`commissions`** - Replaced by wallet system
- **`commission_payouts`** - Replaced by creator_payouts
- **`payments`** - No longer needed

---

## 🔧 API ENDPOINTS

### New:
- `POST /api/stripe/setup-intent` - Card setup
- `POST /api/stripe/validate-card` - Validate card
- `POST /api/leads/validate` - Validate lead
- `POST /api/billing/check-threshold` - Check and bill
- `GET /api/billing/invoices` - List invoices
- `GET /api/billing/invoices/:id/pdf` - Download invoice
- `GET /api/payouts/history` - Payout history
- `GET /api/payouts/invoices/:id/pdf` - Download creator invoice

### Modified:
- `POST /api/stripe/webhook` - Handle new events
- `POST /api/payouts/request` - Wallet-based payout

### Removed:
- `POST /api/stripe/checkout` - One-time payments
- Commission calculation endpoints

---

## ✅ CHECKLIST

### Infrastructure:
- [ ] Create new database tables
- [ ] Modify existing tables
- [ ] Create wallet system
- [ ] Create lead validation

### Billing:
- [ ] Threshold billing logic
- [ ] Stripe invoice creation
- [ ] Card validation
- [ ] Debt tracking

### Payout:
- [ ] Wallet balance management
- [ ] Payout requests
- [ ] Stripe transfers
- [ ] Auto-payout

### Invoices:
- [ ] PDF generation
- [ ] SaaS invoice template
- [ ] Creator invoice/receipt template
- [ ] Document storage

### UI:
- [ ] Update finances page
- [ ] Billing dashboard
- [ ] Wallet view
- [ ] Invoice download

### Automation:
- [ ] Webhook handlers
- [ ] Threshold checking (cron)
- [ ] Auto-payouts
- [ ] Email notifications

---

## 🎯 KEY DIFFERENCES SUMMARY

| Aspect | OLD Model | NEW Model (BP1) |
|--------|-----------|-----------------|
| **Pricing** | Revenue-based (15%) | Lead-based (€1.20 fixed) |
| **Calculation** | Monthly | Real-time |
| **Billing** | Monthly subscription | Threshold (€100 or month-end) |
| **Creator Payment** | Variable (15% of revenue) | Fixed (€1.20 per lead) |
| **Money Collection** | Not collected | Collected via threshold billing |
| **Invoices** | Not generated | Required (SaaS + Creator) |
| **Card Requirement** | Optional | Required (blocking) |
| **Wallet System** | No | Yes (pending/available) |

---

## 🚀 READY TO IMPLEMENT?

This is a **complete rewrite** of the payment system, but we can reuse:
- Stripe Connect infrastructure
- Link tracking system
- Database structure (with modifications)
- UI components (with modifications)

The core change is: **Revenue-based → Lead-based pricing**

