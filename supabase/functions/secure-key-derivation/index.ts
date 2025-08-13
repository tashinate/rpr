import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface KeyDerivationRequest {
  license_key: string;
  context: string;
  operation: 'derive' | 'encrypt' | 'decrypt';
  data?: string;
}

interface KeyDerivationResponse {
  success: boolean;
  derived_key?: string;
  encrypted_data?: string;
  decrypted_data?: string;
  error?: string;
}

// Secure key derivation using PBKDF2 and HKDF
async function deriveSecureKey(licenseKey: string, context: string): Promise<string> {
  const encoder = new TextEncoder();
  
  // Import license key as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(licenseKey),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Generate salt based on context and current time
  const now = new Date();
  const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const saltString = `phantom-secure-${context}-${dayKey}`;
  const salt = encoder.encode(saltString);

  // Derive master key using PBKDF2
  const masterKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // 100k iterations for security
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  // Use HKDF to derive context-specific key
  const timeKey = Math.floor(now.getTime() / (12 * 60 * 60 * 1000)); // 12-hour rotation
  const info = encoder.encode(`${context}-${timeKey}`);
  
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(32), // 256-bit salt
      info: info
    },
    masterKey,
    { name: 'AES-GCM', length: 256 },
    true, // Allow export for client use
    ['encrypt', 'decrypt']
  );

  // Export key as base64 for client
  const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
  const keyArray = new Uint8Array(exportedKey);
  return btoa(String.fromCharCode(...keyArray));
}

// Server-side AES encryption
async function serverSideEncrypt(data: string, licenseKey: string, context: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const plaintext = encoder.encode(data);
    
    // Derive secure key
    const keyBase64 = await deriveSecureKey(licenseKey, context);
    const keyBuffer = new Uint8Array(
      atob(keyBase64).split('').map(char => char.charCodeAt(0))
    );
    
    // Import key for AES-GCM
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    // Generate nonce and salt
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Encrypt with AES-GCM
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: nonce,
        additionalData: salt
      },
      cryptoKey,
      plaintext
    );
    
    // Combine all components
    const ciphertext = new Uint8Array(encrypted.slice(0, -16));
    const authTag = new Uint8Array(encrypted.slice(-16));
    
    // Convert to base64url
    const toBase64Url = (buffer: Uint8Array): string => {
      const base64 = btoa(String.fromCharCode(...buffer));
      return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    };
    
    const result = {
      ciphertext: toBase64Url(ciphertext),
      nonce: toBase64Url(nonce),
      salt: toBase64Url(salt),
      timestamp: Date.now(),
      authTag: toBase64Url(authTag)
    };
    
    return `${result.ciphertext}.${result.nonce}.${result.salt}.${result.timestamp}.${result.authTag}`;
    
  } catch (error) {
    throw new Error(`Server-side encryption failed: ${error.message}`);
  }
}

// Server-side AES decryption
async function serverSideDecrypt(encryptedData: string, licenseKey: string, context: string): Promise<string> {
  try {
    const parts = encryptedData.split('.');
    if (parts.length !== 5) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [ciphertextB64, nonceB64, saltB64, timestampStr, authTagB64] = parts;
    
    // Convert from base64url
    const fromBase64Url = (base64url: string): Uint8Array => {
      const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
      const padding = '='.repeat((4 - base64.length % 4) % 4);
      const binaryString = atob(base64 + padding);
      return new Uint8Array(binaryString.split('').map(char => char.charCodeAt(0)));
    };
    
    const ciphertext = fromBase64Url(ciphertextB64);
    const nonce = fromBase64Url(nonceB64);
    const salt = fromBase64Url(saltB64);
    const authTag = fromBase64Url(authTagB64);
    
    // Check timestamp (7 days max age)
    const timestamp = parseInt(timestampStr);
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > maxAge) {
      throw new Error('Encrypted data has expired');
    }
    
    // Derive key
    const keyBase64 = await deriveSecureKey(licenseKey, context);
    const keyBuffer = new Uint8Array(
      atob(keyBase64).split('').map(char => char.charCodeAt(0))
    );
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    // Reconstruct encrypted data with auth tag
    const encryptedWithTag = new Uint8Array(ciphertext.length + authTag.length);
    encryptedWithTag.set(ciphertext);
    encryptedWithTag.set(authTag, ciphertext.length);
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: nonce,
        additionalData: salt
      },
      cryptoKey,
      encryptedWithTag
    );
    
    return new TextDecoder().decode(decrypted);
    
  } catch (error) {
    throw new Error(`Server-side decryption failed: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request
    const body: KeyDerivationRequest = await req.json()
    
    // Validate required fields
    if (!body.license_key || !body.context || !body.operation) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: license_key, context, operation' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate license key length
    if (body.license_key.length < 8) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'License key must be at least 8 characters' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client for license validation
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validate license key exists and is active
    const { data: licenseData, error: licenseError } = await supabase
      .from('license_keys')
      .select('id, is_active')
      .eq('key', body.license_key)
      .single()

    if (licenseError || !licenseData || !licenseData.is_active) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid or inactive license key' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let response: KeyDerivationResponse = { success: true };

    // Handle different operations
    switch (body.operation) {
      case 'derive':
        const derivedKey = await deriveSecureKey(body.license_key, body.context);
        response.derived_key = derivedKey;
        break;
        
      case 'encrypt':
        if (!body.data) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Data required for encryption' 
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        const encryptedData = await serverSideEncrypt(body.data, body.license_key, body.context);
        response.encrypted_data = encryptedData;
        break;
        
      case 'decrypt':
        if (!body.data) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Encrypted data required for decryption' 
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        const decryptedData = await serverSideDecrypt(body.data, body.license_key, body.context);
        response.decrypted_data = decryptedData;
        break;
        
      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid operation. Must be: derive, encrypt, or decrypt' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Secure key derivation error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
