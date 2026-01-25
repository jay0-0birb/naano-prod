-- =====================================================
-- AUTO-GENERATE API KEYS FOR ALL SAAS COMPANIES
-- =====================================================
-- This migration:
-- 1. Generates API keys for all existing SaaS companies
-- 2. Creates a trigger to auto-generate API keys for new companies
-- =====================================================

-- Step 1: Ensure API key column exists
ALTER TABLE saas_companies 
ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;

-- Step 2: Create index for fast API key lookups
CREATE INDEX IF NOT EXISTS idx_saas_companies_api_key ON saas_companies(api_key);

-- Step 3: Function to generate a unique API key
CREATE OR REPLACE FUNCTION generate_unique_api_key()
RETURNS TEXT AS $$
DECLARE
  new_api_key TEXT;
  key_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a secure random API key (format: sk_live_xxxxx)
    new_api_key := 'sk_live_' || encode(gen_random_bytes(32), 'hex');
    
    -- Check if key already exists (should be very rare)
    SELECT EXISTS(SELECT 1 FROM saas_companies WHERE api_key = new_api_key) INTO key_exists;
    
    -- If key is unique, exit loop
    EXIT WHEN NOT key_exists;
  END LOOP;
  
  RETURN new_api_key;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Generate API keys for ALL existing SaaS companies that don't have one
UPDATE saas_companies
SET api_key = generate_unique_api_key()
WHERE api_key IS NULL;

-- Step 5: Create trigger function to auto-generate API key on INSERT
CREATE OR REPLACE FUNCTION auto_generate_saas_api_key()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if api_key is NULL (allows manual override if needed)
  IF NEW.api_key IS NULL THEN
    NEW.api_key := generate_unique_api_key();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger that fires BEFORE INSERT
DROP TRIGGER IF EXISTS trigger_auto_generate_saas_api_key ON saas_companies;
CREATE TRIGGER trigger_auto_generate_saas_api_key
  BEFORE INSERT ON saas_companies
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_saas_api_key();

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that all companies now have API keys
SELECT 
  COUNT(*) as total_companies,
  COUNT(api_key) as companies_with_api_key,
  COUNT(*) - COUNT(api_key) as companies_without_api_key
FROM saas_companies;

-- Show a sample of generated keys (first 5)
SELECT 
  company_name,
  LEFT(api_key, 20) || '...' as api_key_preview,
  LENGTH(api_key) as key_length
FROM saas_companies
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- DONE! ✅
-- =====================================================
-- 
-- Now:
-- 1. All existing SaaS companies have API keys
-- 2. All NEW SaaS companies will automatically get API keys
-- 3. API keys are unique and secure (64 hex characters)
--
-- Usage in webhook:
-- Authorization: Bearer sk_live_xxxxx...
-- =====================================================
