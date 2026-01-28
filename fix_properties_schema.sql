-- RUN THIS IN SUPABASE SQL EDITOR TO FIX THE "MISSING COLUMN" ERRORS

-- 1. Add missing columns to 'properties' table safely
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS price NUMERIC,
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS data JSONB,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Ensure RLS is enabled
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 3. Ensure the policy exists (drop and recreate to be safe)
DROP POLICY IF EXISTS "Users can CRUD their own properties" ON public.properties;

CREATE POLICY "Users can CRUD their own properties" ON public.properties
FOR ALL
USING (auth.uid() = user_id);

-- 4. Grant access to authenticated users
GRANT ALL ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
