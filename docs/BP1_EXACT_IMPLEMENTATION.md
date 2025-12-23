# BP1.md - Exact Implementation Plan

## ✅ PRICING FROM BP1.md (EXACT)

### SaaS Plans & Lead Pricing:
| Plan | Monthly Subscription | Cost per Lead | Creator Gets | Naano Margin (Brut) |
|------|---------------------|---------------|--------------|---------------------|
| **STARTER** | **0 €** | **2,50 €** | **1,20 €** | **1,30 €** |
| **GROWTH** | **99 €** | **2,00 €** | **1,20 €** | **0,80 €** |
| **SCALE** | **199 €** | **1,60 €** | **1,20 €** | **0,40 €** |

**CRITICAL**: Lead price MUST be determined by SaaS's current plan at the time of lead creation.

---

## 🔄 EXACT FLOW (Following BP1.md)

### Step 1: Lead Generation
```
User clicks creator's link
    ↓
Lead tracked
    ↓
Get SaaS's CURRENT plan from saas_companies.subscription_tier
    ↓
Calculate lead_value based on plan:
  - 'starter' → €2.50
  - 'growth' → €2.00
  - 'scale' → €1.60
    ↓
Create lead record:
  - saas_plan: 'starter' | 'growth' | 'scale'
  - lead_value: €2.50 / €2.00 / €1.60 (based on plan)
  - creator_earnings: €1.20 (ALWAYS FIXED)
  - naano_margin_brut: lead_value - 1.20
    ↓
Update creator wallet:
  - pending_balance: +€1.20
    ↓
Update SaaS debt:
  - current_debt: +lead_value (€2.50 / €2.00 / €1.60)
```

### Step 2: Threshold Billing (SaaS → Naano)
```
Check billing trigger:
  - Debt ≥ €100? OR
  - End of month?
    ↓
YES → Get all pending leads for this SaaS
    ↓
Calculate total billing:
  - Sum all lead_values (may be mixed: some €2.50, some €2.00, etc.)
  - Example: 20 leads Starter (€2.50) + 20 leads Growth (€2.00) = €90
    ↓
Charge SaaS: Total amount (e.g., €100)
    ↓
Stripe fees: ~€1.75 (1.5% + €0.25 on €100)
    ↓
Naano receives: €100 - €1.75 = €98.25
    ↓
Update creator wallets:
  - pending_balance → available_balance
  - For each lead: +€1.20 to available
    ↓
Mark leads as 'billed'
```

### Step 3: Creator Payout (Naano → Creator)
```
Creator has available_balance ≥ €50
    ↓
Creator requests payout OR Auto-payout
    ↓
Naano transfers: available_balance to Creator's Stripe Connect
    ↓
Creator receives: Full amount (NO fees for creator)
    ↓
Generate invoice/receipt PDF for creator
```

---

## 🗄️ DATABASE SCHEMA (EXACT)

### `leads` Table
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_link_id UUID REFERENCES tracked_links(id),
  creator_id UUID REFERENCES creator_profiles(id),
  saas_id UUID REFERENCES saas_companies(id),
  
  -- CRITICAL: Plan and pricing at time of lead creation
  saas_plan TEXT NOT NULL CHECK (saas_plan IN ('starter', 'growth', 'scale')),
  lead_value DECIMAL(10, 2) NOT NULL, -- €2.50 / €2.00 / €1.60 (based on plan)
  creator_earnings DECIMAL(10, 2) NOT NULL DEFAULT 1.20, -- ALWAYS €1.20
  naano_margin_brut DECIMAL(10, 2) NOT NULL, -- lead_value - 1.20
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'billed')),
  validated_at TIMESTAMPTZ,
  billed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `saas_billing_debt` Table
```sql
CREATE TABLE saas_billing_debt (
  saas_id UUID PRIMARY KEY REFERENCES saas_companies(id),
  
  -- Current accumulated debt (sum of lead_values)
  current_debt DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  
  -- Billing threshold
  billing_threshold DECIMAL(10, 2) NOT NULL DEFAULT 100.00,
  
  -- Tracking
  last_billed_at TIMESTAMPTZ,
  next_billing_date DATE, -- End of current month
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `billing_invoices` Table
```sql
CREATE TABLE billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saas_id UUID REFERENCES saas_companies(id),
  
  -- Amounts
  amount_ht DECIMAL(10, 2) NOT NULL, -- Total before tax (sum of lead_values)
  amount_ttc DECIMAL(10, 2) NOT NULL, -- Total with tax
  
  -- Stripe
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_fee_amount DECIMAL(10, 2) NOT NULL, -- Stripe fees (~1.5% + €0.25)
  naano_received_amount DECIMAL(10, 2) NOT NULL, -- amount_ht - stripe_fee_amount
  
  -- Leads (may be mixed plans)
  leads_count INTEGER NOT NULL,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'failed')),
  paid_at TIMESTAMPTZ,
  
  -- Invoice PDF
  pdf_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `invoice_line_items` Table
```sql
CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES billing_invoices(id),
  
  line_type TEXT NOT NULL CHECK (line_type IN ('talent', 'tech_fee')),
  description TEXT NOT NULL,
  
  -- Amounts
  amount_ht DECIMAL(10, 2) NOT NULL,
  tva_rate DECIMAL(5, 2) NOT NULL, -- 0% for talent, 20% for tech
  tva_amount DECIMAL(10, 2) NOT NULL,
  amount_ttc DECIMAL(10, 2) NOT NULL,
  
  -- Details
  quantity INTEGER NOT NULL, -- Number of leads
  unit_price DECIMAL(10, 2) NOT NULL -- €1.20 for talent, varies for tech
);
```

### `creator_wallets` Table
```sql
CREATE TABLE creator_wallets (
  creator_id UUID PRIMARY KEY REFERENCES creator_profiles(id),
  
  -- Before SaaS pays
  pending_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Waiting for SaaS payment
  
  -- After SaaS pays
  available_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Ready for payout
  
  -- Lifetime
  total_earned DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔧 FUNCTIONS (EXACT FROM BP1.md)

### Get Lead Price by Plan
```sql
CREATE OR REPLACE FUNCTION get_lead_price_by_plan(plan TEXT)
RETURNS DECIMAL AS $$
BEGIN
  RETURN CASE plan
    WHEN 'starter' THEN 2.50
    WHEN 'growth' THEN 2.00
    WHEN 'scale' THEN 1.60
    ELSE 2.50 -- Default to starter
  END;
END;
$$ LANGUAGE plpgsql;
```

### Calculate Creator Earnings (Always Fixed)
```sql
CREATE OR REPLACE FUNCTION get_creator_earnings()
RETURNS DECIMAL AS $$
BEGIN
  RETURN 1.20; -- ALWAYS €1.20, never varies
END;
$$ LANGUAGE plpgsql;
```

### Calculate Naano Margin (Brut)
```sql
CREATE OR REPLACE FUNCTION calculate_naano_margin_brut(lead_value DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  -- Creator always gets €1.20
  RETURN lead_value - 1.20;
END;
$$ LANGUAGE plpgsql;
```

### Calculate Stripe Fees (From BP1.md)
```sql
CREATE OR REPLACE FUNCTION calculate_stripe_fees(amount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  -- From BP1.md: ~1.5% + €0.25 on €100 = €1.75
  -- Formula: (amount * 0.015) + 0.25
  RETURN ROUND((amount * 0.015 + 0.25)::numeric, 2);
END;
$$ LANGUAGE plpgsql;
```

---

## 📋 LEAD CREATION LOGIC (EXACT)

```typescript
// When lead is validated
async function createLead(trackedLinkId: string, creatorId: string, saasId: string) {
  // 1. Get SaaS's CURRENT plan
  const { data: saas } = await supabase
    .from('saas_companies')
    .select('subscription_tier')
    .eq('id', saasId)
    .single();
  
  const plan = saas.subscription_tier || 'starter'; // Default to starter
  
  // 2. Calculate lead_value based on plan
  const leadValue = getLeadPriceByPlan(plan); // €2.50 / €2.00 / €1.60
  
  // 3. Creator earnings (ALWAYS fixed)
  const creatorEarnings = 1.20; // NEVER varies
  
  // 4. Naano margin (brut)
  const naanoMarginBrut = leadValue - creatorEarnings;
  
  // 5. Create lead record
  await supabase.from('leads').insert({
    tracked_link_id: trackedLinkId,
    creator_id: creatorId,
    saas_id: saasId,
    saas_plan: plan, // Store plan at time of creation
    lead_value: leadValue, // Store price at time of creation
    creator_earnings: creatorEarnings, // Always €1.20
    naano_margin_brut: naanoMarginBrut,
    status: 'validated'
  });
  
  // 6. Update creator wallet (pending)
  await supabase.rpc('increment_creator_wallet_pending', {
    creator_id: creatorId,
    amount: creatorEarnings
  });
  
  // 7. Update SaaS debt
  await supabase.rpc('increment_saas_debt', {
    saas_id: saasId,
    amount: leadValue
  });
}
```

---

## 📊 BILLING EXAMPLE (Mixed Plans)

### Scenario: SaaS changes plan mid-month
```
Month starts: SaaS on Starter plan
  - 20 leads × €2.50 = €50 debt
  
Mid-month: SaaS upgrades to Growth
  - 15 leads × €2.00 = €30 debt
  
Total debt: €80

End of month: Threshold billing triggered
  - Total: €80 (mixed: 20 × €2.50 + 15 × €2.00)
  - Stripe fees: ~€1.45 (1.5% + €0.25)
  - Naano receives: €78.55
  - Creator payouts: 35 × €1.20 = €42
  - Naano margin: €78.55 - €42 = €36.55
```

**Key Point**: Each lead stores its own `saas_plan` and `lead_value` at creation time, so billing can handle mixed plans correctly.

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] **Get SaaS plan when creating lead** (CRITICAL)
- [ ] **Calculate lead_value based on CURRENT plan** (€2.50 / €2.00 / €1.60)
- [ ] **Store plan and lead_value in leads table** (for historical accuracy)
- [ ] **Always use €1.20 for creator earnings** (never varies)
- [ ] **Calculate Naano margin: lead_value - 1.20**
- [ ] **Handle mixed plans in billing** (leads from different plans)
- [ ] **Calculate Stripe fees on total billing** (1.5% + €0.25)
- [ ] **Update wallets correctly** (pending → available)
- [ ] **Generate invoices with correct line items** (talent + tech, TVA split)

---

## 🎯 KEY RULES (FROM BP1.md)

1. **Lead price = Function of SaaS plan** (MUST get plan at lead creation)
2. **Creator earnings = Always €1.20** (NEVER varies)
3. **Naano margin = lead_value - €1.20** (varies by plan)
4. **Stripe fees = 1.5% + €0.25** (on total billing, paid by Naano)
5. **Billing threshold = €100 OR end of month**
6. **Payout threshold = €50** (creator available balance)

---

## ✅ SUMMARY

**CRITICAL**: 
- Lead price MUST be determined by SaaS's CURRENT plan at lead creation
- Store plan and price in leads table for historical accuracy
- Creator always gets €1.20 (fixed, never varies)
- Handle mixed plans in billing (SaaS can change plan mid-month)

This follows BP1.md exactly!

