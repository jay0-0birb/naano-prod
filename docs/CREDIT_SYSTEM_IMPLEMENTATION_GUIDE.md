# 🚀 Credit System Implementation Guide
## Step-by-Step After Database Migration

**Status**: Database migration ✅ Complete  
**Next**: Stripe Setup → Backend → Frontend

---

## 📋 STEP 1: Create Stripe Products

### A. Credit Subscription Product (Volume Pricing)

You need to create **ONE product** with **Transform Quantity** for volume pricing.

**Option 1: Via Stripe Dashboard (Recommended for testing)**
1. Go to Stripe Dashboard → Products
2. Click "Add product"
3. Name: "Naano Credits"
4. Description: "Prepaid credits for qualified clicks (1 credit = 1 click)"
5. Pricing: 
   - **Type**: Recurring
   - **Billing period**: Monthly
   - **Price**: €2.60 per unit (this is the base price)
   - **Enable Transform Quantity**: ✅ Yes
6. **Transform Quantity Rules** (for volume pricing):
   - Set up tiers in Stripe's Transform Quantity feature
   - Or use **Metered Billing** with tiered pricing

**Option 2: Via API (Better for production)**

We'll create this programmatically. See code below.

### B. Creator Pro Products

Create **TWO products**:

1. **Naano Pro Monthly**
   - Type: Recurring
   - Billing: Monthly
   - Price: €25.00

2. **Naano Pro Annual** (optional, but recommended)
   - Type: Recurring
   - Billing: Annual
   - Price: Calculate (e.g., €250/year = ~€20.83/month savings)

---

## 📋 STEP 2: Set Up Environment Variables

Add to your `.env.local`:

```env
# Stripe Product IDs (get these after creating products)
STRIPE_PRODUCT_CREDITS=prod_xxxxx
STRIPE_PRICE_CREDITS_BASE=price_xxxxx  # Base price for Transform Quantity

STRIPE_PRODUCT_PRO_MONTHLY=prod_xxxxx
STRIPE_PRICE_PRO_MONTHLY=price_xxxxx

STRIPE_PRODUCT_PRO_ANNUAL=prod_xxxxx  # Optional
STRIPE_PRICE_PRO_ANNUAL=price_xxxxx   # Optional
```

---

## 📋 STEP 3: Create API Endpoints

### A. Credit Subscription Checkout

**File**: `app/api/stripe/credit-subscription/route.ts`

This endpoint will:
- Create a Stripe Checkout session for credit subscription
- Use Transform Quantity to handle volume pricing
- Store subscription ID in database

### B. Creator Pro Subscription Checkout

**File**: `app/api/stripe/pro-subscription/route.ts`

This endpoint will:
- Create checkout for Pro (monthly or annual)
- Update creator's `is_pro` status on success

---

## 📋 STEP 4: Update Webhook Handler

**File**: `app/api/stripe/webhook/route.ts`

Add handlers for:
- `customer.subscription.updated` - Credit renewal (add credits with roll-over)
- `customer.subscription.deleted` - Subscription cancelled
- `checkout.session.completed` - Pro subscription activated

---

## 📋 STEP 5: Build Frontend Components

### A. Credit Subscription Slider (SaaS Dashboard)
- Location: `/dashboard/finances` or new `/dashboard/credits`
- Slider: 100-5000+ credits
- Show dynamic pricing
- Create subscription on submit

### B. Credit Balance Widget (SaaS Dashboard)
- Show current credits
- Show renewal date
- Health indicator (Safe/Risky/Empty)

### C. Budget Widget (Visible to Creators)
- Show on collaboration detail page
- Show on marketplace listing
- Real-time credit count
- Renewal countdown

### D. Pro Upgrade UI (Creator Dashboard)
- Banner/CTA for Standard creators
- Subscription management for Pro creators
- Benefits display

---

## 🎯 RECOMMENDED ORDER

1. ✅ **Database Migration** (DONE)
2. 🔄 **Stripe Products** (Create manually or via script)
3. 🔄 **API Endpoints** (Credit subscription + Pro subscription)
4. 🔄 **Webhook Handlers** (Credit renewal + Pro activation)
5. 🔄 **Frontend Components** (Start with credit subscription slider)

---

## 🚀 QUICK START: Let's Build the API Endpoints First

Since Stripe products can be created manually in the dashboard, let's start with the backend code. You can create the products later and just update the environment variables.

**Next Action**: Should I create the API endpoints for credit subscription and Pro subscription?
