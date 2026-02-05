-- =====================================================
-- RESET ALL DATA - Clean Slate for Testing
-- =====================================================
-- WARNING: This deletes ALL app data! Run only in dev/test.
-- Deletes: ALL auth.users accounts + all app data
-- You will need to sign up again after running this.
-- Deletes: all profile data so you re-onboard from scratch
-- =====================================================

BEGIN;

-- 0. Auth - remove all Supabase auth accounts and related data
DO $$ BEGIN TRUNCATE TABLE auth.sessions CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN TRUNCATE TABLE auth.refresh_tokens CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN TRUNCATE TABLE auth.identities CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN TRUNCATE TABLE auth.users CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END $$;

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
DO $$ BEGIN TRUNCATE TABLE public.saas_billing_debt CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END $$;

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
TRUNCATE TABLE public.profiles CASCADE;

COMMIT;
