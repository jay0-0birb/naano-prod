# BP1.md Migration Plan - Complete Analysis

## 📊 OLD MODEL vs NEW MODEL

### OLD MODEL (Current System)
1. **Revenue-Based Commissions** - 15% of actual sales/revenue
2. **Monthly Calculation** - Commissions calculated monthly
3. **Collaboration Payments** - One-time payment from SaaS to creator
4. **Variable Earnings** - Creator earnings vary based on revenue

### NEW MODEL (BP1.md)
1. **Lead-Based Pricing** - Fixed price per lead
2. **Real-Time Tracking** - Each lead tracked immediately
3. **Threshold Billing** - Charge SaaS when debt reaches €100 OR end of month
4. **Fixed Creator Payment** - Always €1.20 per lead (regardless of SaaS plan)
5. **Wallet System** - Pending/Available balance for creators
6. **Subscription + Usage** - Monthly subscription + per-lead cost

---

## ✅ WHAT WE CAN KEEP

### 1. Infrastructure Components ✅
- **Stripe Connect** - Creator onboarding (keep)
- **Stripe Webhooks** - Payment tracking (keep, but modify)
- **Database Tables Structure** - Can be adapted:
  - `link_events` - Track leads instead of conversions
  - `creator_profiles` - Keep
  - `saas_companies` - Keep
  - `collaborations` - Keep
  - `tracked_links` - Keep

### 2. UI Components ✅
- **Finances Page** - Keep structure, modify content
- **Stripe Connect Setup** - Keep as-is
- **Dashboard** - Keep structure

### 3. Authentication & Onboarding ✅
- **User authentication** - Keep
- **Onboarding flow** - Keep (but add card requirement)

### 4. Tracking System ✅
- **Link tracking** - Keep (but track "leads" not "conversions")
- **Attribution system** - Keep
- **Cookie tracking** - Keep

---

## ❌ WHAT WE NEED TO REMOVE

### 1. Commission System (Old)
- ❌ `commissions` table - Replace with new wallet system
- ❌ `commission_payouts` table - Replace with new payout system
- ❌ `calculate_commission_for_period()` function - Remove
- ❌ Monthly commission calculation - Remove
- ❌ Revenue-based commission logic - Remove

### 2. Collaboration Payments (Old)
- ❌ `/api/stripe/checkout` - Remove (one-time payments)
- ❌ `payments` table - Remove or repurpose
- ❌ Application fee model - Remove

### 3. Revenue Tracking (Old)
- ❌ Revenue amount tracking - Replace with lead tracking
- ❌ Conversion events - Replace with lead validation
- ❌ Gross/net revenue calculation - Remove

---

## 🆕 WHAT WE NEED TO ADD

### 1. Lead Validation System
- **New Table**: `leads`
  - `id`, `tracked_link_id`, `creator_id`, `saas_id`
  - `status`: `pending` → `validated` → `billed`
  - `lead_value`: €2.50 / €2.00 / €1.60 (based on SaaS plan)
  - `creator_earnings`: €1.20 (fixed)
  - `naano_margin`: Calculated
  - `validated_at`, `billed_at`

### 2. Wallet System
- **New Table**: `creator_wallets`
  - `creator_id`
  - `pending_balance`: € (waiting for SaaS payment)
  - `available_balance`: € (ready for payout)
  - `total_earned`: € (lifetime)
  - `last_updated`

### 3. Billing System (Threshold Billing)
- **New Table**: `saas_billing_debt`
  - `saas_id`
  - `current_debt`: € (accumulated leads)
  - `last_billed_at`
  - `next_billing_date`

- **New Table**: `billing_invoices`
  - `id`, `saas_id`, `invoice_number`
  - `amount_ht`: € (before tax)
  - `amount_ttc`: € (with tax)
  - `leads_count`: Number of leads
  - `period_start`, `period_end`
  - `stripe_invoice_id`
  - `status`: `draft` → `sent` → `paid`
  - `pdf_url`: Generated invoice PDF

- **New Table**: `invoice_line_items`
  - `invoice_id`
  - `line_type`: `talent` (€1.20, TVA 0%) or `tech_fee` (€X, TVA 20%)
  - `amount_ht`, `amount_ttc`
  - `tva_rate`, `tva_amount`

### 4. Subscription System (Enhanced)
- **Enhance**: `saas_companies` table
  - Add: `subscription_plan` (starter/growth/scale)
  - Add: `subscription_status`
  - Add: `card_on_file` (boolean)
  - Add: `card_last4`, `card_brand`
  - Add: `billing_threshold`: €100 (default)

### 5. Payout System (New)
- **New Table**: `creator_payouts`
  - `id`, `creator_id`
  - `amount`: €
  - `status`: `pending` → `processing` → `completed` / `failed`
  - `stripe_transfer_id`
  - `created_at`, `completed_at`

- **New Table**: `creator_invoices` (Auto-generated)
  - `id`, `creator_id`, `payout_id`
  - `invoice_number`
  - `amount_ht`: €1.20 per lead
  - `tva_rate`: 0% (or 20% if creator is assujetti)
  - `document_type`: `facture` (if SIRET) or `releve` (if particulier)
  - `pdf_url`
  - `created_at`

### 6. Card Validation on Onboarding
- **New Requirement**: SaaS must add card before accessing dashboard
- **New API**: `/api/stripe/setup-intent` - Create setup intent
- **New API**: `/api/stripe/validate-card` - Validate card on onboarding
- **New Flow**: Pre-authorization (€0 or €1) to validate card

### 7. Threshold Billing Logic
- **New Function**: `check_and_bill_saas(saas_id)`
  - Check if debt ≥ €100 OR end of month
  - Create Stripe invoice
  - Charge SaaS card
  - Update wallet balances (pending → available)
  - Generate invoice PDF

### 8. Invoice Generation
- **New Service**: PDF generation for invoices
  - SaaS invoice (generic, no creator names)
  - Creator invoice/receipt (with creator details)
- **New Library**: Use PDF generation library (e.g., `@react-pdf/renderer` or `pdfkit`)

---

## 🔄 COMPLETE NEW FLOW

### Step 1: SaaS Onboarding
```
SaaS signs up
    ↓
Card required (blocking)
    ↓
Stripe Setup Intent created
    ↓
Card added (pre-auth €0 or €1)
    ↓
Card validated → Access granted
    ↓
Select plan (Starter/Growth/Scale)
    ↓
Subscription created (if Growth/Scale)
```

### Step 2: Lead Generation
```
Creator posts link
    ↓
User clicks link
    ↓
Lead tracked in link_events (event_type: 'lead')
    ↓
Lead validated (technical validation)
    ↓
Lead created in leads table:
  - status: 'validated'
  - lead_value: €2.50 / €2.00 / €1.60 (based on SaaS plan)
  - creator_earnings: €1.20 (fixed)
  - naano_margin: calculated
    ↓
Creator wallet updated:
  - pending_balance: +€1.20
    ↓
SaaS billing debt updated:
  - current_debt: +€2.50 / €2.00 / €1.60
```

### Step 3: Threshold Billing (Automatic)
```
System checks billing trigger:
  - Debt ≥ €100? OR
  - End of month?
    ↓
YES → Create Stripe invoice
    ↓
Charge SaaS card
    ↓
Payment successful:
  - Create billing_invoice record
  - Generate invoice PDF (generic, no creator names)
  - Update creator wallets:
    - pending_balance → available_balance
  - Reset SaaS debt to 0
  - Update lead status to 'billed'
```

### Step 4: Creator Payout
```
Creator wallet:
  - available_balance ≥ €50?
    ↓
YES → Creator clicks "Retirer" OR Auto-payout
    ↓
Create creator_payout record
    ↓
Stripe transfer: Konex → Creator's Stripe Connect
    ↓
Transfer successful:
  - Update wallet: available_balance -= amount
  - Generate creator invoice/receipt PDF
  - Update payout status to 'completed'
```

### Step 5: Invoice Generation (Automatic)
```
When SaaS is billed:
  - Generate PDF invoice
  - Store in billing_invoices.pdf_url
  - Email to SaaS (optional)

When Creator receives payout:
  - Check creator type (SIRET or particulier)
  - Generate appropriate document:
    * If SIRET: FACTURE (with mandat mention)
    * If particulier: RÉCÉPISSÉ / RELEVÉ
  - Store in creator_invoices.pdf_url
  - Email to creator (optional)
```

---

## 📋 DATABASE SCHEMA CHANGES

### Tables to CREATE:
1. `leads` - Lead tracking
2. `creator_wallets` - Creator balance tracking
3. `saas_billing_debt` - SaaS debt accumulation
4. `billing_invoices` - SaaS invoices
5. `invoice_line_items` - Invoice line items (TVA split)
6. `creator_payouts` - Payout requests
7. `creator_invoices` - Creator invoices/receipts

### Tables to MODIFY:
1. `link_events` - Change `event_type` to include 'lead'
2. `saas_companies` - Add subscription fields, card fields
3. `creator_profiles` - Add SIRET field, TVA status

### Tables to REMOVE:
1. `commissions` - Replace with wallet system
2. `commission_payouts` - Replace with creator_payouts
3. `payments` - Remove (one-time payments no longer used)

---

## 🔧 API ENDPOINTS TO CREATE/MODIFY

### New Endpoints:
1. `POST /api/stripe/setup-intent` - Create setup intent for card
2. `POST /api/stripe/validate-card` - Validate card on onboarding
3. `POST /api/leads/validate` - Validate a lead (technical)
4. `POST /api/billing/check-threshold` - Check and bill if threshold reached
5. `GET /api/billing/invoices` - Get SaaS invoices
6. `GET /api/billing/invoices/:id/pdf` - Download invoice PDF
7. `POST /api/payouts/request` - Request payout (modify existing)
8. `GET /api/payouts/history` - Get payout history
9. `GET /api/payouts/invoices/:id/pdf` - Download creator invoice/receipt

### Endpoints to Modify:
1. `POST /api/stripe/webhook` - Handle new events:
   - `invoice.payment_succeeded` - Update wallets
   - `transfer.created` - Update payout status
   - `transfer.paid` - Mark payout complete
   - `setup_intent.succeeded` - Mark card as validated

### Endpoints to Remove:
1. `POST /api/stripe/checkout` - Remove (one-time payments)
2. Commission calculation endpoints - Remove

---

## 🎯 IMPLEMENTATION PRIORITY

### Phase 1: Core Infrastructure
1. ✅ Create new database tables
2. ✅ Modify existing tables
3. ✅ Create wallet system
4. ✅ Create lead validation system

### Phase 2: Billing System
1. ✅ Threshold billing logic
2. ✅ Stripe invoice creation
3. ✅ Card validation on onboarding
4. ✅ Debt tracking

### Phase 3: Payout System
1. ✅ Wallet balance management
2. ✅ Payout requests
3. ✅ Stripe transfers
4. ✅ Auto-payout logic

### Phase 4: Invoice Generation
1. ✅ PDF generation library
2. ✅ SaaS invoice template
3. ✅ Creator invoice/receipt template
4. ✅ Document storage

### Phase 5: UI Updates
1. ✅ Update finances page
2. ✅ Add billing dashboard for SaaS
3. ✅ Add wallet view for creators
4. ✅ Add invoice download

### Phase 6: Webhooks & Automation
1. ✅ Update webhook handlers
2. ✅ Automated threshold checking (cron job)
3. ✅ Automated payouts
4. ✅ Email notifications

---

## 💰 MONEY FLOW (NEW MODEL)

### Lead Generation:
```
1 Lead generated
  ↓
SaaS debt: +€2.50 (Starter)
Creator pending: +€1.20
Naano margin: +€1.30 (pending)
```

### Billing (Threshold Reached):
```
40 Leads = €100 debt
  ↓
Stripe charges SaaS: €100
  ↓
Stripe fees: -€1.75 (Naano pays)
  ↓
Naano receives: €98.25
  ↓
Creator wallets updated:
  - 40 × €1.20 = €48 (pending → available)
  ↓
Naano margin: €50.25 (after Stripe fees)
```

### Payout:
```
Creator has €50 available
  ↓
Stripe transfer: €50 to creator
  ↓
Creator receives: €50 in Stripe Connect
  ↓
Creator can withdraw to bank
```

---

## ⚠️ CRITICAL CHANGES

1. **No more revenue tracking** - Only lead tracking
2. **Fixed creator payment** - Always €1.20, never variable
3. **Threshold billing** - Not monthly, but when debt ≥ €100 OR end of month
4. **Wallet system** - Pending vs Available balance
5. **Invoice generation** - Required for both SaaS and creators
6. **Card required** - SaaS cannot access dashboard without card
7. **Subscription + Usage** - Monthly subscription (Growth/Scale) + per-lead cost

---

## 📝 NEXT STEPS

1. Review and approve this migration plan
2. Create database migration scripts
3. Implement wallet system
4. Implement threshold billing
5. Update tracking to lead-based
6. Implement invoice generation
7. Update UI
8. Test end-to-end flow

