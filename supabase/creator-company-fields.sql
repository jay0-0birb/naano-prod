-- =====================================================
-- CREATOR COMPANY FIELDS (Professional creators)
-- =====================================================
-- Adds company legal + registration details for creators
-- used during professional onboarding.
-- =====================================================

-- 1. Legal company name (raison sociale)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'creator_profiles'
      AND column_name = 'company_legal_name'
  ) THEN
    ALTER TABLE public.creator_profiles
      ADD COLUMN company_legal_name TEXT;
  END IF;
END $$;

-- 2. Country of registration (ISO code)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'creator_profiles'
      AND column_name = 'company_registration_country'
  ) THEN
    ALTER TABLE public.creator_profiles
      ADD COLUMN company_registration_country TEXT;
  END IF;
END $$;

-- 3. Tax / Commercial ID number (SIRET, EIN, Company Number, etc.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'creator_profiles'
      AND column_name = 'company_tax_id'
  ) THEN
    ALTER TABLE public.creator_profiles
      ADD COLUMN company_tax_id TEXT;
  END IF;
END $$;

-- 4. VAT number (for European companies)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'creator_profiles'
      AND column_name = 'company_vat_number'
  ) THEN
    ALTER TABLE public.creator_profiles
      ADD COLUMN company_vat_number TEXT;
  END IF;
END $$;

-- 5. Registered office address (full HQ address)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'creator_profiles'
      AND column_name = 'company_registered_address'
  ) THEN
    ALTER TABLE public.creator_profiles
      ADD COLUMN company_registered_address TEXT;
  END IF;
END $$;

