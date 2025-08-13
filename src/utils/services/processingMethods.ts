// Enhanced decryption method ordering and success rate tracking
export class ProcessingMethodManager {
  private methodSuccessRates = new Map<string, { successes: number; attempts: number; lastUpdate: number }>();
  
  // Order decryption methods by success rate and URL characteristics
  orderDecryptionMethods(methods: any[], urlToProcess: string): any[] {
    const urlCharacteristics = this.analyzeUrlCharacteristics(urlToProcess);
    
    return methods.sort((a, b) => {
      const aScore = this.calculateMethodScore(a.name, urlCharacteristics);
      const bScore = this.calculateMethodScore(b.name, urlCharacteristics);
      return bScore - aScore; // Higher score first
    });
  }

  // Calculate method score based on success rate and URL characteristics
  private calculateMethodScore(methodName: string, characteristics: any): number {
    const baseScore = this.getMethodSuccessRate(methodName) * 100;
    const characteristicBonus = this.getCharacteristicBonus(methodName, characteristics);
    return baseScore + characteristicBonus;
  }

  // Analyze URL characteristics to optimize method selection
  private analyzeUrlCharacteristics(url: string): any {
    return {
      hasPath: url.includes('/') && url.split('/').length > 3,
      hasQuery: url.includes('?'),
      hasFragment: url.includes('#'),
      isLongUrl: url.length > 100,
      hasKnownPattern: /\/(e|documents|api|content|services)\//.test(url),
      hasMimicryDomain: this.checkMimicryDomain(url),
      hasEncryptedParams: /[?&](data|id|report|url|view)=/.test(url)
    };
  }

  // Check if URL uses domain mimicry
  private checkMimicryDomain(url: string): boolean {
    const mimicryDomains = [
      'secure-docs.com', 'businesscentral.net', 'companyfiles.org',
      'documenthub.co', 'fileservice.net', 'enterprise-docs.net'
    ];
    return mimicryDomains.some(domain => url.includes(domain));
  }

  // Get characteristic-based bonus for method selection
  private getCharacteristicBonus(methodName: string, characteristics: any): number {
    const bonuses: Record<string, Record<string, number>> = {
      'intelligent': {
        hasKnownPattern: 20,
        hasEncryptedParams: 15,
        isLongUrl: 10
      },
      'mimicry': {
        hasMimicryDomain: 25,
        hasEncryptedParams: 10
      },
      'stealth': {
        hasPath: 15,
        hasQuery: 10
      },
      'pattern': {
        hasKnownPattern: 15,
        hasPath: 10
      },
      'xor': {
        hasPath: 5
      },
      'aes': {
        isLongUrl: 5,
        hasEncryptedParams: 5
      }
    };

    const methodBonuses = bonuses[methodName] || {};
    return Object.entries(methodBonuses)
      .filter(([char]) => characteristics[char])
      .reduce((total, [, bonus]) => total + bonus, 0);
  }

  // Update method success rate
  updateMethodSuccessRate(methodName: string, success: boolean): void {
    const current = this.methodSuccessRates.get(methodName) || { successes: 0, attempts: 0, lastUpdate: 0 };
    
    current.attempts++;
    if (success) current.successes++;
    current.lastUpdate = Date.now();
    
    this.methodSuccessRates.set(methodName, current);
  }

  // Get method success rate
  getMethodSuccessRate(methodName: string): number {
    const stats = this.methodSuccessRates.get(methodName);
    if (!stats || stats.attempts === 0) return 0.5; // Default 50% for unknown methods
    
    return stats.successes / stats.attempts;
  }

  // Get method statistics
  getMethodStats() {
    const stats: Record<string, any> = {};
    
    for (const [method, data] of this.methodSuccessRates.entries()) {
      stats[method] = {
        successRate: data.attempts > 0 ? (data.successes / data.attempts * 100).toFixed(1) : '0.0',
        attempts: data.attempts,
        successes: data.successes,
        lastUsed: new Date(data.lastUpdate).toISOString()
      };
    }
    
    return stats;
  }

  // Reset statistics (useful for testing)
  resetStats(): void {
    this.methodSuccessRates.clear();
  }
}

export const processingMethodManager = new ProcessingMethodManager();