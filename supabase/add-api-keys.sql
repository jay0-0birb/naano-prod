-- Add API key column to saas_companies table
-- This allows SaaS companies to use webhook-based conversion tracking

ALTER TABLE saas_companies 
ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;

-- Create index for fast API key lookups
CREATE INDEX IF NOT EXISTS idx_saas_companies_api_key ON saas_companies(api_key);

-- Function to generate API key for a SaaS company
CREATE OR REPLACE FUNCTION generate_saas_api_key(saas_company_id UUID)
RETURNS TEXT AS $$
DECLARE
  new_api_key TEXT;
BEGIN
  -- Generate a secure random API key (format: sk_live_xxxxx)
  new_api_key := 'sk_live_' || encode(gen_random_bytes(32), 'hex');
  
  -- Update the SaaS company with the new API key
  UPDATE saas_companies
  SET api_key = new_api_key
  WHERE id = saas_company_id;
  
  RETURN new_api_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate API keys for all existing SaaS companies (optional)
-- Uncomment the line below if you want to auto-generate keys for existing companies
-- UPDATE saas_companies SET api_key = 'sk_live_' || encode(gen_random_bytes(32), 'hex') WHERE api_key IS NULL;

-- Note: In production, you should generate API keys on-demand when a SaaS
-- enables conversion tracking, not automatically for all companies.

