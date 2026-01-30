-- FINAL COMPREHENSIVE FIX
-- RUN THIS TO FIX "PROPERTY_ID NOT FOUND"

-- 1. Ensure 'property_id' column exists (This was the missing piece!)
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS property_id TEXT;

-- 2. Ensure all other columns exist (Just in case)
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS transaction_type TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS price NUMERIC,
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS data JSONB,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Force a Schema Cache Reload by toggling RLS
ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 4. Re-Apply Permissions
GRANT ALL ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;

-- 5. Ensure Ownership Policy
DROP POLICY IF EXISTS "Users can CRUD their own properties" ON public.properties;

CREATE POLICY "Users can CRUD their own properties" ON public.properties
FOR ALL
USING (auth.uid() = user_id);
