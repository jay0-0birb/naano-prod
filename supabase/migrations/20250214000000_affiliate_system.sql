-- Affiliate system: apporteur d'affaires codes and attribution
-- See docs/AFFILIATE_SYSTEM_SPEC.md

-- 1. Affiliate codes table (code is PK for FK references)
CREATE TABLE public.affiliate_codes (
  code text PRIMARY KEY,
  referrer_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enforce uppercase on insert/update
CREATE OR REPLACE FUNCTION public.affiliate_codes_uppercase()
RETURNS trigger AS $$
BEGIN
  NEW.code = upper(trim(NEW.code));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER affiliate_codes_uppercase_trigger
  BEFORE INSERT OR UPDATE ON public.affiliate_codes
  FOR EACH ROW EXECUTE PROCEDURE public.affiliate_codes_uppercase();

ALTER TABLE public.affiliate_codes ENABLE ROW LEVEL SECURITY;

-- Only admins can manage affiliate codes (policy: service role or app check on admin page)
CREATE POLICY "Anyone can read affiliate codes"
  ON public.affiliate_codes FOR SELECT
  TO authenticated
  USING ( true );

CREATE POLICY "Only admins can insert affiliate codes"
  ON public.affiliate_codes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS ( SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' )
  );

CREATE POLICY "Only admins can update affiliate codes"
  ON public.affiliate_codes FOR UPDATE
  TO authenticated
  USING (
    EXISTS ( SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' )
  );

-- 2. creator_profiles: affiliate attribution
ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS affiliate_code text REFERENCES public.affiliate_codes(code),
  ADD COLUMN IF NOT EXISTS affiliate_attributed_at timestamptz,
  ADD COLUMN IF NOT EXISTS affiliate_source text;

CREATE INDEX IF NOT EXISTS idx_creator_profiles_affiliate_code
  ON public.creator_profiles(affiliate_code) WHERE affiliate_code IS NOT NULL;

-- 3. saas_companies: affiliate attribution
ALTER TABLE public.saas_companies
  ADD COLUMN IF NOT EXISTS affiliate_code text REFERENCES public.affiliate_codes(code),
  ADD COLUMN IF NOT EXISTS affiliate_attributed_at timestamptz,
  ADD COLUMN IF NOT EXISTS affiliate_source text;

CREATE INDEX IF NOT EXISTS idx_saas_companies_affiliate_code
  ON public.saas_companies(affiliate_code) WHERE affiliate_code IS NOT NULL;

-- 4. Index for report queries (payments by paid_at within 6-month windows)
CREATE INDEX IF NOT EXISTS idx_payments_paid_at
  ON public.payments(paid_at) WHERE paid_at IS NOT NULL;

-- 5. Report function: affiliate commission per code for a month (6-month window per entity)
CREATE OR REPLACE FUNCTION public.get_affiliate_report_month(
  p_year int,
  p_month int,
  p_code_filter text DEFAULT NULL
)
RETURNS TABLE (
  code text,
  referrer_name text,
  creator_count bigint,
  company_count bigint,
  creator_earnings_cents bigint,
  company_credits_cents bigint,
  commission_cents numeric
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  month_start timestamptz;
  month_end timestamptz;
BEGIN
  month_start := date_trunc('month', make_date(p_year, p_month, 1)) AT TIME ZONE 'UTC';
  month_end := (month_start + interval '1 month' - interval '1 second');

  RETURN QUERY
  WITH ac AS (
    SELECT ac0.code, ac0.referrer_name
    FROM public.affiliate_codes ac0
    WHERE (p_code_filter IS NULL OR trim(p_code_filter) = '' OR ac0.code = upper(trim(p_code_filter)))
  ),
  creator_earnings AS (
    SELECT cp.affiliate_code AS code,
      sum(p.amount)::bigint AS cents
    FROM public.payments p
    JOIN public.collaborations c ON c.id = p.collaboration_id
    JOIN public.applications a ON a.id = c.application_id
    JOIN public.creator_profiles cp ON cp.id = a.creator_id AND cp.affiliate_code IS NOT NULL
    WHERE p.paid_at IS NOT NULL
      AND p.paid_at >= month_start AND p.paid_at <= month_end
      AND p.paid_at >= cp.affiliate_attributed_at
      AND p.paid_at < cp.affiliate_attributed_at + interval '6 months'
    GROUP BY cp.affiliate_code
  ),
  company_credits AS (
    SELECT sc.affiliate_code AS code,
      sum(p.amount)::bigint AS cents
    FROM public.payments p
    JOIN public.collaborations c ON c.id = p.collaboration_id
    JOIN public.applications a ON a.id = c.application_id
    JOIN public.saas_companies sc ON sc.id = a.saas_id AND sc.affiliate_code IS NOT NULL
    WHERE p.paid_at IS NOT NULL
      AND p.paid_at >= month_start AND p.paid_at <= month_end
      AND p.paid_at >= sc.affiliate_attributed_at
      AND p.paid_at < sc.affiliate_attributed_at + interval '6 months'
    GROUP BY sc.affiliate_code
  ),
  creator_counts AS (
    SELECT affiliate_code AS code, count(*)::bigint AS cnt
    FROM public.creator_profiles
    WHERE affiliate_code IS NOT NULL
    GROUP BY affiliate_code
  ),
  company_counts AS (
    SELECT affiliate_code AS code, count(*)::bigint AS cnt
    FROM public.saas_companies
    WHERE affiliate_code IS NOT NULL
    GROUP BY affiliate_code
  )
  SELECT
    ac.code,
    ac.referrer_name,
    coalesce(cc.cnt, 0),
    coalesce(coc.cnt, 0),
    coalesce(ce.cents, 0),
    coalesce(com.cents, 0),
    round(0.1 * (coalesce(ce.cents, 0) + coalesce(com.cents, 0)))::numeric
  FROM ac
  LEFT JOIN creator_earnings ce ON ce.code = ac.code
  LEFT JOIN company_credits com ON com.code = ac.code
  LEFT JOIN creator_counts cc ON cc.code = ac.code
  LEFT JOIN company_counts coc ON coc.code = ac.code
  ORDER BY ac.code;
END;
$$;
