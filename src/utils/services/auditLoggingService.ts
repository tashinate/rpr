// Stub implementation of audit logging service
// This provides the interface needed by other components without database dependencies

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  licenseKeyId?: string;
  details: Record<string, any>;
}

export class AuditLoggingService {
  private logs: AuditLogEntry[] = [];

  async logUrlGeneration(
    licenseKeyId: string,
    originalUrl: string,
    encryptionMode: string,
    patternName: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const logEntry: AuditLogEntry = {
      id: Math.random().toString(36).substring(2, 15),
      timestamp: new Date(),
      eventType: 'URL_GENERATION',
      severity: 'LOW',
      licenseKeyId,
      details: {
        originalUrl: originalUrl.substring(0, 100), // Truncate for safety
        encryptionMode,
        patternName,
        ...metadata
      }
    };

    this.logs.push(logEntry);
  }

  async logEvent(eventData: {
    eventType: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    licenseKeyId?: string;
    details: Record<string, any>;
  }): Promise<void> {
    const logEntry: AuditLogEntry = {
      id: Math.random().toString(36).substring(2, 15),
      timestamp: new Date(),
      ...eventData
    };

    this.logs.push(logEntry);
  }

  async getLogs(
    licenseKeyId?: string,
    eventType?: string,
    limit: number = 100
  ): Promise<AuditLogEntry[]> {
    let filteredLogs = this.logs;

    if (licenseKeyId) {
      filteredLogs = filteredLogs.filter(log => log.licenseKeyId === licenseKeyId);
    }

    if (eventType) {
      filteredLogs = filteredLogs.filter(log => log.eventType === eventType);
    }

    return filteredLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getLogsByTimeRange(
    startDate: Date,
    endDate: Date,
    licenseKeyId?: string
  ): Promise<AuditLogEntry[]> {
    let filteredLogs = this.logs.filter(
      log => log.timestamp >= startDate && log.timestamp <= endDate
    );

    if (licenseKeyId) {
      filteredLogs = filteredLogs.filter(log => log.licenseKeyId === licenseKeyId);
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async clearOldLogs(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const initialCount = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp > cutoffDate);
    const deletedCount = initialCount - this.logs.length;

    console.log(`AuditLoggingService: Cleared ${deletedCount} old logs`);
    return deletedCount;
  }
}

export const auditLoggingService = new AuditLoggingService();