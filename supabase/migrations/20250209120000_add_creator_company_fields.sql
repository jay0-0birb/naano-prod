-- Add company fields to creator_profiles for professional onboarding (legal status section).
-- Fixes: "could not find the 'company_legal_name' column of 'creator_profiles' in the schema cache"
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS company_legal_name TEXT;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS company_registration_country TEXT;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS company_tax_id TEXT;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS company_vat_number TEXT;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS company_registered_address TEXT;
