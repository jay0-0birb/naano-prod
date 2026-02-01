-- =====================================================
-- CREATOR ONBOARDING MIGRATION (from docs/onboarding.md)
-- =====================================================
-- Adds: legal_status (particulier/professionnel), SIRET, address,
--       mandate acceptance
-- =====================================================

-- 1. Add legal_status (particulier = €500 withdrawal cap, professionnel = unlimited)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'creator_profiles' AND column_name = 'legal_status'
  ) THEN
    ALTER TABLE public.creator_profiles 
    ADD COLUMN legal_status TEXT 
    CHECK (legal_status IN ('particulier', 'professionnel'))
    DEFAULT 'particulier';
  END IF;
END $$;

-- 2. Add siret_number (SIRET for professionnels; particuliers add later to unlock)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'creator_profiles' AND column_name = 'siret_number'
  ) THEN
    ALTER TABLE public.creator_profiles ADD COLUMN siret_number TEXT;
  END IF;
  -- Also support legacy 'siret' column if it exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'creator_profiles' AND column_name = 'siret'
  ) THEN
    -- siret_number is the new column; no legacy siret
  END IF;
END $$;

-- 3. Add address fields (for contract generation)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creator_profiles' AND column_name = 'first_name') THEN
    ALTER TABLE public.creator_profiles ADD COLUMN first_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creator_profiles' AND column_name = 'last_name') THEN
    ALTER TABLE public.creator_profiles ADD COLUMN last_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creator_profiles' AND column_name = 'date_of_birth') THEN
    ALTER TABLE public.creator_profiles ADD COLUMN date_of_birth DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creator_profiles' AND column_name = 'street_address') THEN
    ALTER TABLE public.creator_profiles ADD COLUMN street_address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creator_profiles' AND column_name = 'postal_code') THEN
    ALTER TABLE public.creator_profiles ADD COLUMN postal_code TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creator_profiles' AND column_name = 'city') THEN
    ALTER TABLE public.creator_profiles ADD COLUMN city TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creator_profiles' AND column_name = 'country') THEN
    ALTER TABLE public.creator_profiles ADD COLUMN country TEXT;
  END IF;
END $$;

-- 4. Add theme (Tech, Business, Lifestyle)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creator_profiles' AND column_name = 'theme') THEN
    ALTER TABLE public.creator_profiles ADD COLUMN theme TEXT;
  END IF;
END $$;

-- 5. Add mandate acceptance (for contract)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creator_profiles' AND column_name = 'mandate_accepted_at') THEN
    ALTER TABLE public.creator_profiles ADD COLUMN mandate_accepted_at TIMESTAMPTZ;
  END IF;
END $$;

-- 6. Function: Can creator withdraw? (€500 cap for particuliers without SIRET)
CREATE OR REPLACE FUNCTION can_creator_withdraw(p_creator_id UUID)
RETURNS TABLE(can_withdraw BOOLEAN, reason TEXT) AS $$
DECLARE
  v_legal_status TEXT;
  v_siret TEXT;
  v_total_withdrawn DECIMAL;
  v_available DECIMAL;
  WITHDRAWAL_CAP_PARTICULIER DECIMAL := 500.00;
BEGIN
  SELECT cp.legal_status, cp.siret_number
  INTO v_legal_status, v_siret
  FROM public.creator_profiles cp
  WHERE cp.id = p_creator_id;
  
  -- Default: can withdraw
  v_legal_status := COALESCE(v_legal_status, 'particulier');
  
  -- Professionnel or has SIRET: unlimited
  IF v_legal_status = 'professionnel' OR (v_siret IS NOT NULL AND v_siret != '') THEN
    RETURN QUERY SELECT true, 'OK'::TEXT;
    RETURN;
  END IF;
  
  -- Particulier: check €500 cap
  SELECT COALESCE(SUM(amount), 0) INTO v_total_withdrawn
  FROM public.creator_payouts
  WHERE creator_id = p_creator_id AND status = 'completed';
  
  IF v_total_withdrawn >= WITHDRAWAL_CAP_PARTICULIER THEN
    RETURN QUERY SELECT false, 
      'Félicitations pour vos 500 € de gains ! Pour débloquer votre virement et continuer, vous devez renseigner un SIRET. Pas de panique, on peut vous aider à le créer en 15 min.'::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 'OK'::TEXT;
END;
$$ LANGUAGE plpgsql;
