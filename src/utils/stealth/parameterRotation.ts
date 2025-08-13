/**
 * Dynamic Parameter Rotation System
 * Continuously changes parameter names and patterns to avoid detection
 */

interface RotationConfig {
  timeWindow: number; // Minutes
  parameterSets: string[][];
  contextualNames: Record<string, string[]>;
}

/**
 * Get current rotation window based on time (4 hour windows)
 */
function getCurrentRotationWindow(): number {
  const now = Date.now();
  return Math.floor(now / (4 * 60 * 60 * 1000)); // 4 hour windows
}

/**
 * Simple innocent parameter names (rotates every 4 hours)
 */
const INNOCENT_PARAMS = [
  'gclid',    // Google Ads click ID
  'fbclid',   // Facebook click ID
  'utm_content', // UTM content parameter
  'ved',      // Google search parameter
  'aqs',      // Google autocomplete parameter
  'ei'        // Google search parameter
];

/**
 * Get current innocent parameter name (rotates every 4 hours)
 */
export function getCurrentParameterName(): string {
  const window = getCurrentRotationWindow();
  const paramIndex = window % INNOCENT_PARAMS.length;
  return INNOCENT_PARAMS[paramIndex];
}

/**
 * Generate simple parameter with innocent name
 */
export function generateSimpleParameters(encryptedData: string): Record<string, string> {
  const paramName = getCurrentParameterName();
  return { [paramName]: encryptedData };
}

/**
 * Add noise parameters to confuse analysis
 */
export function addNoiseParameters(baseParams: Record<string, string>): Record<string, string> {
  const window = getCurrentRotationWindow(); // 4 hour windows
  const noise: Record<string, string> = {};
  
  // Browser-like parameters
  const browserParams = [
    ['dpr', (1 + (window % 3)).toString()],
    ['vp', `${800 + (window % 400)}x${600 + (window % 300)}`],
    ['hl', ['en', 'en-US', 'en-GB'][window % 3]],
    ['gl', ['US', 'GB', 'CA'][window % 3]]
  ];
  
  // Analytics-like parameters
  const analyticsParams = [
    ['utmz', `${Date.now()}.1.1.1.utmcsr=google|utmccn=(organic)`],
    ['utma', `${window}.${Date.now()}.${Date.now()}.${Date.now()}.1.1`],
    ['_ga', `GA1.2.${window}.${Date.now()}`]
  ];
  
  // CDN-like parameters
  const cdnParams = [
    ['cb', (Date.now() % 100000).toString()],
    ['v', `1.${window % 100}.0`],
    ['fmt', ['json', 'jsonp', 'xml'][window % 3]]
  ];
  
  // Select 2-4 noise parameters randomly based on time window
  const allNoise = [...browserParams, ...analyticsParams, ...cdnParams];
  const selectedCount = 2 + (window % 3); // 2-4 parameters
  
  for (let i = 0; i < selectedCount && i < allNoise.length; i++) {
    const index = (window * 7 + i * 13) % allNoise.length;
    const [key, value] = allNoise[index];
    noise[key] = value;
  }
  
  return { ...baseParams, ...noise };
}

/**
 * Extract encrypted data from parameters
 */
export function extractFromParameters(params: URLSearchParams): string {
  // Try current parameter name
  const currentParam = getCurrentParameterName();
  let value = params.get(currentParam);
  if (value && value.length > 10) {
    return value;
  }
  
  // Try all innocent parameter names (for older URLs)
  for (const paramName of INNOCENT_PARAMS) {
    value = params.get(paramName);
    if (value && value.length > 10) {
      return value;
    }
  }
  
  // Fallback: try all parameters for anything that looks like Base34 data
  for (const [key, paramValue] of params.entries()) {
    if (paramValue.length > 10 && /^[23456789abcdefghijkmnpqrstuvwxyz]+$/.test(paramValue)) {
      return paramValue;
    }
  }
  
  throw new Error('No encrypted data found in parameters');
}

/**
 * Get current parameter name for debugging
 */
export function getCurrentParameterInfo(): { name: string; allParams: string[] } {
  return {
    name: getCurrentParameterName(),
    allParams: INNOCENT_PARAMS
  };
}