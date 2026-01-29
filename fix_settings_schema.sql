-- 1. Create table for Agent Settings if it doesn't exist
CREATE TABLE IF NOT EXISTS agent_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    business_name TEXT,
    primary_color TEXT DEFAULT '#d4af37',
    concierge_intro TEXT,
    api_key TEXT,
    high_security_mode BOOLEAN DEFAULT TRUE,
    -- Knowledge Base Fields
    terms_and_conditions TEXT,
    privacy_policy TEXT,
    nda TEXT,
    location_hours TEXT,
    service_areas TEXT,
    commission_rates TEXT,
    marketing_strategy TEXT,
    team_members TEXT,
    awards TEXT,
    legal_disclaimer TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Enable RLS
ALTER TABLE agent_settings ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies
DROP POLICY IF EXISTS "Users can view their own settings" ON agent_settings;
CREATE POLICY "Users can view their own settings" ON agent_settings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON agent_settings;
CREATE POLICY "Users can update their own settings" ON agent_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id)
ON CONFLICT (user_id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    primary_color = EXCLUDED.primary_color,
    concierge_intro = EXCLUDED.concierge_intro,
    api_key = EXCLUDED.api_key,
    high_security_mode = EXCLUDED.high_security_mode,
    terms_and_conditions = EXCLUDED.terms_and_conditions,
    privacy_policy = EXCLUDED.privacy_policy,
    nda = EXCLUDED.nda,
    location_hours = EXCLUDED.location_hours,
    service_areas = EXCLUDED.service_areas,
    commission_rates = EXCLUDED.commission_rates,
    marketing_strategy = EXCLUDED.marketing_strategy,
    team_members = EXCLUDED.team_members,
    awards = EXCLUDED.awards,
    legal_disclaimer = EXCLUDED.legal_disclaimer,
    updated_at = NOW();

DROP POLICY IF EXISTS "Users can update their own settings via update" ON agent_settings;
CREATE POLICY "Users can update their own settings via update" ON agent_settings FOR UPDATE USING (auth.uid() = user_id);

-- 4. Fix Properties RLS (Ensure updates are allowed)
-- (Already handled in previous script, but good to reinforce)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can update their own properties" ON properties;
CREATE POLICY "Users can update their own properties" ON properties FOR UPDATE USING (auth.uid() = user_id);
