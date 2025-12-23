# BP1 Implementation Status

## ✅ COMPLETED

### 1. Database Schema ✅
- **File**: `supabase/bp1-payment-system.sql`
- Created all tables:
  - `leads` - Lead tracking with plan-based pricing
  - `creator_wallets` - Pending/available balance
  - `saas_billing_debt` - Debt accumulation
  - `billing_invoices` - SaaS invoices
  - `invoice_line_items` - TVA split
  - `creator_payouts` - Payout tracking
  - `creator_invoices` - Creator invoices/receipts
- Updated existing tables:
  - `saas_companies` - Added card fields
  - `creator_profiles` - Added SIRET, TVA status
  - `link_events` - Added 'lead' event type

### 2. Helper Functions ✅
- **File**: `supabase/bp1-payment-system.sql`
- `get_lead_price_by_plan()` - Returns €2.50 / €2.00 / €1.60
- `get_creator_earnings()` - Always returns €1.20
- `calculate_naano_margin_brut()` - lead_value - 1.20
- `calculate_stripe_fees()` - 1.5% + €0.25
- Wallet and debt management functions

### 3. Billing Functions ✅
- **File**: `supabase/bp1-billing-payout.sql`
- `should_bill_saas()` - Check threshold (€100 or month-end)
- `bill_saas()` - Create invoice and update wallets
- `get_saas_to_bill()` - Get all SaaS that should be billed

### 4. Payout Functions ✅
- **File**: `supabase/bp1-billing-payout.sql`
- `can_creator_payout()` - Check if ≥€50 available
- `create_creator_payout()` - Create payout and invoice
- `get_creators_ready_for_payout()` - Get creators ready

### 5. API Endpoints ✅
- **File**: `app/api/leads/create/route.ts` - Create lead with plan-based pricing
- **File**: `app/api/billing/check-and-bill/route.ts` - Threshold billing
- **File**: `app/api/payouts/request/route.ts` - Updated for wallet system
- **File**: `app/api/stripe/setup-intent/route.ts` - Card setup
- **File**: `app/api/stripe/validate-card/route.ts` - Card validation

---

## 🚧 IN PROGRESS

### 6. Webhook Updates
- Need to update `/api/stripe/webhook/route.ts` for:
  - `payment_intent.succeeded` - Update billing invoice status
  - `transfer.created` - Update payout status
  - `transfer.paid` - Mark payout complete
  - `setup_intent.succeeded` - Mark card as validated

### 7. Link Tracking Update
- Need to update link tracking to create leads instead of conversions
- Update `/api/track/conversion/route.ts` or create `/api/track/lead/route.ts`

---

## 📋 TODO

### 8. Card Validation on Onboarding
- Block dashboard access if `card_on_file = false`
- Add card setup UI in onboarding flow
- Pre-authorization (€0 or €1) validation

### 9. Invoice Generation
- PDF generation library setup
- SaaS invoice template (generic, no creator names)
- Creator invoice/receipt template (with SIRET check)
- Store PDFs in storage

### 10. UI Updates
- Update finances page for wallet system
- Add billing dashboard for SaaS
- Add payout history
- Add invoice downloads

### 11. Automation
- Cron job for threshold billing check
- Auto-payout when ≥€50 available
- Email notifications

---

## 📁 FILES CREATED

1. `supabase/bp1-payment-system.sql` - Database schema
2. `supabase/bp1-billing-payout.sql` - Billing & payout functions
3. `app/api/leads/create/route.ts` - Lead creation
4. `app/api/billing/check-and-bill/route.ts` - Billing trigger
5. `app/api/stripe/setup-intent/route.ts` - Card setup
6. `app/api/stripe/validate-card/route.ts` - Card validation
7. `app/api/payouts/request/route.ts` - Updated for wallet system

---

## 🔄 NEXT STEPS

1. Update webhook handler for new events
2. Update link tracking to create leads
3. Add card validation blocking on dashboard
4. Implement invoice PDF generation
5. Update UI components
6. Test end-to-end flow

---

## ⚠️ MIGRATION NOTES

### Old System → New System

**Remove**:
- `commissions` table (replace with wallet system)
- `commission_payouts` table (replace with `creator_payouts`)
- `payments` table (one-time payments no longer used)
- Revenue-based commission calculation

**Keep**:
- `link_events` table (but track 'lead' instead of 'conversion')
- `tracked_links` table
- `collaborations` table
- Stripe Connect infrastructure

**New**:
- Lead-based pricing system
- Wallet system (pending/available)
- Threshold billing
- Plan-based pricing

---

## ✅ READY TO TEST

The core system is implemented. Next:
1. Run database migrations
2. Test lead creation
3. Test billing
4. Test payouts
5. Update UI

