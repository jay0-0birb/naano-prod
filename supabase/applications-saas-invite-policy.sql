-- =====================================================
-- Allow SaaS owners to create invitation applications
-- (needed for inviteCreator flow)
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'applications'
      AND policyname = 'SaaS can create invitations'
  ) THEN
    CREATE POLICY "SaaS can create invitations"
      ON public.applications
      FOR INSERT
      WITH CHECK (
        auth.uid() IN (
          SELECT profile_id
          FROM public.saas_companies
          WHERE id = applications.saas_id
        )
      );
  END IF;
END $$;

