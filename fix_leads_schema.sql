-- 1. Add missing columns to 'leads' table to match Application logic
ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS chat_summary TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_address TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_id TEXT; -- For custom IDs like 'EG-770'

-- 2. Ensure Row Level Security is enabled
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 3. Update/Create RLS Policies
-- (We drop first to avoid "policy already exists" errors if re-running)

DROP POLICY IF EXISTS "Users can insert their own leads" ON leads;
CREATE POLICY "Users can insert their own leads" ON leads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own leads" ON leads;
CREATE POLICY "Users can view their own leads" ON leads
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own leads" ON leads;
CREATE POLICY "Users can update their own leads" ON leads
FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own leads" ON leads;
CREATE POLICY "Users can delete their own leads" ON leads
FOR DELETE
USING (auth.uid() = user_id);
