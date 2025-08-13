-- Create system settings table for admin configuration
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default AI settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('ai_features_enabled', 'false', 'Master toggle for all AI features'),
('ai_url_analysis_enabled', 'false', 'Enable AI-powered URL analysis'),
('ai_pattern_optimization_enabled', 'false', 'Enable AI pattern optimization'),
('ai_content_generation_enabled', 'false', 'Enable AI content generation'),
('ai_threat_detection_enabled', 'false', 'Enable AI threat detection'),
('ai_usage_stats', '{"calls_today": 0, "total_calls": 0, "last_reset": null}', 'AI usage statistics');

-- Create RLS policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read system settings
CREATE POLICY "Allow authenticated read system_settings" ON system_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can update system settings (admin functions)
CREATE POLICY "Allow service role update system_settings" ON system_settings
    FOR UPDATE USING (auth.role() = 'service_role');

-- Create function to get system setting
CREATE OR REPLACE FUNCTION get_system_setting(setting_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT setting_value 
        FROM system_settings 
        WHERE setting_key = setting_name
    );
END;
$$;

-- Create function to update system setting (admin only)
CREATE OR REPLACE FUNCTION update_system_setting(setting_name TEXT, new_value JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO system_settings (setting_key, setting_value, updated_at)
    VALUES (setting_name, new_value, NOW())
    ON CONFLICT (setting_key)
    DO UPDATE SET 
        setting_value = EXCLUDED.setting_value,
        updated_at = EXCLUDED.updated_at;
    
    RETURN TRUE;
END;
$$;

-- Create function to get all AI settings
CREATE OR REPLACE FUNCTION get_ai_settings()
RETURNS TABLE(setting_key TEXT, setting_value JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT s.setting_key, s.setting_value
    FROM system_settings s
    WHERE s.setting_key LIKE 'ai_%';
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_system_setting(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_system_setting(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_settings() TO anon, authenticated;