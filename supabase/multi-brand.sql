-- =====================================================
-- MULTI-BRAND SUPPORT FOR SCALE PLAN
-- =====================================================
-- 1. saas_brands table
-- 2. brand_id on collaborations (which brand/link a collab promotes)
-- 3. Helper to ensure a default brand for each SaaS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.saas_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saas_id UUID NOT NULL REFERENCES public.saas_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  main_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.saas_brands ENABLE ROW LEVEL SECURITY;

-- SaaS owner can view their brands
CREATE POLICY "SaaS can view their brands"
  ON public.saas_brands FOR SELECT
  USING (
    saas_id IN (
      SELECT id FROM public.saas_companies WHERE profile_id = auth.uid()
    )
  );

-- SaaS owner can manage their brands
CREATE POLICY "SaaS can insert brands"
  ON public.saas_brands FOR INSERT
  WITH CHECK (
    saas_id IN (
      SELECT id FROM public.saas_companies WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "SaaS can update brands"
  ON public.saas_brands FOR UPDATE
  USING (
    saas_id IN (
      SELECT id FROM public.saas_companies WHERE profile_id = auth.uid()
    )
  )
  WITH CHECK (
    saas_id IN (
      SELECT id FROM public.saas_companies WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "SaaS can delete brands"
  ON public.saas_brands FOR DELETE
  USING (
    saas_id IN (
      SELECT id FROM public.saas_companies WHERE profile_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_saas_brands_saas_id
  ON public.saas_brands(saas_id);

-- =====================================================
-- 2. brand_id on collaborations
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'collaborations' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.collaborations
      ADD COLUMN brand_id UUID NULL REFERENCES public.saas_brands(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- 3. Collaboration cancellation metadata
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'collaborations' AND column_name = 'cancel_requested_by'
  ) THEN
    ALTER TABLE public.collaborations
      ADD COLUMN cancel_requested_by TEXT
      CHECK (cancel_requested_by IN ('creator', 'saas'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'collaborations' AND column_name = 'cancel_reason'
  ) THEN
    ALTER TABLE public.collaborations
      ADD COLUMN cancel_reason TEXT;
  END IF;
END $$;

-- =====================================================
-- 4. Helper: ensure default brand for a SaaS
-- =====================================================

CREATE OR REPLACE FUNCTION public.ensure_default_brand_for_saas(p_saas_id UUID)
RETURNS UUID AS $$
DECLARE
  v_brand_id UUID;
  v_company public.saas_companies%ROWTYPE;
BEGIN
  -- Try to find an existing brand
  SELECT id INTO v_brand_id
  FROM public.saas_brands
  WHERE saas_id = p_saas_id
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_brand_id IS NOT NULL THEN
    RETURN v_brand_id;
  END IF;

  -- Load SaaS company to get name + website
  SELECT * INTO v_company
  FROM public.saas_companies
  WHERE id = p_saas_id;

  IF v_company.id IS NULL THEN
    RAISE EXCEPTION 'SaaS company not found: %', p_saas_id;
  END IF;

  -- Create a default brand using company name + website
  INSERT INTO public.saas_brands (saas_id, name, main_url)
  VALUES (
    p_saas_id,
    COALESCE(v_company.company_name, 'Default Brand'),
    COALESCE(v_company.website, 'https://example.com')
  )
  RETURNING id INTO v_brand_id;

  RETURN v_brand_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

