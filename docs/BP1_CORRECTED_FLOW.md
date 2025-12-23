# BP1.md - Corrected Flow with Pricing & Stripe Fees

## 🎯 KEY CORRECTIONS

### 1. Pricing Varies by SaaS Plan ✅
- **Starter**: €2.50 per lead
- **Growth**: €2.00 per lead  
- **Scale**: €1.60 per lead
- **Creator**: Always €1.20 (FIXED, regardless of plan)

### 2. Stripe Fees - Only Naano Pays ✅
- **SaaS**: Pays full lead price (NO Stripe fees)
- **Creator**: Receives €1.20 (NO Stripe fees)
- **Naano**: Pays Stripe fees on total billing amount (~1.5% + €0.25)

---

## 💰 PRICING BREAKDOWN (Per Lead)

| Plan | Lead Price (HT) | Creator Gets | Naano Margin (Brut) | Naano Pays Stripe? |
|------|----------------|--------------|---------------------|-------------------|
| **Starter** | €2.50 | €1.20 | €1.30 | ✅ Yes (on total billing) |
| **Growth** | €2.00 | €1.20 | €0.80 | ✅ Yes (on total billing) |
| **Scale** | €1.60 | €1.20 | €0.40 | ✅ Yes (on total billing) |

**Important**: Creator always gets €1.20, but lead price varies based on SaaS plan.

---

## 🔄 CORRECTED FLOW WITH STRIPE FEES

### Step 1: Lead Generation
```
User clicks creator's link
    ↓
Lead validated
    ↓
Get SaaS plan (starter/growth/scale)
    ↓
Calculate lead price:
  - Starter: €2.50
  - Growth: €2.00
  - Scale: €1.60
    ↓
Create lead record:
  - lead_value: €2.50 / €2.00 / €1.60 (based on plan)
  - creator_earnings: €1.20 (ALWAYS FIXED)
  - naano_margin_brut: €1.30 / €0.80 / €0.40
    ↓
Update creator wallet:
  - pending_balance: +€1.20
    ↓
Update SaaS debt:
  - current_debt: +€2.50 / €2.00 / €1.60
```

### Step 2: Threshold Billing (Example: 40 Leads, Starter Plan)
```
40 leads × €2.50 = €100 debt
    ↓
Stripe charges SaaS: €100 (SaaS pays full amount, NO fees)
    ↓
Stripe fees calculated: ~€1.75 (1.5% + €0.25)
    ↓
Naano receives: €100 - €1.75 = €98.25
    ↓
Creator wallets updated:
  - 40 × €1.20 = €48 (pending → available)
    ↓
Naano margin calculation:
  - Gross margin: 40 × €1.30 = €52
  - Stripe fees: -€1.75
  - Net margin: €50.25 ✅
```

### Step 3: Creator Payout
```
Creator has €50 available
    ↓
Stripe transfer: €50 to creator's Stripe Connect
    ↓
Creator receives: €50 (NO Stripe fees for creator)
    ↓
Naano pays: Stripe transfer fees (if any) - absorbed by Naano
```

---

## 📊 STRIPE FEES CALCULATION

### When Billing SaaS:
```
Total Billing Amount: €100 (40 leads × €2.50)
    ↓
Stripe Fee Calculation:
  - Percentage: 1.5% of €100 = €1.50
  - Fixed: €0.25
  - Total: €1.75
    ↓
Naano Receives: €100 - €1.75 = €98.25
    ↓
Naano Margin Breakdown:
  - Creator payouts: 40 × €1.20 = €48
  - Naano keeps: €98.25 - €48 = €50.25
```

**Key Point**: Stripe fees are deducted from Naano's margin, NOT from:
- ❌ SaaS payment (SaaS pays full €2.50 per lead)
- ❌ Creator earnings (Creator gets full €1.20 per lead)

---

## 🗄️ DATABASE SCHEMA (Updated)

### `leads` Table
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  tracked_link_id UUID REFERENCES tracked_links(id),
  creator_id UUID REFERENCES creator_profiles(id),
  saas_id UUID REFERENCES saas_companies(id),
  
  -- Pricing (varies by plan)
  saas_plan TEXT NOT NULL, -- 'starter' | 'growth' | 'scale'
  lead_value DECIMAL(10, 2) NOT NULL, -- €2.50 / €2.00 / €1.60
  creator_earnings DECIMAL(10, 2) NOT NULL DEFAULT 1.20, -- ALWAYS €1.20
  naano_margin_brut DECIMAL(10, 2) NOT NULL, -- Calculated: lead_value - 1.20
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'validated' | 'billed'
  validated_at TIMESTAMPTZ,
  billed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `billing_invoices` Table (Updated)
```sql
CREATE TABLE billing_invoices (
  id UUID PRIMARY KEY,
  saas_id UUID REFERENCES saas_companies(id),
  
  -- Amounts
  amount_ht DECIMAL(10, 2) NOT NULL, -- Total before tax (sum of lead_values)
  amount_ttc DECIMAL(10, 2) NOT NULL, -- Total with tax
  
  -- Stripe
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_fee_amount DECIMAL(10, 2) NOT NULL, -- Stripe fees paid by Naano
  naano_received_amount DECIMAL(10, 2) NOT NULL, -- amount_ht - stripe_fee_amount
  
  -- Leads
  leads_count INTEGER NOT NULL,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'sent' | 'paid'
  paid_at TIMESTAMPTZ,
  
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `invoice_line_items` Table
```sql
CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES billing_invoices(id),
  
  line_type TEXT NOT NULL, -- 'talent' | 'tech_fee'
  description TEXT NOT NULL,
  
  -- Amounts
  amount_ht DECIMAL(10, 2) NOT NULL,
  tva_rate DECIMAL(5, 2) NOT NULL, -- 0% for talent, 20% for tech
  tva_amount DECIMAL(10, 2) NOT NULL,
  amount_ttc DECIMAL(10, 2) NOT NULL,
  
  -- For talent line: €1.20 × leads_count
  -- For tech line: (lead_value - 1.20) × leads_count
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL
);
```

---

## 🔧 CALCULATION FUNCTIONS

### Get Lead Price by Plan
```sql
CREATE OR REPLACE FUNCTION get_lead_price_by_plan(plan TEXT)
RETURNS DECIMAL AS $$
BEGIN
  RETURN CASE plan
    WHEN 'starter' THEN 2.50
    WHEN 'growth' THEN 2.00
    WHEN 'scale' THEN 1.60
    ELSE 2.50
  END;
END;
$$ LANGUAGE plpgsql;
```

### Calculate Naano Margin (Brut)
```sql
CREATE OR REPLACE FUNCTION calculate_naano_margin(lead_value DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  -- Creator always gets €1.20
  RETURN lead_value - 1.20;
END;
$$ LANGUAGE plpgsql;
```

### Calculate Stripe Fees
```sql
CREATE OR REPLACE FUNCTION calculate_stripe_fees(amount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  -- 1.5% + €0.25
  RETURN ROUND((amount * 0.015 + 0.25)::numeric, 2);
END;
$$ LANGUAGE plpgsql;
```

### Calculate Naano Net Margin
```sql
CREATE OR REPLACE FUNCTION calculate_naano_net_margin(
  total_billing DECIMAL,
  creator_payouts DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  v_stripe_fees DECIMAL;
  v_naano_received DECIMAL;
BEGIN
  -- Calculate Stripe fees
  v_stripe_fees := calculate_stripe_fees(total_billing);
  
  -- Naano receives: billing - Stripe fees
  v_naano_received := total_billing - v_stripe_fees;
  
  -- Net margin: received - creator payouts
  RETURN v_naano_received - creator_payouts;
END;
$$ LANGUAGE plpgsql;
```

---

## 📋 BILLING EXAMPLE (Detailed)

### Scenario: Starter Plan, 40 Leads

**Step 1: Lead Generation**
```
40 leads created:
  - Lead value: €2.50 each
  - Creator earnings: €1.20 each (fixed)
  - Naano margin (brut): €1.30 each
  - Total debt: 40 × €2.50 = €100
```

**Step 2: Threshold Reached (€100)**
```
Stripe charges SaaS: €100
  ↓
SaaS pays: €100 (NO fees for SaaS)
  ↓
Stripe fees: calculate_stripe_fees(€100) = €1.75
  ↓
Naano receives: €100 - €1.75 = €98.25
```

**Step 3: Wallet Updates**
```
Creator wallets:
  - 40 × €1.20 = €48
  - pending_balance: €0
  - available_balance: €48
```

**Step 4: Naano Margin Calculation**
```
Gross margin: 40 × €1.30 = €52
Stripe fees: -€1.75
Creator payouts: -€48
Net margin: €52 - €1.75 - €48 = €2.25 ❌

Wait, that's wrong! Let me recalculate:

Naano receives: €98.25
Creator payouts: €48
Net margin: €98.25 - €48 = €50.25 ✅

OR:

Gross margin: €52
Stripe fees: -€1.75
Net margin: €50.25 ✅
```

**Step 5: Invoice Generation**
```
Invoice to SaaS:
  Line 1 (Talent): 40 × €1.20 = €48 (TVA 0%)
  Line 2 (Tech): 40 × €1.30 = €52 (TVA 20% = €10.40)
  Total HT: €100
  Total TVA: €10.40
  Total TTC: €110.40
```

---

## ⚠️ CRITICAL POINTS

1. **Lead Price = Function of SaaS Plan**
   - Must get SaaS plan when creating lead
   - Use `get_lead_price_by_plan()` function
   - Store in `leads.lead_value`

2. **Creator Earnings = Always €1.20**
   - Never varies
   - Not affected by SaaS plan
   - Not affected by Stripe fees

3. **Stripe Fees = Only on Naano**
   - Calculated on total billing amount
   - Deducted from Naano's margin
   - NOT deducted from SaaS payment
   - NOT deducted from creator earnings

4. **Naano Margin Calculation**
   ```
   Per Lead:
   - Gross margin = lead_value - €1.20
   - Stripe fees = calculated on total billing (not per lead)
   
   Per Billing Cycle:
   - Total billing = sum(lead_values)
   - Stripe fees = calculate_stripe_fees(total_billing)
   - Naano receives = total_billing - stripe_fees
   - Creator payouts = leads_count × €1.20
   - Net margin = naano_received - creator_payouts
   ```

---

## 🔧 IMPLEMENTATION CHECKLIST

- [ ] Update `leads` table to include `saas_plan` and `lead_value`
- [ ] Create function `get_lead_price_by_plan(plan)`
- [ ] Create function `calculate_stripe_fees(amount)`
- [ ] Update billing logic to:
  - Get SaaS plan when creating lead
  - Calculate lead price based on plan
  - Calculate Stripe fees on total billing
  - Store Stripe fees in `billing_invoices`
- [ ] Update wallet system to always use €1.20
- [ ] Update invoice generation to show correct amounts
- [ ] Test with different plans (Starter/Growth/Scale)
- [ ] Verify Stripe fees are only deducted from Naano margin

---

## ✅ SUMMARY

**Pricing**:
- ✅ Varies by SaaS plan (€2.50 / €2.00 / €1.60)
- ✅ Creator always gets €1.20 (fixed)

**Stripe Fees**:
- ✅ Only Naano pays Stripe fees
- ✅ SaaS pays full lead price (no fees)
- ✅ Creator receives full €1.20 (no fees)
- ✅ Stripe fees deducted from Naano's margin only

**Calculation**:
- ✅ Lead price = function of SaaS plan
- ✅ Naano margin (brut) = lead_price - €1.20
- ✅ Stripe fees = 1.5% + €0.25 of total billing
- ✅ Naano net margin = gross margin - Stripe fees - creator payouts

