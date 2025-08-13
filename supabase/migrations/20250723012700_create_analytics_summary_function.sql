-- Analytics Summary Function for AnalyticsSummaryCards
-- Created: 2025-01-23 01:27:00
-- Purpose: Provide real visitor analytics data (human vs bot detection)

-- Create the analytics summary function that AnalyticsSummaryCards expects
CREATE OR REPLACE FUNCTION get_real_analytics_summary()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    final_total_visits INT;
    final_human_visits INT;
    final_bot_visits INT;
    final_today_visits INT;
    final_today_human INT;
    final_today_bot INT;
    total_from_stats INT;
    total_from_logs INT;
BEGIN
    -- Get total visits from user_visit_stats
    SELECT COALESCE(SUM(uvs.total_visits), 0) INTO total_from_stats
    FROM user_visit_stats uvs;
    
    -- Get visit counts from visit_logs with bot detection
    SELECT 
        COUNT(*) as total_logs,
        COUNT(*) FILTER (WHERE is_bot = false OR is_bot IS NULL) as human_count,
        COUNT(*) FILTER (WHERE is_bot = true) as bot_count
    INTO total_from_logs, final_human_visits, final_bot_visits
    FROM visit_logs;
    
    -- Use the higher of the two totals to ensure consistency
    final_total_visits := GREATEST(total_from_stats, total_from_logs, final_human_visits + final_bot_visits);
    
    -- Get today's data from both tables
    WITH today_stats AS (
        SELECT COALESCE(SUM(uvs.total_visits), 0) as stats_today
        FROM user_visit_stats uvs
        WHERE visit_date = CURRENT_DATE
    ),
    today_logs AS (
        SELECT 
            COUNT(*) as logs_today,
            COUNT(*) FILTER (WHERE is_bot = false OR is_bot IS NULL) as human_today,
            COUNT(*) FILTER (WHERE is_bot = true) as bot_today
        FROM visit_logs 
        WHERE DATE(created_at) = CURRENT_DATE
    )
    SELECT 
        GREATEST(ts.stats_today, tl.logs_today),
        tl.human_today,
        tl.bot_today
    INTO final_today_visits, final_today_human, final_today_bot
    FROM today_stats ts
    CROSS JOIN today_logs tl;
    
    -- Ensure human + bot doesn't exceed total (data consistency)
    IF final_human_visits + final_bot_visits > final_total_visits THEN
        final_total_visits := final_human_visits + final_bot_visits;
    END IF;
    
    -- Ensure today's data is consistent
    IF final_today_human + final_today_bot > final_today_visits THEN
        final_today_visits := final_today_human + final_today_bot;
    END IF;
    
    -- Build result matching AnalyticsSummaryCards expected structure
    result := JSON_BUILD_OBJECT(
        'totalVisits', final_total_visits,
        'humanVisits', final_human_visits,
        'botVisits', final_bot_visits,
        'todayVisits', final_today_visits,
        'todayHuman', final_today_human,
        'todayBot', final_today_bot
    );
    
    RETURN result;
END;
$$;

-- Grant execute permissions to the function
GRANT EXECUTE ON FUNCTION get_real_analytics_summary() TO anon, authenticated;

-- Add comment to track this function
COMMENT ON FUNCTION get_real_analytics_summary() IS 'Real analytics summary for dashboard - human vs bot visitor detection';

-- Create index for better performance on today's queries
CREATE INDEX IF NOT EXISTS idx_visit_logs_created_at ON visit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_visit_logs_is_bot ON visit_logs(is_bot);
CREATE INDEX IF NOT EXISTS idx_user_visit_stats_date ON user_visit_stats(visit_date DESC);
