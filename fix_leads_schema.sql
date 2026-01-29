-- 1. Add missing columns to 'leads' table to match Application logic
ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS chat_summary TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_address TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_id TEXT; -- For custom IDs like 'EG-770'

-- 2. Add missing columns to 'properties' table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'Sale';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_id TEXT;

-- 3. Ensure Row Level Security is enabled
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 4. LEAD POLICIES
DROP POLICY IF EXISTS "Users can insert their own leads" ON leads;
CREATE POLICY "Users can insert their own leads" ON leads FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own leads" ON leads;
CREATE POLICY "Users can view their own leads" ON leads FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own leads" ON leads;
CREATE POLICY "Users can update their own leads" ON leads FOR UPDATE USING (auth.uid() = user_id);

-- 5. PROPERTY POLICIES
DROP POLICY IF EXISTS "Users can insert their own properties" ON properties;
CREATE POLICY "Users can insert their own properties" ON properties FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own properties" ON properties;
CREATE POLICY "Users can view their own properties" ON properties FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own properties" ON properties;
CREATE POLICY "Users can delete their own properties" ON properties FOR DELETE USING (auth.uid() = user_id);
