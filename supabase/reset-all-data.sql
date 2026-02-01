-- =====================================================
-- RESET ALL DATA - Clean Slate for Testing
-- =====================================================
-- WARNING: This deletes ALL app data! Run only in dev/test.
-- Keeps: auth.users (you keep your login accounts)
-- Resets: profiles (onboarding_completed = false) so you go through onboarding again
-- =====================================================

BEGIN;

-- 1. Truncate in dependency order (children before parents)
-- Collaboration flow
TRUNCATE TABLE public.publication_proofs CASCADE;
TRUNCATE TABLE public.messages CASCADE;
TRUNCATE TABLE public.conversation_participants CASCADE;
TRUNCATE TABLE public.conversations CASCADE;
TRUNCATE TABLE public.payments CASCADE;

-- Billing & payouts
TRUNCATE TABLE public.invoice_line_items CASCADE;
TRUNCATE TABLE public.creator_invoices CASCADE;
TRUNCATE TABLE public.creator_payouts CASCADE;
TRUNCATE TABLE public.billing_invoices CASCADE;

-- Tracking & leads
TRUNCATE TABLE public.leads CASCADE;
TRUNCATE TABLE public.link_events CASCADE;
TRUNCATE TABLE public.tracked_links CASCADE;

-- Collaborations & applications
TRUNCATE TABLE public.collaborations CASCADE;
TRUNCATE TABLE public.applications CASCADE;

-- Wallets & debt
TRUNCATE TABLE public.creator_wallets CASCADE;
TRUNCATE TABLE public.saas_billing_debt CASCADE;

-- Other tables (may not exist - comment out if you get "relation does not exist")
DO $$ BEGIN TRUNCATE TABLE public.notification_preferences CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN TRUNCATE TABLE public.creator_pro_promo_posts CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN TRUNCATE TABLE public.saas_brands CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN TRUNCATE TABLE public.saas_tracking_config CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN TRUNCATE TABLE public.saas_credit_transactions CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN TRUNCATE TABLE public.commission_payouts CASCADE; TRUNCATE TABLE public.commissions CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN TRUNCATE TABLE public.company_inferences CASCADE; TRUNCATE TABLE public.intent_scores CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Creator & SaaS profiles (this deletes all onboarding data)
TRUNCATE TABLE public.creator_profiles CASCADE;
TRUNCATE TABLE public.saas_companies CASCADE;

-- 2. Reset profiles so users go through onboarding again (keep auth accounts)
UPDATE public.profiles
SET
  onboarding_completed = false,
  full_name = NULL,
  avatar_url = NULL,
  role = 'saas';

COMMIT;

-- Verification
SELECT '=== RESET COMPLETE ===' AS info;
SELECT 'Profiles (onboarding reset)' AS table_name, COUNT(*) AS rows FROM public.profiles
UNION ALL
SELECT 'Creator profiles', COUNT(*) FROM public.creator_profiles
UNION ALL
SELECT 'SaaS companies', COUNT(*) FROM public.saas_companies
UNION ALL
SELECT 'Applications', COUNT(*) FROM public.applications
UNION ALL
SELECT 'Collaborations', COUNT(*) FROM public.collaborations
UNION ALL
SELECT 'Leads', COUNT(*) FROM public.leads
UNION ALL
SELECT 'Link events', COUNT(*) FROM public.link_events;
