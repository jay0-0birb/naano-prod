-- =====================================================
-- CREATOR PRO UNLOCK VIA NAANO POST
-- =====================================================
-- Creators unlock Pro (6 months) by posting about Naano on LinkedIn.
-- No paid subscription - post the Naano link, submit post URL, auto-unlock.
-- =====================================================

-- Table to track Naano promo post submissions (prevent duplicates)
CREATE TABLE IF NOT EXISTS public.creator_pro_promo_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  linkedin_post_url TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(creator_id, linkedin_post_url)
);

CREATE INDEX IF NOT EXISTS idx_creator_pro_promo_posts_creator_id
  ON public.creator_pro_promo_posts(creator_id);

ALTER TABLE public.creator_pro_promo_posts ENABLE ROW LEVEL SECURITY;

-- Creators can only view their own promo posts
CREATE POLICY "Creators can view own promo posts"
  ON public.creator_pro_promo_posts FOR SELECT
  USING (
    creator_id IN (
      SELECT id FROM public.creator_profiles WHERE profile_id = auth.uid()
    )
  );

-- Creators can insert their own promo posts
CREATE POLICY "Creators can insert own promo posts"
  ON public.creator_pro_promo_posts FOR INSERT
  WITH CHECK (
    creator_id IN (
      SELECT id FROM public.creator_profiles WHERE profile_id = auth.uid()
    )
  );
