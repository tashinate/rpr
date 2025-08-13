-- Database Performance Optimization for URL Registry
-- Fixes: Slow URL resolution (>500ms) with proper indexing

-- Create optimized composite index for active URL lookups
-- This will dramatically improve registry lookup performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_url_registry_hash_active 
ON url_registry (url_hash) 
WHERE is_active = true AND expires_at > NOW();

-- Create index for license-based lookups (for rate limiting)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_url_registry_license_active
ON url_registry (license_key_id, created_at)
WHERE is_active = true AND expires_at > NOW();

-- Create index for expiration cleanup job
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_url_registry_expired
ON url_registry (expires_at)
WHERE is_active = true;

-- Create index for audit/analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_url_registry_created_date
ON url_registry (DATE(created_at), license_key_id);

-- Add pattern usage tracking table for pattern rotation
CREATE TABLE IF NOT EXISTS pattern_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_type VARCHAR(50) NOT NULL,
    pattern_signature TEXT NOT NULL,
    usage_count BIGINT DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Composite unique constraint
    CONSTRAINT unique_pattern_signature UNIQUE (pattern_type, pattern_signature)
);

-- Index for pattern usage queries
CREATE INDEX IF NOT EXISTS idx_pattern_usage_active
ON pattern_usage_stats (pattern_type, usage_count DESC, last_used_at DESC)
WHERE is_active = true;

-- Create function to update pattern usage statistics
CREATE OR REPLACE FUNCTION update_pattern_usage(
    pattern_type_input VARCHAR(50),
    pattern_signature_input TEXT,
    success BOOLEAN DEFAULT true
) RETURNS void AS $$
BEGIN
    INSERT INTO pattern_usage_stats (pattern_type, pattern_signature, usage_count, success_rate, last_used_at)
    VALUES (
        pattern_type_input, 
        pattern_signature_input, 
        1, 
        CASE WHEN success THEN 100.00 ELSE 0.00 END, 
        NOW()
    )
    ON CONFLICT (pattern_type, pattern_signature)
    DO UPDATE SET
        usage_count = pattern_usage_stats.usage_count + 1,
        success_rate = CASE 
            WHEN success THEN 
                ((pattern_usage_stats.success_rate * pattern_usage_stats.usage_count) + 100.00) / (pattern_usage_stats.usage_count + 1)
            ELSE 
                ((pattern_usage_stats.success_rate * pattern_usage_stats.usage_count) + 0.00) / (pattern_usage_stats.usage_count + 1)
        END,
        last_used_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to get pattern overuse alerts (80% threshold)
CREATE OR REPLACE FUNCTION get_overused_patterns(threshold_percent DECIMAL DEFAULT 80.0)
RETURNS TABLE (
    pattern_type VARCHAR(50),
    pattern_signature TEXT,
    usage_count BIGINT,
    success_rate DECIMAL(5,2),
    overuse_score DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.pattern_type,
        p.pattern_signature,
        p.usage_count,
        p.success_rate,
        -- Calculate overuse score based on usage frequency and recency
        CASE 
            WHEN p.last_used_at > NOW() - INTERVAL '1 hour' THEN
                (p.usage_count::DECIMAL / GREATEST(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600, 1)) * 10
            ELSE
                (p.usage_count::DECIMAL / GREATEST(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 86400, 1))
        END as overuse_score
    FROM pattern_usage_stats p
    WHERE 
        p.is_active = true 
        AND p.usage_count > 100  -- Minimum usage threshold
        AND (
            -- High frequency in last hour
            (p.last_used_at > NOW() - INTERVAL '1 hour' AND 
             (p.usage_count::DECIMAL / GREATEST(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600, 1)) * 10 >= threshold_percent)
            OR
            -- High daily usage
            (p.usage_count::DECIMAL / GREATEST(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 86400, 1) >= threshold_percent / 10)
        )
    ORDER BY overuse_score DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Create function to deactivate overused patterns
CREATE OR REPLACE FUNCTION deactivate_overused_patterns(threshold_percent DECIMAL DEFAULT 80.0)
RETURNS INTEGER AS $$
DECLARE
    deactivated_count INTEGER := 0;
    pattern_record RECORD;
BEGIN
    FOR pattern_record IN 
        SELECT * FROM get_overused_patterns(threshold_percent)
    LOOP
        UPDATE pattern_usage_stats 
        SET 
            is_active = false,
            updated_at = NOW()
        WHERE 
            pattern_type = pattern_record.pattern_type 
            AND pattern_signature = pattern_record.pattern_signature
            AND is_active = true;
        
        deactivated_count := deactivated_count + 1;
        
        -- Log the deactivation (could be sent to monitoring)
        RAISE NOTICE 'Deactivated overused pattern: % - % (usage: %, score: %)', 
            pattern_record.pattern_type, 
            pattern_record.pattern_signature, 
            pattern_record.usage_count,
            pattern_record.overuse_score;
    END LOOP;
    
    RETURN deactivated_count;
END;
$$ LANGUAGE plpgsql;

-- Create rate limiting tracking table
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key_id UUID NOT NULL REFERENCES license_keys(id) ON DELETE CASCADE,
    operation_type VARCHAR(50) NOT NULL, -- 'url_generation', 'url_access', etc.
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Composite unique constraint for time windows
    CONSTRAINT unique_license_operation_window UNIQUE (license_key_id, operation_type, window_start)
);

-- Index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_license_operation
ON rate_limit_tracking (license_key_id, operation_type, window_start DESC);

-- Create function to check and update rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    license_key_id_input UUID,
    operation_type_input VARCHAR(50),
    limit_per_hour INTEGER DEFAULT 1000,
    limit_per_minute INTEGER DEFAULT 50
) RETURNS JSON AS $$
DECLARE
    current_hour_start TIMESTAMP WITH TIME ZONE;
    current_minute_start TIMESTAMP WITH TIME ZONE;
    hourly_count INTEGER := 0;
    minute_count INTEGER := 0;
    result JSON;
BEGIN
    -- Calculate current time windows
    current_hour_start := date_trunc('hour', NOW());
    current_minute_start := date_trunc('minute', NOW());
    
    -- Check hourly limit
    SELECT COALESCE(SUM(request_count), 0) INTO hourly_count
    FROM rate_limit_tracking
    WHERE 
        license_key_id = license_key_id_input
        AND operation_type = operation_type_input
        AND window_start >= current_hour_start;
    
    -- Check minute limit
    SELECT COALESCE(SUM(request_count), 0) INTO minute_count
    FROM rate_limit_tracking
    WHERE 
        license_key_id = license_key_id_input
        AND operation_type = operation_type_input
        AND window_start >= current_minute_start;
    
    -- Check if limits exceeded
    IF hourly_count >= limit_per_hour THEN
        result := json_build_object(
            'allowed', false,
            'reason', 'hourly_limit_exceeded',
            'current_count', hourly_count,
            'limit', limit_per_hour,
            'reset_time', current_hour_start + INTERVAL '1 hour'
        );
    ELSIF minute_count >= limit_per_minute THEN
        result := json_build_object(
            'allowed', false,
            'reason', 'minute_limit_exceeded',
            'current_count', minute_count,
            'limit', limit_per_minute,
            'reset_time', current_minute_start + INTERVAL '1 minute'
        );
    ELSE
        -- Update counters
        INSERT INTO rate_limit_tracking (
            license_key_id, 
            operation_type, 
            request_count, 
            window_start, 
            window_end
        ) VALUES (
            license_key_id_input,
            operation_type_input,
            1,
            current_minute_start,
            current_minute_start + INTERVAL '1 minute'
        )
        ON CONFLICT (license_key_id, operation_type, window_start)
        DO UPDATE SET
            request_count = rate_limit_tracking.request_count + 1,
            updated_at = NOW();
        
        result := json_build_object(
            'allowed', true,
            'hourly_remaining', limit_per_hour - (hourly_count + 1),
            'minute_remaining', limit_per_minute - (minute_count + 1),
            'hourly_reset', current_hour_start + INTERVAL '1 hour',
            'minute_reset', current_minute_start + INTERVAL '1 minute'
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create audit logging table
CREATE TABLE IF NOT EXISTS url_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key_id UUID REFERENCES license_keys(id) ON DELETE SET NULL,
    operation_type VARCHAR(50) NOT NULL, -- 'generate', 'access', 'decrypt', 'expire'
    url_hash VARCHAR(255),
    original_url TEXT,
    encrypted_url TEXT,
    pattern_used VARCHAR(100),
    encryption_method VARCHAR(50),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    user_agent TEXT,
    ip_address INET,
    request_metadata JSONB,
    performance_metrics JSONB, -- response_time, key_derivation_time, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_license_operation
ON url_audit_log (license_key_id, operation_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_operation_date
ON url_audit_log (operation_type, DATE(created_at));

CREATE INDEX IF NOT EXISTS idx_audit_url_hash
ON url_audit_log (url_hash) WHERE url_hash IS NOT NULL;

-- Create function to log URL operations
CREATE OR REPLACE FUNCTION log_url_operation(
    license_key_id_input UUID,
    operation_type_input VARCHAR(50),
    url_hash_input VARCHAR(255) DEFAULT NULL,
    original_url_input TEXT DEFAULT NULL,
    encrypted_url_input TEXT DEFAULT NULL,
    pattern_used_input VARCHAR(100) DEFAULT NULL,
    encryption_method_input VARCHAR(50) DEFAULT NULL,
    success_input BOOLEAN DEFAULT true,
    error_message_input TEXT DEFAULT NULL,
    user_agent_input TEXT DEFAULT NULL,
    ip_address_input INET DEFAULT NULL,
    request_metadata_input JSONB DEFAULT NULL,
    performance_metrics_input JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO url_audit_log (
        license_key_id,
        operation_type,
        url_hash,
        original_url,
        encrypted_url,
        pattern_used,
        encryption_method,
        success,
        error_message,
        user_agent,
        ip_address,
        request_metadata,
        performance_metrics
    ) VALUES (
        license_key_id_input,
        operation_type_input,
        url_hash_input,
        original_url_input,
        encrypted_url_input,
        pattern_used_input,
        encryption_method_input,
        success_input,
        error_message_input,
        user_agent_input,
        ip_address_input,
        request_metadata_input,
        performance_metrics_input
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Create function for automated expired URL cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_urls()
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER := 0;
BEGIN
    -- Log the cleanup operation
    INSERT INTO url_audit_log (
        operation_type,
        success,
        request_metadata
    ) VALUES (
        'cleanup_expired',
        true,
        json_build_object('cleanup_started_at', NOW())
    );
    
    -- Deactivate expired URLs instead of deleting (for audit trail)
    UPDATE url_registry 
    SET 
        is_active = false,
        updated_at = NOW()
    WHERE 
        is_active = true 
        AND expires_at <= NOW()
        AND expires_at IS NOT NULL;
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    
    -- Log completion
    INSERT INTO url_audit_log (
        operation_type,
        success,
        request_metadata
    ) VALUES (
        'cleanup_expired_completed',
        true,
        json_build_object(
            'cleanup_completed_at', NOW(),
            'urls_deactivated', cleanup_count
        )
    );
    
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;

-- Create performance analytics view
CREATE OR REPLACE VIEW url_performance_analytics AS
SELECT 
    DATE(created_at) as date,
    operation_type,
    pattern_used,
    encryption_method,
    COUNT(*) as total_operations,
    COUNT(*) FILTER (WHERE success = true) as successful_operations,
    COUNT(*) FILTER (WHERE success = false) as failed_operations,
    ROUND(
        (COUNT(*) FILTER (WHERE success = true)::DECIMAL / COUNT(*)) * 100, 
        2
    ) as success_rate_percent,
    ROUND(
        AVG((performance_metrics->>'response_time')::DECIMAL), 
        2
    ) as avg_response_time_ms,
    ROUND(
        AVG((performance_metrics->>'key_derivation_time')::DECIMAL), 
        2
    ) as avg_key_derivation_time_ms
FROM url_audit_log
WHERE 
    created_at >= NOW() - INTERVAL '30 days'
    AND performance_metrics IS NOT NULL
GROUP BY 
    DATE(created_at), 
    operation_type, 
    pattern_used, 
    encryption_method
ORDER BY 
    date DESC, 
    total_operations DESC;

-- Add comments for documentation
COMMENT ON INDEX idx_url_registry_hash_active IS 'Optimizes URL registry lookups for active URLs - Primary performance improvement';
COMMENT ON TABLE pattern_usage_stats IS 'Tracks pattern usage for automatic rotation when overused (>80% threshold)';
COMMENT ON TABLE rate_limit_tracking IS 'Implements per-license rate limiting to prevent abuse';
COMMENT ON TABLE url_audit_log IS 'Comprehensive audit trail for all URL operations';
COMMENT ON FUNCTION cleanup_expired_urls IS 'Automated cleanup job for expired URLs - prevents database bloat';
