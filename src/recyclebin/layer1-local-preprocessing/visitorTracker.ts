import { VisitorData } from './types';

export class VisitorTracker {
  private visitors: Map<string, VisitorData> = new Map();
  private readonly MAX_REQUESTS_PER_MINUTE = 10;
  private readonly MAX_REQUESTS_PER_HOUR = 50;
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Cleanup old entries periodically
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
  }

  private cleanup() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    for (const [ip, data] of this.visitors.entries()) {
      if (now - data.timestamp > oneHour) {
        this.visitors.delete(ip);
      }
    }
  }

  updateVisitor(ip: string, userAgent: string, hasHumanActivity?: boolean): void {
    const now = Date.now();
    const visitor = this.visitors.get(ip);
    
    if (visitor) {
      visitor.requestCount++;
      visitor.lastRequest = now;
      if (hasHumanActivity) {
        visitor.hasHumanActivity = true;
        visitor.interactionCount = (visitor.interactionCount || 0) + 1;
      }
    } else {
      this.visitors.set(ip, {
        ip,
        userAgent,
        timestamp: now,
        requestCount: 1,
        lastRequest: now,
        hasHumanActivity: hasHumanActivity || false,
        interactionCount: hasHumanActivity ? 1 : 0,
        firstVisit: now
      });
    }
  }

  isRateLimited(ip: string): boolean {
    const visitor = this.visitors.get(ip);
    if (!visitor) {
      return false;
    }
    
    const now = Date.now();
    const oneMinute = 60 * 1000;
    const oneHour = 60 * 60 * 1000;
    
    // Check requests in the last minute
    if (now - visitor.lastRequest < oneMinute && visitor.requestCount > this.MAX_REQUESTS_PER_MINUTE) {
      return true;
    }
    
    // Check requests in the last hour
    if (now - visitor.timestamp < oneHour && visitor.requestCount > this.MAX_REQUESTS_PER_HOUR) {
      return true;
    }
    
    return false;
  }

  isSuspiciousRepeatedVisitor(ip: string): boolean {
    const visitor = this.visitors.get(ip);
    if (!visitor) {
      return false;
    }
    
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    // Only flag as suspicious if:
    // 1. Multiple visits in short time AND
    // 2. No human activity detected AND
    // 3. Same behavior pattern (no interactions)
    return (
      visitor.requestCount > 3 &&
      (now - (visitor.firstVisit || visitor.timestamp)) < oneHour &&
      !visitor.hasHumanActivity &&
      (visitor.interactionCount || 0) === 0
    );
  }

  hasNoHumanActivity(ip: string): boolean {
    const visitor = this.visitors.get(ip);
    return visitor ? !visitor.hasHumanActivity : true;
  }
}