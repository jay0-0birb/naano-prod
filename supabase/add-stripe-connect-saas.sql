-- =====================================================
-- ADD STRIPE CONNECT FOR SAAS COMPANIES
-- =====================================================
-- This allows SaaS companies to connect their Stripe account
-- so we can automatically track revenue from referred customers.

-- Add columns to saas_companies table
ALTER TABLE saas_companies
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_connected_at TIMESTAMPTZ;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_saas_companies_stripe_account_id 
ON saas_companies(stripe_account_id);

-- Done! SaaS companies can now connect their Stripe accounts.

