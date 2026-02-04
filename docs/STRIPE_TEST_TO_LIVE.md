# Moving Stripe from Test (Sandbox) to Live

This guide walks you through switching Konex from Stripe **test mode** to **live mode** so real payments and payouts work.

---

## 1. Stripe Dashboard: Switch to Live

1. Open [Stripe Dashboard](https://dashboard.stripe.com).
2. Turn **off** test mode using the toggle in the top-right (**Test mode** → **Live**).
3. You’re now in the **Live** environment. All keys, webhooks, and products below must be created/updated in Live.

---

## 2. Get Live API Keys

1. In Live mode: **Developers → API keys**.
2. Copy:
   - **Secret key** (starts with `sk_live_`) → `STRIPE_SECRET_KEY`
   - **Publishable key** (starts with `pk_live_`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Test keys (`sk_test_`, `pk_test_`) will not work in Live.

---

## 3. Create Live Products & Prices

Test and Live have **separate** products and prices. Recreate in Live what you use in test.

| Purpose | Env variable | Where it’s used |
|--------|--------------|------------------|
| Credit subscription (base price) | `STRIPE_PRICE_CREDITS_BASE` | Credit subscription checkout |
| Creator Pro monthly | `STRIPE_PRICE_PRO_MONTHLY` | Pro subscription |
| Creator Pro annual | `STRIPE_PRICE_PRO_ANNUAL` | Pro subscription |
| SaaS Growth tier | `STRIPE_PRICE_GROWTH` | SaaS subscription |
| SaaS Scale tier | `STRIPE_PRICE_SCALE` | SaaS subscription |

**Steps:**

1. In Live: **Product catalog → Add product** (or **Prices** and attach to products).
2. Create each product/price to match your test setup (names, amounts, intervals).
3. Copy each **Price ID** (e.g. `price_xxxxx`) into the corresponding env var above.

---

## 4. Create Live Webhook

1. In Live: **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL**: `https://your-production-domain.com/api/stripe/webhook`  
   (use your real production URL, not localhost.)
3. **Events to send**: add the same events you use in test, for example:
   - `checkout.session.completed`
   - `customer.subscription.created` / `updated` / `deleted`
   - `invoice.paid` / `invoice.payment_failed`
   - `payment_intent.succeeded` / `payment_intent.payment_failed`
   - `account.updated` (Connect)
   - `transfer.created` / `transfer.paid` (payouts)
   - Any other events your webhook handler uses (see `app/api/stripe/webhook/route.ts`).
4. Create the endpoint and copy the **Signing secret** (starts with `whsec_`).
5. Set **`STRIPE_WEBHOOK_SECRET`** to this **live** signing secret in production.

Test and Live webhooks have different secrets; production must use the Live one.

---

## 5. Stripe Connect (Live)

- **Connect Client ID**: In Live, go to **Connect → Settings**. Copy the **Client ID** and set **`STRIPE_CLIENT_ID`** in production (used by `app/api/stripe/connect-saas/route.ts`).
- **Express accounts**: Connect Express accounts created in **test** do not exist in **live**. After going live:
  - Creators must complete **Connect onboarding again** (they’ll get a new `stripe_account_id`).
  - SaaS companies that use Connect must also reconnect in Live.
- Your app already creates Express accounts via the API; no code change is required. Just ensure production uses live keys and live Connect settings.

---

## 6. Environment Variables Checklist (Production)

Set these in your **production** environment (e.g. Vercel/hosting env or production `.env`). Use **live** values only.

| Variable | Example / note |
|----------|----------------|
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from **live** webhook) |
| `STRIPE_CLIENT_ID` | From Connect → Settings in **live** |
| `STRIPE_PRICE_CREDITS_BASE` | Live price ID for credit subscription |
| `STRIPE_PRICE_PRO_MONTHLY` | Live price ID for Pro monthly |
| `STRIPE_PRICE_PRO_ANNUAL` | Live price ID for Pro annual (if used) |
| `STRIPE_PRICE_GROWTH` | Live price ID for SaaS Growth |
| `STRIPE_PRICE_SCALE` | Live price ID for SaaS Scale |
| `NEXT_PUBLIC_APP_URL` | Your production URL (e.g. `https://app.konex.com`) |

After updating, redeploy so the app uses the new env vars.

---

## 7. Optional: Keep Test and Live Separate

- **Local / staging**: Keep using test keys and test webhook (e.g. Stripe CLI forward to `/api/stripe/webhook`).
- **Production**: Use only live keys, live webhook URL, and live price IDs.
- Never mix: e.g. don’t use `sk_live_` with a test webhook secret.

---

## 8. After Going Live

1. **Creators**: Ask them to open Finances/Settings and **connect Stripe** again (new live Connect onboarding).
2. **SaaS**: If they pay or use Connect, ensure they complete checkout/Connect in live (new subscriptions/cards).
3. **Webhook**: Send a test event from the Live webhook page (e.g. “Send test webhook”) and confirm your endpoint returns 2xx and that your DB/logic behaves as expected.
4. **Payments**: Run one small real payment and one test payout (if applicable) and confirm balance and webhooks.

No code changes are required in Konex to “move out of sandbox”—only configuration: live keys, live products/prices, live webhook, and live Connect client ID in production.
