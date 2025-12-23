-- Add stripe_customer_id column to saas_companies table
-- Required for BP1.md card registration and billing

DO $$ 
BEGIN
  -- Check if column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'saas_companies' 
    AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE public.saas_companies 
    ADD COLUMN stripe_customer_id TEXT;
    
    -- Add index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_saas_companies_stripe_customer_id 
    ON public.saas_companies(stripe_customer_id);
    
    RAISE NOTICE 'Added stripe_customer_id column to saas_companies';
  ELSE
    RAISE NOTICE 'Column stripe_customer_id already exists';
  END IF;
END $$;

