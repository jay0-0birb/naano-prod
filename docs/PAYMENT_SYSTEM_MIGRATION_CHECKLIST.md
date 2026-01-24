# 🎯 Payment System Migration Checklist
## From BP1 (Lead-Based) → PlanP (Credit-Based) + PlanC (Creator Pro)

**Status**: 📝 Planning Phase  
**Priority**: 🔥 Critical  
**Complexity**: ◼️◼️◼️◼️◼️ (Very High)

---

## 📋 EXECUTIVE SUMMARY

### Current System (BP1)
- **SaaS**: Pays per lead (€2.50/€2.00/€1.60 based on tier) - billed when threshold reached
- **Creator**: Gets €1.20 per lead (fixed)
- **Model**: Post-pay (debt accumulates, then billed)
- **Tiers**: SaaS subscription tiers (starter/growth/scale)

### New System (PlanP + PlanC)
- **SaaS**: Buys prepaid credits monthly (slider: 100-5000+, volume pricing €2.60→€1.60)
- **Creator**: Gets €0.90 (Standard) or €1.10 (Pro) per qualified click
- **Model**: Prepaid (credits deducted per click, hard cap at 0)
- **Tiers**: Creator Pro tier (€25/mo or free via founding/promo)

---

## 🗄️ DATABASE CHANGES

### 1. SaaS Companies Table (`saas_companies`)
- [ ] **Add `wallet_credits`** (DECIMAL, default 0) - Current credit balance
- [ ] **Add `monthly_credit_subscription`** (INTEGER) - Monthly credit volume (e.g., 1200)
- [ ] **Add `credit_renewal_date`** (DATE) - Next monthly renewal date
- [ ] **Add `stripe_subscription_id_credits`** (TEXT) - Stripe subscription for credit renewal
- [ ] **Modify `subscription_tier`** - Keep for now (may be deprecated later)
- [ ] **Migration**: Calculate initial credits for existing SaaS (if any)

### 2. Creator Profiles Table (`creator_profiles`)
- [ ] **Add `is_pro`** (BOOLEAN, default false) - Pro status flag
- [ ] **Add `pro_status_source`** (ENUM: 'PAYMENT', 'PROMO') - How Pro was activated (removed 'FOUNDING' - not needed)
- [ ] **Add `pro_expiration_date`** (TIMESTAMPTZ, nullable) - When Pro expires (null = lifetime, but not used for now)
- [ ] **Add `stripe_subscription_id_pro`** (TEXT, nullable) - Stripe subscription for Pro (if paid)
- [ ] **Modify `subscription_tier`** - Keep for backward compatibility, but use `is_pro` for logic
- [x] **Migration**: No founding members - all start as Standard

### 3. New Table: `saas_credit_transactions`
- [ ] **Create table** to track credit purchases and deductions
- [ ] Fields:
  - `id` (UUID, primary key)
  - `saas_id` (UUID, foreign key)
  - `transaction_type` (ENUM: 'purchase', 'deduction', 'rollover')
  - `credits_amount` (INTEGER) - Positive for purchase/rollover, negative for deduction
  - `balance_before` (INTEGER)
  - `balance_after` (INTEGER)
  - `related_lead_id` (UUID, nullable) - If deduction, link to lead
  - `stripe_subscription_id` (TEXT, nullable) - If purchase via subscription
  - `created_at` (TIMESTAMPTZ)

### 4. Modify `leads` Table
- [ ] **Add `credits_deducted`** (BOOLEAN, default false) - Whether credits were deducted
- [ ] **Add `creator_payout_amount`** (DECIMAL) - €0.90 or €1.10 based on creator tier at time of click
- [ ] **Keep existing fields** for backward compatibility (but won't use them)
- [x] **Migration**: No migration needed - only test data exists

### 5. Modify `creator_wallets` Table
- [ ] **Keep structure** (pending_balance, available_balance, total_earned)
- [ ] **Update logic**: Payout amount now depends on `is_pro` status
- [ ] **Migration**: Recalculate pending balances with new payout rates (if needed)

### 6. New Table: `creator_pro_subscriptions` (Optional - for tracking)
- [ ] **Create table** to track Pro subscription history
- [ ] Fields:
  - `id` (UUID)
  - `creator_id` (UUID)
  - `status` (ENUM: 'active', 'cancelled', 'expired')
  - `source` (ENUM: 'PAYMENT', 'FOUNDING', 'PROMO')
  - `started_at` (TIMESTAMPTZ)
  - `expires_at` (TIMESTAMPTZ, nullable)
  - `stripe_subscription_id` (TEXT, nullable)

---

## 💳 STRIPE INTEGRATION CHANGES

### 1. SaaS Credit Subscription
- [ ] **Create Stripe Product**: Single product with Transform Quantity for volume pricing
- [ ] **Use Stripe Transform Quantity** (metered billing) - DECIDED: Option A
- [ ] **Volume Tiers**: 100, 250, 500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 4000, 5000+
- [ ] **Webhook**: Handle `customer.subscription.updated` for credit renewal
- [ ] **On renewal**: Add credits to `wallet_credits` with unlimited roll-over (current balance + new credits)

### 2. Creator Pro Subscription
- [ ] **Create Stripe Products**: "Naano Pro Monthly" (€25/month) AND "Naano Pro Annual" (€X/year)
- [ ] **Webhook**: Handle subscription events to update `is_pro` status
- [ ] **On cancel**: Keep Pro until end of billing period, then set `is_pro = false`
- [ ] **On renewal**: Extend `pro_expiration_date` to end of new billing period

### 3. Credit Deduction Logic
- [ ] **When qualified click occurs**: Check `wallet_credits > 0`
- [ ] **If credits available**: Deduct 1 credit, create lead, pay creator
- [ ] **If credits = 0**: Block click (redirect but no payment, no lead creation)
- [ ] **Log**: Create transaction record in `saas_credit_transactions`

### 4. Creator Payout Logic
- [ ] **Update payout calculation**: Check `is_pro` status
  - If `is_pro = true`: €1.10 per click
  - If `is_pro = false`: €0.90 per click
- [ ] **Update wallet increment**: Use new payout amounts

---

## 🎨 FRONTEND CHANGES

### 1. SaaS Dashboard - Credit Management
- [ ] **New Page/Section**: Credit subscription management
- [ ] **Slider Component**: 
  - Range: 100-5000+ credits
  - Step: 50 credits
  - Show dynamic unit price based on volume
  - Show total cost
- [ ] **Credit Balance Widget**:
  - Display current `wallet_credits`
  - Show renewal date
  - Show roll-over info
  - Health indicator (🟢 >200, 🟠 <50, 🔴 0)
- [ ] **Subscription Management**:
  - View current subscription
  - Change credit volume (upgrade/downgrade)
  - Cancel subscription
- [ ] **Transaction History**: List of credit purchases/deductions

### 2. SaaS Profile (Marketplace View)
- [ ] **Budget Widget** (visible to creators):
  - Display exact credit count + status indicator (🟢 Safe >200, 🟠 Risky <50, 🔴 Empty 0)
  - Show "Renewal in X days" (real-time calculation)
  - Health indicator with color coding
  - Warning message: "Budget partagé. Premier arrivé, premier servi."
- [ ] **Location**: BOTH collaboration detail page AND marketplace listing (DECIDED: Option C)

### 3. Creator Dashboard - Pro Upgrade
- [ ] **Pro Status Banner**:
  - If Standard: Show upgrade CTA (€25/mo or annual option)
  - If Pro (Paid): Show "Membre Pro - Renouvellement le [Date]"
  - If Pro (Promo): Show "Membre Pro (Offert) 🎁 - Expire le [Date]" (1 month duration)
- [ ] **Pro Benefits Display**:
  - €1.10 vs €0.90 per click
  - Badge on profile
  - (Priority visibility can wait - filter later)
- [ ] **Stripe Checkout**: Create subscription for Pro (monthly or annual)

### 4. Creator Profile (Marketplace)
- [ ] **Pro Badge**: Display "Pro" badge if `is_pro = true`
- [ ] **Sorting**: Can wait - maybe add filter later (DECIDED: not priority)

### 5. Finances Page Updates
- [ ] **Creator View**:
  - Update payout amounts to show €0.90 or €1.10
  - Show Pro status and benefits
- [ ] **SaaS View**:
  - Remove old billing debt display
  - Add credit balance and subscription info

### 6. Collaboration Pages
- [ ] **Show Budget Widget**: Display SaaS credit balance to creators (real-time)
- [ ] **Block Posting**: If credits = 0, disable post submission completely with clear message (DECIDED: Option A)

---

## ⚙️ BACKEND LOGIC CHANGES

### 1. Lead Creation (`/api/track/lead` or similar)
- [ ] **Check Credits**: Before creating lead, verify `wallet_credits > 0`
- [ ] **Deduct Credit**: If available, deduct 1 credit
- [ ] **Create Transaction**: Log in `saas_credit_transactions`
- [ ] **Create Lead**: With new payout amount based on creator `is_pro`
- [ ] **Update Wallet**: Increment creator wallet with correct amount (€0.90 or €1.10)
- [ ] **Block if 0**: If credits = 0, return error but still redirect (no payment)

### 2. Qualified Click Validation
- [ ] **Update validation logic**: Check credits before paying
- [ ] **Payout Calculation**: Use `is_pro` to determine amount
- [ ] **Migration**: Handle old leads (pre-credit system) gracefully

### 3. Credit Renewal (Webhook)
- [ ] **On subscription renewal**: 
  - Get current `wallet_credits` (unlimited roll-over - keep all unused credits)
  - Add `monthly_credit_subscription` credits
  - Update `credit_renewal_date`
  - Create transaction record (type: 'rollover' for the addition)
- [ ] **On subscription cancellation**: 
  - Credits remain until renewal date (DECIDED: Option A)
  - No immediate action needed

### 4. Creator Pro Status Check
- [ ] **Helper function**: `isCreatorPro(creatorId)` - checks `is_pro` and expiration
- [ ] **Use everywhere**: Replace hardcoded €1.20 with dynamic calculation (€0.90 or €1.10)
- [ ] **Expiration check**: If `pro_expiration_date` is past, set `is_pro = false`
- [ ] **Payout calculation**: Use rate at time of click (DECIDED: Option B) - store `creator_payout_amount` in lead

### 5. Admin Tools
- [x] **DECIDED**: Not needed yet (can add later if needed)
- [ ] **Future**: Grant Pro Access endpoint (if needed later)
  - Set `is_pro = true`
  - Set `pro_status_source = 'PROMO'`
  - Set `pro_expiration_date` to 1 month from now (promo duration)

---

## 📊 MIGRATION STRATEGY

### Phase 1: Database Setup
- [ ] Run SQL migrations to add new columns/tables
- [ ] Set default values for existing records
- [ ] Create indexes for performance

### Phase 2: Stripe Setup
- [ ] Create Stripe products for credit subscriptions
- [ ] Create Stripe product for Creator Pro
- [ ] Test webhook endpoints

### Phase 3: Backend Logic
- [ ] Implement credit deduction logic
- [ ] Update payout calculation
- [ ] Implement Pro status checks
- [ ] Update webhook handlers

### Phase 4: Frontend
- [ ] Build credit subscription slider
- [ ] Build credit balance widget
- [ ] Build Pro upgrade UI
- [ ] Update marketplace displays
- [ ] Update finances pages

### Phase 5: Testing
- [ ] Test credit purchase flow
- [ ] Test credit deduction on click
- [ ] Test Pro subscription
- [ ] Test Pro payout difference
- [ ] Test hard cap (0 credits)
- [ ] Test roll-over logic
- [ ] Test renewal webhook

### Phase 6: Migration of Existing Data
- [x] **DECIDED**: Start fresh - no migration needed (only test data)
- [x] **DECIDED**: All creators start as Standard (€0.90)
- [x] **DECIDED**: Implement new system cleanly, ignore old test leads

---

## ✅ DECISIONS MADE

### 1. Migration Strategy for Existing SaaS
- **✅ DECIDED**: **Option C** - Force migration - all SaaS must set up credit subscription
- **Rationale**: Platform not deployed yet, only test data exists

### 2. Migration Strategy for Existing Creators
- **✅ DECIDED**: **Option A** - All existing creators start as Standard (€0.90)
- **Rationale**: No founding members needed, all start equal

### 3. Existing Leads/Commissions
- **✅ DECIDED**: Implement new system cleanly, ignore old test leads
- **Rationale**: Only test data exists, no need to migrate

### 4. Old Billing System
- **✅ DECIDED**: **Option A** - Remove old billing system completely
- **Rationale**: Full commitment to new payment plan

### 5. Creator Pro Details
- **✅ Promo Pro Duration**: 1 month
- **✅ Pro Trial**: No free trials
- **✅ Pro Cancellation**: Keep Pro until end of billing period (Option A)

### 6. Credit System Details
- **✅ Minimum Purchase**: Follow planP (100 credits minimum)
- **✅ Maximum Credits**: Follow planP (5000+ credits)
- **✅ Roll-over Limits**: **RECOMMENDATION**: Unlimited roll-over (they paid for credits, should keep them)
- **✅ Credit Expiration**: **RECOMMENDATION**: Credits never expire (prepaid, roll over indefinitely)

### 7. Budget Visibility
- **✅ Update Frequency**: Real-time updates required
- **✅ Display Format**: **RECOMMENDATION**: Show exact credit count + status indicator (Safe/Risky/Empty) for best UX

### 8. Marketplace & UI
- **✅ Pro-First Sorting**: Can wait (maybe add filter later)
- **✅ Budget Widget Location**: Both collaboration detail page AND marketplace listing
- **✅ Post Blocking**: Block post submission completely when credits = 0 (Option A)

### 9. Stripe & Payments
- **✅ Credit Subscription**: Stripe Transform Quantity (metered billing) - Option A
- **✅ Pro Subscription**: Both monthly (€25/mo) and annual options - Option C

### 10. Testing & Deployment
- **✅ Test Environment**: Stripe test account available
- **✅ Migration Window**: Gradual rollout with feature flags (safer than big bang)

### 11. Edge Cases
- **✅ SaaS Cancels Mid-Month**: Credits remain until renewal date (Option A)
- **✅ Creator Pro Expires Mid-Collaboration**: All leads use rate at time of click (Option B)

### 12. Admin Tools
- **✅ Admin Interface**: Not needed yet (can add later if needed)

---

## 📝 DOCUMENTATION UPDATES

- [ ] Update `PAYMENT_SUMMARY.md` with new credit-based flow
- [ ] Update `COMMISSION_SYSTEM.md` (mark as deprecated or remove)
- [ ] Update `CREATOR_PAYOUT_FLOW.md` with Pro tier info
- [ ] Create `CREDIT_SYSTEM.md` - New documentation
- [ ] Create `CREATOR_PRO_SYSTEM.md` - Pro tier documentation
- [ ] Update `STRIPE_ACCOUNT_SETUP.md` with new products
- [ ] Update API documentation for new endpoints
- [ ] Update user-facing documentation

---

## 🧪 TESTING CHECKLIST

### Credit System
- [ ] SaaS can purchase credits via slider
- [ ] Credits are added to wallet on purchase
- [ ] Credits are deducted on qualified click
- [ ] Click is blocked when credits = 0
- [ ] Roll-over works (unused credits carry over)
- [ ] Renewal adds credits correctly
- [ ] Transaction history is accurate

### Creator Pro
- [ ] Creator can subscribe to Pro (€25/mo)
- [ ] Pro status is activated on payment
- [ ] Pro creator gets €1.10 per click
- [ ] Standard creator gets €0.90 per click
- [ ] Pro expires correctly on cancel
- [ ] Admin can grant Pro access
- [ ] Founding member Pro works (lifetime)
- [ ] Promo Pro works (temporary)

### Integration
- [ ] Marketplace shows credit balance to creators
- [ ] Budget widget updates in real-time
- [ ] Pro badge appears on creator profiles
- [ ] Pro creators appear first in marketplace (if implemented)
- [ ] Finances page shows correct amounts
- [ ] Payout works with new amounts

---

## 🎯 PRIORITY ORDER

### Must Have (MVP)
1. Database schema changes
2. Credit deduction logic (hard cap at 0)
3. Creator Pro status system
4. Payout calculation update (€0.90/€1.10)
5. SaaS credit subscription (slider + Stripe)
6. Credit balance widget (SaaS dashboard)
7. Budget widget (visible to creators)

### Should Have
8. Pro upgrade UI for creators
9. Pro badge on profiles
10. Roll-over logic
11. Transaction history
12. Admin Pro grant tool

### Nice to Have
13. Marketplace sorting (Pro first)
14. Advanced analytics for credits
15. Credit usage predictions
16. Email notifications for low credits

---

## 📅 ESTIMATED EFFORT

- **Database Changes**: 4-6 hours
- **Stripe Integration**: 6-8 hours
- **Backend Logic**: 12-16 hours
- **Frontend Components**: 16-20 hours
- **Testing & Bug Fixes**: 8-12 hours
- **Documentation**: 4-6 hours
- **Migration & Deployment**: 4-6 hours

**Total**: ~54-74 hours (1.5-2 weeks for 1 developer)

---

## 📝 IMPLEMENTATION NOTES

### Recommendations Made (Auto-Decided)
1. **Roll-over Limits**: Unlimited roll-over (credits never expire, they paid for them)
2. **Credit Expiration**: Credits never expire (prepaid model)
3. **Budget Display**: Show exact credit count + status indicator (best UX)
4. **Feature Flags**: Use gradual rollout with feature flags for safer deployment

### Technical Decisions
- **Stripe Transform Quantity**: Use for volume pricing (single product, dynamic pricing)
- **Pro Subscription**: Support both monthly and annual
- **Real-time Updates**: Use Supabase real-time subscriptions for credit balance
- **Payout Rate**: Store in lead record at time of click (historical accuracy)

---

## 🔄 NEXT STEPS

1. ✅ **All decisions made** - Ready to start implementation
2. **Create feature branch**: `feature/credit-system-migration`
3. **Start with Phase 1**: Database schema changes
4. **Iterate through phases** systematically
5. **Test thoroughly** before merging

---

**Last Updated**: 2026-01-24  
**Status**: ✅ All decisions made - Ready to implement
