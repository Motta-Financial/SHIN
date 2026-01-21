-- Migration: Add auth_user_id column to clients table
-- This enables UUID-based lookups instead of email-based lookups for client portal

-- Step 1: Add the auth_user_id column (nullable initially for backfill)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Step 2: Create an index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_clients_auth_user_id ON clients(auth_user_id);

-- Step 3: Backfill auth_user_id for existing clients by matching email (case-insensitive)
UPDATE clients c
SET auth_user_id = au.id
FROM auth.users au
WHERE LOWER(c.email) = LOWER(au.email)
  AND c.auth_user_id IS NULL;

-- Step 4: Verify the backfill
SELECT 
    'Total clients' as metric,
    COUNT(*) as count
FROM clients
UNION ALL
SELECT 
    'Clients with auth_user_id' as metric,
    COUNT(*) as count
FROM clients
WHERE auth_user_id IS NOT NULL
UNION ALL
SELECT 
    'Clients missing auth_user_id' as metric,
    COUNT(*) as count
FROM clients
WHERE auth_user_id IS NULL AND email IS NOT NULL;
