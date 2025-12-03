# 🚀 Konex - Deployment Checklist & Pending Features

**Last Updated:** December 2024  
**Purpose:** Track what needs to be completed/configured before production deployment

---

## 📋 ENVIRONMENT VARIABLES TO CONFIGURE

These must be set in your production environment (Vercel, etc.):

### Required - Core
| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_APP_URL` | Your production domain | e.g., `https://naano.com` |

### Required - Stripe (Payments)
| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `STRIPE_SECRET_KEY` | Stripe API secret key | Stripe Dashboard > Developers > API keys |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Stripe Dashboard > Webhooks > Signing secret |
| `STRIPE_CLIENT_ID` | For Stripe Connect OAuth | Stripe Dashboard > Connect > Settings |

### Required - Email Notifications (Pending Setup)
| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `RESEND_API_KEY` | Resend API key | [resend.com](https://resend.com) > API Keys |
| `FROM_EMAIL` | Sender email address | e.g., `Konex <notifications@naano.com>` |
| `NOTIFICATION_SECRET` | Internal API auth secret | Generate a random 32+ char string |

---

## 🔗 URLs TO UPDATE FOR PRODUCTION

### 1. Tracking Domain
**Files to update:**
- `components/collaborations/revenue-tracking-setup.tsx` (line 13)
  ```typescript
  // Change from:
  trackingDomain = 'https://naano.com'
  // To your actual domain if different
  ```

- `docs/CONVERSION_TRACKING.md` - Update all `naano.com` references

### 2. App URL References
These files have fallbacks to `localhost` that will use `NEXT_PUBLIC_APP_URL` in production:
- `app/api/notifications/send/route.ts`
- `lib/notifications.ts`
- `app/auth/logout/route.ts`

**No changes needed** - just ensure `NEXT_PUBLIC_APP_URL` is set correctly.

---

## 🗄️ DATABASE MIGRATIONS TO RUN

Run these SQL scripts in Supabase SQL Editor **in order**:

### Already Required (Core)
1. `supabase/schema.sql` - Base schema (likely already done)
2. `supabase/fix-all-rls-policies.sql` - RLS policies

### Tracking System
3. `supabase/tracking-system-v2.sql` - Tracked links, events, metrics
4. `supabase/fix-tracking-always-on.sql` - Ensures tracking is always enabled

### Stripe Connect for SaaS
5. `supabase/add-stripe-connect-saas.sql` - Stripe columns for SaaS companies
6. `supabase/add-api-keys.sql` - API keys for webhook conversion tracking

### Email Notifications
7. `supabase/notification-preferences.sql` - User notification preferences

### Enable Realtime
Run this to enable real-time for messages:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

---

## ⏳ PENDING FEATURES (Not Yet Implemented)

### 1. Email Notifications Backend
**Status:** UI complete, backend needs Resend setup
**What's done:**
- ✅ Notification preferences table & UI
- ✅ Email templates in `lib/email.ts`
- ✅ API route `/api/notifications/send`
- ✅ Trigger functions in server actions

**What's needed:**
- [ ] Sign up for Resend account
- [ ] Verify your domain with Resend
- [ ] Add `RESEND_API_KEY` to environment
- [ ] Add `FROM_EMAIL` (e.g., `notifications@naano.com`)
- [ ] Add `NOTIFICATION_SECRET` (random string for internal auth)

### 2. Subscription Limits (Free/Pro Tiers)
**Status:** Not implemented
**From IMPLEMENTATION_PLAN.md Section 2.2**
- [ ] Create subscription plans in Stripe
- [ ] Add `subscription_tier` column to profiles
- [ ] Implement feature gating (e.g., max collaborations for free tier)
- [ ] Build pricing/upgrade page

### 3. Commission Calculation
**Status:** Not implemented
**From IMPLEMENTATION_PLAN.md Section 2.6**
- [ ] Calculate commissions from tracked revenue
- [ ] Creator earnings dashboard
- [ ] Payout system via Stripe Connect

### 4. Admin Approval System
**Status:** Not implemented
**From IMPLEMENTATION_PLAN.md Section 2.7**
- [ ] Admin role & dashboard
- [ ] Profile approval workflow
- [ ] Content moderation tools

### 5. Change Password
**Status:** Button exists, no functionality
**Location:** Settings page
- [ ] Create `components/settings/change-password-modal.tsx`
- [ ] Use Supabase `auth.updateUser()` API

---

## 🔧 STRIPE CONFIGURATION

### For Creator Payments (Stripe Connect)
1. Enable Stripe Connect in your Stripe Dashboard
2. Set up OAuth redirect URI: `https://YOUR_DOMAIN/api/stripe/connect/callback`
3. Configure webhook endpoint: `https://YOUR_DOMAIN/api/stripe/webhook`
4. Enable these webhook events:
   - `checkout.session.completed`
   - `account.updated`
   - `payment_intent.succeeded`

### For SaaS Revenue Tracking (Stripe Connect)
1. Set OAuth redirect URI: `https://YOUR_DOMAIN/api/stripe/connect-saas/callback`
2. Enable webhook event: `checkout.session.completed` (for automatic revenue attribution)

---

## 🌐 DOMAIN & DNS

### If using custom tracking domain
The app expects tracking links at: `YOUR_DOMAIN/c/[hash]`

Example: `https://naano.com/c/justine-acme-x7k9m2`

No subdomain needed - the `/c/` route handles tracking.

### Email DNS Records (for Resend)
After signing up for Resend, you'll need to add these DNS records:
- SPF record
- DKIM record
- DMARC record (optional but recommended)

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### Code
- [ ] Update `NEXT_PUBLIC_APP_URL` in production env
- [ ] All environment variables configured
- [ ] Test Stripe webhooks with Stripe CLI locally first

### Database
- [ ] All migrations run
- [ ] Realtime enabled for `messages` table
- [ ] RLS policies tested

### External Services
- [ ] Stripe account in live mode
- [ ] Stripe Connect enabled
- [ ] Stripe webhooks configured
- [ ] Resend account created (when ready for emails)
- [ ] Domain verified in Resend (when ready for emails)

### Testing
- [ ] Test user registration (both roles)
- [ ] Test application flow
- [ ] Test collaboration creation
- [ ] Test tracking link generation
- [ ] Test tracking link click → redirect
- [ ] Test message sending
- [ ] Test real-time notifications

---

## 📁 FILES REFERENCE

### Key Configuration Files
- `.env.local` - Local environment variables (not committed)
- `lib/stripe.ts` - Stripe configuration
- `lib/email.ts` - Email templates
- `lib/notifications.ts` - Notification triggers

### API Routes
- `/api/stripe/connect/` - Creator Stripe Connect
- `/api/stripe/connect-saas/` - SaaS Stripe Connect
- `/api/stripe/webhook` - Stripe webhook handler
- `/api/track/conversion` - Revenue tracking endpoint
- `/api/notifications/send` - Email notification handler
- `/c/[hash]` - Tracking link redirect

---

## 🆘 TROUBLESHOOTING

### "Tracking link not found"
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (needed to bypass RLS)
- Check that `tracking-system-v2.sql` migration was run

### "No attribution cookie found"
- Cookie requires same-site or proper CORS
- Test in non-private browsing mode
- In production, ensure HTTPS on both sites

### "Email not sending"
- Check `RESEND_API_KEY` is set
- Verify domain in Resend dashboard
- Check logs for specific error messages

### Real-time not working
- Enable Realtime for the table in Supabase Dashboard
- Or run: `ALTER PUBLICATION supabase_realtime ADD TABLE table_name;`

---

## 📞 Support Contacts

- **Resend:** support@resend.com
- **Stripe:** support.stripe.com
- **Supabase:** supabase.com/support

---

*This document should be updated as features are completed or requirements change.*

