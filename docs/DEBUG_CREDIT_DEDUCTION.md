# 🔍 Debug: Credits Not Deducting

## Quick Checks

### 1. Check if function exists
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'create_lead_with_credits';
```

### 2. Check current credits
```sql
SELECT 
  id,
  company_name,
  wallet_credits
FROM saas_companies
WHERE id = 'YOUR_SAAS_ID';
```

### 3. Test the function manually
```sql
-- Replace with actual IDs from your database
SELECT create_lead_with_credits(
  'TRACKED_LINK_ID'::uuid,
  'CREATOR_ID'::uuid,
  'SAAS_ID'::uuid
);
```

### 4. Check recent leads
```sql
SELECT 
  id,
  credits_deducted,
  creator_payout_amount,
  created_at
FROM leads
ORDER BY created_at DESC
LIMIT 5;
```

### 5. Check credit transactions
```sql
SELECT 
  transaction_type,
  credits_amount,
  balance_before,
  balance_after,
  created_at
FROM saas_credit_transactions
WHERE saas_id = 'YOUR_SAAS_ID'
ORDER BY created_at DESC
LIMIT 5;
```

## Common Issues

1. **Function not called**: Check which endpoint is being hit when you click
2. **Silent error**: Check server logs for errors
3. **RLS blocking**: Make sure service role is used
4. **Wrong endpoint**: Make sure `/api/track/lead` is being called
