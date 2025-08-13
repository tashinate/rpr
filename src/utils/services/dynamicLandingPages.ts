interface LandingPageConfig {
  category: string;
  patternType: string;
  userAgent: string;
  isEmailScanner?: boolean;
  scannerType?: string;
}

interface PageContent {
  title: string;
  description: string;
  htmlContent: string;
  headers: Record<string, string>;
  statusCode: number;
}

class DynamicLandingPages {
  private contentTemplates: Record<string, PageContent> = {
    government: {
      title: "Government Services Portal",
      description: "Access to public services and information",
      htmlContent: this.generateGovernmentContent(),
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff'
      },
      statusCode: 200
    },
    banking: {
      title: "Secure Banking Access",
      description: "Financial services authentication",
      htmlContent: this.generateBankingContent(),
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Strict-Transport-Security': 'max-age=31536000',
        'X-Frame-Options': 'DENY'
      },
      statusCode: 200
    },
    medical: {
      title: "Healthcare Portal",
      description: "Medical records and patient services",
      htmlContent: this.generateMedicalContent(),
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin'
      },
      statusCode: 200
    },
    infrastructure: {
      title: "System Status",
      description: "Infrastructure monitoring and health checks",
      htmlContent: this.generateInfrastructureContent(),
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Service-Status': 'healthy'
      },
      statusCode: 200
    },
    technology: {
      title: "API Documentation",
      description: "Technical documentation and resources",
      htmlContent: this.generateTechnologyContent(),
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-API-Version': '2.1.0',
        'Access-Control-Allow-Origin': '*'
      },
      statusCode: 200
    }
  };

  generateLandingPage(config: LandingPageConfig): PageContent {
    // For email scanners, generate safe content
    if (config.isEmailScanner) {
      return this.generateEmailScannerSafeContent(config.scannerType || 'generic');
    }

    // Get base template
    const template = this.contentTemplates[config.category] || this.contentTemplates.technology;
    
    // Customize based on user agent and pattern
    const customizedContent = this.customizeContentForUserAgent(template, config.userAgent);
    
    // Add realistic delays and behaviors
    const enhancedContent = this.addRealisticBehaviors(customizedContent);
    
    return enhancedContent;
  }

  private generateEmailScannerSafeContent(scannerType: string): PageContent {
    const safeTemplates = {
      microsoft: {
        title: "Document Access Portal",
        description: "Secure document management system",
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Document Portal</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
          </head>
          <body>
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
              <h1 style="color: #0078d4;">Document Access Portal</h1>
              <p>This is a secure document management system for authorized users.</p>
              <div style="background: #f3f2f1; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <h3>System Status: Operational</h3>
                <p>All services are running normally.</p>
              </div>
              <p style="color: #666; font-size: 12px;">© 2024 Document Management System</p>
            </div>
          </body>
          </html>
        `,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        statusCode: 200
      },
      google: {
        title: "Cloud Storage Access",
        description: "File storage and collaboration platform",
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Cloud Storage</title>
            <meta charset="utf-8">
          </head>
          <body>
            <div style="font-family: 'Google Sans', Arial, sans-serif; padding: 40px;">
              <h1 style="color: #1a73e8;">Cloud Storage Portal</h1>
              <p>Access your files and collaborate with your team.</p>
              <div style="background: #e8f0fe; padding: 16px; border-radius: 8px;">
                <p>📁 Storage system is online and accessible.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        statusCode: 200
      },
      generic: {
        title: "Service Portal",
        description: "Online services platform",
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Service Portal</title>
            <meta charset="utf-8">
          </head>
          <body>
            <div style="font-family: Arial, sans-serif; padding: 30px; text-align: center;">
              <h1>Service Portal</h1>
              <p>Welcome to our online services platform.</p>
              <p style="color: #28a745;">✓ All systems operational</p>
            </div>
          </body>
          </html>
        `,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        statusCode: 200
      }
    };

    return safeTemplates[scannerType as keyof typeof safeTemplates] || safeTemplates.generic;
  }

  private customizeContentForUserAgent(template: PageContent, userAgent: string): PageContent {
    let customizedHtml = template.htmlContent;
    const customHeaders = { ...template.headers };

    // Mobile optimization
    if (this.isMobileUserAgent(userAgent)) {
      customHeaders['Viewport'] = 'width=device-width, initial-scale=1.0';
      customizedHtml = customizedHtml.replace(
        '<head>',
        '<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">'
      );
    }

    // Browser-specific optimizations
    if (userAgent.includes('Chrome')) {
      customHeaders['X-Chrome-UX'] = 'optimized';
    } else if (userAgent.includes('Firefox')) {
      customHeaders['X-Firefox-Features'] = 'enhanced';
    } else if (userAgent.includes('Safari')) {
      customHeaders['X-WebKit-Features'] = 'native';
    }

    return {
      ...template,
      htmlContent: customizedHtml,
      headers: customHeaders
    };
  }

  private addRealisticBehaviors(content: PageContent): PageContent {
    // Add realistic response timing simulation
    const enhancedHeaders = {
      ...content.headers,
      'Server': this.generateRealisticServerHeader(),
      'X-Response-Time': this.generateResponseTime(),
      'ETag': this.generateETag(),
      'Last-Modified': new Date().toUTCString(),
      'Cache-Control': 'public, max-age=300'
    };

    // Add loading indicators and progressive enhancement
    const enhancedHtml = this.addProgressiveEnhancement(content.htmlContent);

    return {
      ...content,
      headers: enhancedHeaders,
      htmlContent: enhancedHtml
    };
  }

  private generateRealisticServerHeader(): string {
    const servers = [
      'nginx/1.18.0',
      'Apache/2.4.41',
      'Microsoft-IIS/10.0',
      'Cloudflare',
      'LiteSpeed'
    ];
    return servers[Math.floor(Math.random() * servers.length)];
  }

  private generateResponseTime(): string {
    // Generate realistic response time (50-300ms)
    const time = Math.floor(Math.random() * 250) + 50;
    return `${time}ms`;
  }

  private generateETag(): string {
    return `"${Math.random().toString(36).substring(2)}"`;
  }

  private addProgressiveEnhancement(html: string): string {
    // Add realistic JavaScript for progressive enhancement
    const script = `
    <script>
      // Simulate realistic page loading behavior
      document.addEventListener('DOMContentLoaded', function() {
        // Simulate some loading delay
        setTimeout(function() {
          document.body.classList.add('loaded');
        }, Math.random() * 200 + 100);
        
        // Add realistic interaction tracking
        document.addEventListener('click', function(e) {
          console.log('User interaction detected');
        });
      });
    </script>
    <style>
      body { opacity: 0.9; transition: opacity 0.3s ease; }
      body.loaded { opacity: 1; }
    </style>`;

    return html.replace('</head>', `${script}\n</head>`);
  }

  private isMobileUserAgent(userAgent: string): boolean {
    return /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  }

  private generateGovernmentContent(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Government Services Portal</title>
        <meta charset="utf-8">
        <meta name="description" content="Access to public services and government information">
      </head>
      <body>
        <header style="background: #003366; color: white; padding: 20px;">
          <h1>Government Services Portal</h1>
        </header>
        <main style="padding: 20px; max-width: 1200px; margin: 0 auto;">
          <h2>Welcome to Public Services</h2>
          <p>Access various government services and information portals.</p>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 30px 0;">
            <div style="border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <h3>Citizen Services</h3>
              <p>Access forms, applications, and public information.</p>
            </div>
            <div style="border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <h3>Document Processing</h3>
              <p>Submit and track official document requests.</p>
            </div>
          </div>
        </main>
      </body>
      </html>
    `;
  }

  private generateBankingContent(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Secure Banking Portal</title>
        <meta charset="utf-8">
      </head>
      <body>
        <div style="background: #f8f9fa; min-height: 100vh; font-family: Arial, sans-serif;">
          <header style="background: #1e3a8a; color: white; padding: 15px 0;">
            <div style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
              <h1>SecureBank Portal</h1>
            </div>
          </header>
          <main style="max-width: 800px; margin: 40px auto; padding: 0 20px;">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2>Account Access Portal</h2>
              <p>Secure authentication system for banking services.</p>
              <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <strong>Security Notice:</strong> This is a secure authentication portal.
              </div>
            </div>
          </main>
        </div>
      </body>
      </html>
    `;
  }

  private generateMedicalContent(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Healthcare Portal</title>
        <meta charset="utf-8">
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; background: #f5f7fa;">
        <header style="background: #2563eb; color: white; padding: 20px 0;">
          <div style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
            <h1>Healthcare Management Portal</h1>
          </div>
        </header>
        <main style="max-width: 1000px; margin: 30px auto; padding: 0 20px;">
          <div style="background: white; padding: 30px; border-radius: 10px;">
            <h2>Patient Care Services</h2>
            <p>Access your medical records, appointments, and healthcare information.</p>
            <div style="display: flex; gap: 20px; margin-top: 30px; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 200px; padding: 20px; background: #f0f9ff; border-radius: 8px;">
                <h3>Medical Records</h3>
                <p>View and manage your health information.</p>
              </div>
              <div style="flex: 1; min-width: 200px; padding: 20px; background: #f0fdf4; border-radius: 8px;">
                <h3>Appointments</h3>
                <p>Schedule and manage healthcare appointments.</p>
              </div>
            </div>
          </div>
        </main>
      </body>
      </html>
    `;
  }

  private generateInfrastructureContent(): string {
    return JSON.stringify({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: { status: "operational", response_time: "12ms" },
        cache: { status: "operational", response_time: "3ms" },
        api: { status: "operational", response_time: "45ms" }
      },
      uptime: "99.9%",
      version: "2.1.0"
    }, null, 2);
  }

  private generateTechnologyContent(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>API Documentation Portal</title>
        <meta charset="utf-8">
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; background: #fafbfc;">
        <header style="background: #24292f; color: white; padding: 20px 0;">
          <div style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
            <h1>API Documentation</h1>
          </div>
        </header>
        <main style="max-width: 1200px; margin: 0 auto; padding: 30px 20px;">
          <div style="background: white; padding: 30px; border-radius: 8px; border: 1px solid #e1e4e8;">
            <h2>Developer Resources</h2>
            <p>Technical documentation and API reference guides.</p>
            <div style="margin-top: 30px;">
              <h3>Quick Start Guide</h3>
              <pre style="background: #f6f8fa; padding: 20px; border-radius: 6px; overflow-x: auto;"><code>curl -X GET "https://api.example.com/v1/status" \\
  -H "Authorization: Bearer YOUR_TOKEN"</code></pre>
            </div>
          </div>
        </main>
      </body>
      </html>
    `;
  }
}

export const dynamicLandingPages = new DynamicLandingPages();