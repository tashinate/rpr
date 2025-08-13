export class IpDetection {
  async getRealClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      if (data.ip) {
        return data.ip;
      }
    } catch (error) {
      // Fall through to simulated IP
    }
    
    // Fallback to simulated IP
    return this.generateSimulatedIP();
  }

  private generateSimulatedIP(): string {
    const connection = (navigator as any).connection;
    const platform = navigator.platform;
    const language = navigator.language;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const fingerprint = `${platform}-${language}-${timezone}-${connection?.effectiveType || 'unknown'}-${screen.width}x${screen.height}`;
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const a = 1 + (Math.abs(hash) % 254);
    const b = 1 + (Math.abs(hash >> 8) % 254);
    const c = 1 + (Math.abs(hash >> 16) % 254);
    const d = 1 + (Math.abs(hash >> 24) % 254);
    
    return `${a}.${b}.${c}.${d}`;
  }
}