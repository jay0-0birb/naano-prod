-- Fix: Make saas_plan nullable in leads table
-- The credit system doesn't use saas_plan anymore, but the column still exists
-- This allows create_lead_with_credits to work without setting saas_plan

ALTER TABLE public.leads
ALTER COLUMN saas_plan DROP NOT NULL;

-- Set default for existing rows if needed
UPDATE public.leads
SET saas_plan = NULL
WHERE saas_plan IS NULL;
