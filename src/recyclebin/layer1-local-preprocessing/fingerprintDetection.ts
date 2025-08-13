import { FingerprintData } from './types';

export class FingerprintDetection {
  generateFingerprint(): FingerprintData {
    return {
      canvas: this.getCanvasFingerprint(),
      webgl: this.getWebGLFingerprint(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || 'unspecified',
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      maxTouchPoints: navigator.maxTouchPoints || 0
    };
  }

  private getCanvasFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'no-canvas';

      canvas.width = 200;
      canvas.height = 50;
      
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillRect(0, 0, 200, 50);
      ctx.fillStyle = 'rgba(255, 0, 102, 0.7)';
      ctx.fillText('BotDetection🤖', 2, 2);
      ctx.fillStyle = 'rgba(0, 102, 255, 0.7)';
      ctx.arc(50, 25, 20, 0, Math.PI * 2);
      ctx.fill();

      return canvas.toDataURL();
    } catch (e) {
      return 'canvas-error';
    }
  }

  private getWebGLFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') as WebGLRenderingContext || 
                 canvas.getContext('experimental-webgl') as WebGLRenderingContext;
      if (!gl) return 'no-webgl';

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '';
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
      
      return `${vendor}|${renderer}`;
    } catch (e) {
      return 'webgl-error';
    }
  }

  analyzeFingerprint(fingerprint: FingerprintData): number {
    let suspicionScore = 0;

    // Canvas analysis
    if (fingerprint.canvas === 'no-canvas' || fingerprint.canvas === 'canvas-error') {
      suspicionScore += 40;
    } else if (fingerprint.canvas.length < 100) {
      suspicionScore += 25;
    }

    // WebGL analysis
    if (fingerprint.webgl === 'no-webgl' || fingerprint.webgl === 'webgl-error') {
      suspicionScore += 20;
    } else if (fingerprint.webgl.includes('SwiftShader') || fingerprint.webgl.includes('llvmpipe')) {
      suspicionScore += 30; // Headless browser indicators
    }

    // Hardware analysis
    if (fingerprint.hardwareConcurrency === 0 || fingerprint.hardwareConcurrency > 64) {
      suspicionScore += 15;
    }

    // Environment checks
    if (fingerprint.language === 'en' && fingerprint.timezone === 'UTC') {
      suspicionScore += 10; // Common headless setup
    }

    if (fingerprint.doNotTrack === '1' && fingerprint.cookieEnabled === false) {
      suspicionScore += 15; // Unusual combination
    }

    return Math.min(suspicionScore, 100);
  }
}