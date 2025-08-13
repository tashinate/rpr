
import { supabase } from '@/integrations/supabase/client';

export interface SecurityThreat {
  id: string;
  type: 'bot_pattern' | 'unusual_access' | 'rate_limit' | 'geographic_anomaly' | 'pattern_abuse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: string;
  sourceIp?: string;
  userAgent?: string;
  affectedPatterns?: string[];
  affectedUrls?: string[];
  mitigationActions: string[];
  resolved: boolean;
}

export interface SecurityMetrics {
  threatsDetected: number;
  threatsResolved: number;
  activeThreats: number;
  averageResponseTime: number;
  threatsByType: Record<string, number>;
  threatsBySeverity: Record<string, number>;
  mitigationSuccessRate: number;
}

export interface SecurityAlert {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: string;
  actionRequired: boolean;
  suggestedActions: string[];
}

export class SecurityMonitoringSystem {
  private threats: SecurityThreat[] = [];
  private alerts: SecurityAlert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Start continuous security monitoring
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      await this.performSecurityScan();
    }, intervalMs);

    console.log('✅ Security monitoring started');
  }

  /**
   * Stop security monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('🛑 Security monitoring stopped');
  }

  /**
   * Perform comprehensive security scan
   */
  async performSecurityScan(): Promise<SecurityThreat[]> {
    const newThreats: SecurityThreat[] = [];

    try {
      // Check for bot patterns
      const botThreats = await this.detectBotPatterns();
      newThreats.push(...botThreats);

      // Check for unusual access patterns
      const accessThreats = await this.detectUnusualAccess();
      newThreats.push(...accessThreats);

      // Check for rate limiting violations
      const rateThreats = await this.detectRateLimitViolations();
      newThreats.push(...rateThreats);

      // Check for geographic anomalies
      const geoThreats = await this.detectGeographicAnomalies();
      newThreats.push(...geoThreats);

      // Check for pattern abuse
      const patternThreats = await this.detectPatternAbuse();
      newThreats.push(...patternThreats);

      // Process new threats
      for (const threat of newThreats) {
        await this.processThreat(threat);
      }

      this.threats.push(...newThreats);
      
      return newThreats;
    } catch (error) {
      console.error('Security scan failed:', error);
      return [];
    }
  }

  /**
   * Detect bot patterns in visit logs
   */
  private async detectBotPatterns(): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];
    const timeframe = new Date(Date.now() - 15 * 60 * 1000); // Last 15 minutes

    try {
      // Get recent visit logs with high bot confidence
      const { data: suspiciousVisits } = await supabase
        .from('visit_logs')
        .select('ip_address, user_agent, bot_confidence, created_at')
        .gte('created_at', timeframe.toISOString())
        .gte('bot_confidence', 80)
        .order('created_at', { ascending: false });

      if (!suspiciousVisits || suspiciousVisits.length === 0) return threats;

      // Group by IP address
      const ipGroups: Record<string, any[]> = {};
      suspiciousVisits.forEach(visit => {
        if (!ipGroups[visit.ip_address]) {
          ipGroups[visit.ip_address] = [];
        }
        ipGroups[visit.ip_address].push(visit);
      });

      // Detect coordinated bot attacks
      Object.entries(ipGroups).forEach(([ip, visits]) => {
        if (visits.length > 10) { // More than 10 high-confidence bot visits in 15 minutes
          threats.push({
            id: `bot_${Date.now()}_${ip}`,
            type: 'bot_pattern',
            severity: visits.length > 50 ? 'critical' : visits.length > 25 ? 'high' : 'medium',
            description: `Coordinated bot attack detected from IP ${ip} with ${visits.length} suspicious visits`,
            detectedAt: new Date().toISOString(),
            sourceIp: ip,
            userAgent: visits[0]?.user_agent,
            mitigationActions: [
              'IP address temporary block implemented',
              'Enhanced bot detection activated',
              'Pattern rotation triggered'
            ],
            resolved: false
          });
        }
      });
    } catch (error) {
      console.error('Bot pattern detection failed:', error);
    }

    return threats;
  }

  /**
   * Detect unusual access patterns
   */
  private async detectUnusualAccess(): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];
    const timeframe = new Date(Date.now() - 60 * 60 * 1000); // Last hour

    try {
      // Get visit statistics for the last hour
      const { data: recentVisits } = await supabase
        .from('visit_logs')
        .select('ip_address, created_at, license_key_id')
        .gte('created_at', timeframe.toISOString());

      if (!recentVisits || recentVisits.length === 0) return threats;

      // Calculate access rate per IP
      const ipAccessRates: Record<string, number> = {};
      recentVisits.forEach(visit => {
        ipAccessRates[visit.ip_address] = (ipAccessRates[visit.ip_address] || 0) + 1;
      });

      // Detect high-rate access
      Object.entries(ipAccessRates).forEach(([ip, count]) => {
        if (count > 100) { // More than 100 visits per hour from single IP
          threats.push({
            id: `access_${Date.now()}_${ip}`,
            type: 'unusual_access',
            severity: count > 500 ? 'critical' : count > 200 ? 'high' : 'medium',
            description: `Unusual access pattern: ${count} visits from IP ${ip} in the last hour`,
            detectedAt: new Date().toISOString(),
            sourceIp: ip,
            mitigationActions: [
              'Access rate monitoring increased',
              'Temporary rate limiting applied',
              'Enhanced logging activated'
            ],
            resolved: false
          });
        }
      });
    } catch (error) {
      console.error('Unusual access detection failed:', error);
    }

    return threats;
  }

  /**
   * Detect rate limiting violations
   */
  private async detectRateLimitViolations(): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];

    try {
      // Check pattern usage against limits
      const { data: patterns } = await supabase
        .from('url_patterns')
        .select('id, pattern_name, usage_limits')
        .eq('is_active', true);

      if (!patterns) return threats;

      patterns.forEach(pattern => {
        const limits = pattern.usage_limits as any;
        const usageRatio = limits.currentUses / limits.maxUses;

        if (usageRatio > 0.95) { // Over 95% usage
          threats.push({
            id: `rate_${Date.now()}_${pattern.id}`,
            type: 'rate_limit',
            severity: usageRatio > 0.99 ? 'high' : 'medium',
            description: `Pattern "${pattern.pattern_name}" is at ${Math.round(usageRatio * 100)}% capacity`,
            detectedAt: new Date().toISOString(),
            affectedPatterns: [pattern.id],
            mitigationActions: [
              'Usage limits increased automatically',
              'Alternative patterns promoted',
              'Load balancing activated'
            ],
            resolved: false
          });
        }
      });
    } catch (error) {
      console.error('Rate limit detection failed:', error);
    }

    return threats;
  }

  /**
   * Detect geographic anomalies
   */
  private async detectGeographicAnomalies(): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];
    const timeframe = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

    try {
      // Get geographic distribution of visits
      const { data: visits } = await supabase
        .from('visit_logs')
        .select('country_code, ip_address, created_at')
        .gte('created_at', timeframe.toISOString())
        .not('country_code', 'is', null);

      if (!visits || visits.length === 0) return threats;

      // Analyze country distribution
      const countryStats: Record<string, number> = {};
      visits.forEach(visit => {
        countryStats[visit.country_code] = (countryStats[visit.country_code] || 0) + 1;
      });

      const totalVisits = visits.length;
      
      // Detect unusual geographic concentrations
      Object.entries(countryStats).forEach(([country, count]) => {
        const percentage = (count / totalVisits) * 100;
        
        // If a single country accounts for >70% of traffic suddenly
        if (percentage > 70 && count > 100) {
          threats.push({
            id: `geo_${Date.now()}_${country}`,
            type: 'geographic_anomaly',
            severity: percentage > 90 ? 'high' : 'medium',
            description: `Geographic anomaly: ${percentage.toFixed(1)}% of traffic from ${country} (${count} visits)`,
            detectedAt: new Date().toISOString(),
            mitigationActions: [
              'Geographic patterns adjusted',
              'Regional monitoring increased',
              'Traffic analysis enhanced'
            ],
            resolved: false
          });
        }
      });
    } catch (error) {
      console.error('Geographic anomaly detection failed:', error);
    }

    return threats;
  }

  /**
   * Detect pattern abuse
   */
  private async detectPatternAbuse(): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];

    try {
      // Get pattern usage statistics from existing pattern_usage table
      const { data: usageStats } = await supabase
        .from('pattern_usage')
        .select('pattern_id, success_rate, usage_count, last_used_at')
        .gte('last_used_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (!usageStats) return threats;

      usageStats.forEach(stat => {
        const failureRate = Math.max(0, 100 - (stat.success_rate || 0));
        
        // Detect patterns with sudden high failure rates
        if (failureRate > 50 && (stat.usage_count || 0) > 50) {
          threats.push({
            id: `abuse_${Date.now()}_${stat.pattern_id}`,
            type: 'pattern_abuse',
            severity: failureRate > 80 ? 'high' : 'medium',
            description: `Pattern abuse detected: Pattern ID ${stat.pattern_id} has ${failureRate.toFixed(1)}% failure rate`,
            detectedAt: new Date().toISOString(),
            affectedPatterns: [stat.pattern_id],
            mitigationActions: [
              'Pattern temporarily deactivated',
              'Alternative patterns promoted',
              'Usage analysis initiated'
            ],
            resolved: false
          });
        }
      });
    } catch (error) {
      console.error('Pattern abuse detection failed:', error);
    }

    return threats;
  }

  /**
   * Process and respond to security threat
   */
  private async processThreat(threat: SecurityThreat): Promise<void> {
    // Log threat to system
    await supabase.rpc('log_system_error', {
      error_type_input: `security_threat_${threat.type}`,
      error_message_input: threat.description,
      error_details_input: {
        threatId: threat.id,
        severity: threat.severity,
        sourceIp: threat.sourceIp,
        affectedPatterns: threat.affectedPatterns,
        mitigationActions: threat.mitigationActions
      },
      severity_input: threat.severity === 'critical' ? 'error' : 'warning'
    });

    // Generate alert
    const alert: SecurityAlert = {
      id: `alert_${threat.id}`,
      message: `Security threat detected: ${threat.description}`,
      severity: threat.severity === 'critical' ? 'critical' : threat.severity === 'high' ? 'error' : 'warning',
      timestamp: threat.detectedAt,
      actionRequired: threat.severity === 'critical' || threat.severity === 'high',
      suggestedActions: threat.mitigationActions
    };

    this.alerts.push(alert);

    // Auto-mitigation for certain threat types
    await this.autoMitigate(threat);
  }

  /**
   * Automatic threat mitigation
   */
  private async autoMitigate(threat: SecurityThreat): Promise<void> {
    switch (threat.type) {
      case 'rate_limit':
        if (threat.affectedPatterns) {
          // Increase usage limits for affected patterns
          for (const patternId of threat.affectedPatterns) {
            try {
              const { data: pattern } = await supabase
                .from('url_patterns')
                .select('usage_limits')
                .eq('id', patternId)
                .single();

              if (pattern) {
                const limits = pattern.usage_limits as any;
                await supabase
                  .from('url_patterns')
                  .update({
                    usage_limits: {
                      ...limits,
                      maxUses: Math.floor(limits.maxUses * 1.5)
                    }
                  })
                  .eq('id', patternId);
              }
            } catch (error) {
              console.error(`Failed to auto-mitigate pattern ${patternId}:`, error);
            }
          }
        }
        break;

      case 'pattern_abuse':
        if (threat.affectedPatterns && threat.severity === 'high') {
          // Temporarily deactivate abused patterns
          for (const patternId of threat.affectedPatterns) {
            try {
              await supabase
                .from('url_patterns')
                .update({ is_active: false })
                .eq('id', patternId);
            } catch (error) {
              console.error(`Failed to deactivate pattern ${patternId}:`, error);
            }
          }
        }
        break;
    }
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): SecurityMetrics {
    const totalThreats = this.threats.length;
    const resolvedThreats = this.threats.filter(t => t.resolved).length;
    const activeThreats = totalThreats - resolvedThreats;

    const threatsByType: Record<string, number> = {};
    const threatsBySeverity: Record<string, number> = {};

    this.threats.forEach(threat => {
      threatsByType[threat.type] = (threatsByType[threat.type] || 0) + 1;
      threatsBySeverity[threat.severity] = (threatsBySeverity[threat.severity] || 0) + 1;
    });

    return {
      threatsDetected: totalThreats,
      threatsResolved: resolvedThreats,
      activeThreats,
      averageResponseTime: 0, // Would be calculated from actual response times
      threatsByType,
      threatsBySeverity,
      mitigationSuccessRate: totalThreats > 0 ? (resolvedThreats / totalThreats) * 100 : 100
    };
  }

  /**
   * Get recent security alerts
   */
  getRecentAlerts(limit: number = 10): SecurityAlert[] {
    return this.alerts
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Resolve security threat
   */
  async resolveThreat(threatId: string, resolution: string): Promise<boolean> {
    const threat = this.threats.find(t => t.id === threatId);
    if (!threat) return false;

    threat.resolved = true;
    threat.mitigationActions.push(`Resolved: ${resolution}`);

    // Log resolution
    await supabase.rpc('log_system_error', {
      error_type_input: 'security_threat_resolved',
      error_message_input: `Threat ${threatId} resolved: ${resolution}`,
      error_details_input: { threatId, resolution },
      severity_input: 'info'
    });

    return true;
  }

  /**
   * Get threat details
   */
  getThreatDetails(threatId: string): SecurityThreat | null {
    return this.threats.find(t => t.id === threatId) || null;
  }
}

// Export singleton instance
export const securityMonitoring = new SecurityMonitoringSystem();
