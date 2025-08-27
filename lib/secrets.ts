import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { securityMonitor } from './monitoring';

interface KeyMetadata {
  key: string;
  type: 'anon' | 'service';
  lastValidated: Date;
  lastRotated: Date;
  expiresAt: Date;
  isValid: boolean;
}

class SecretsManager {
  private static instance: SecretsManager;
  private supabaseUrl: string;
  private supabaseClient: SupabaseClient | null = null; // Cache the client
  private supabaseAdminClient: SupabaseClient | null = null; // Cache the admin client
  private keyMetadata: Map<string, KeyMetadata> = new Map();
  private readonly VALIDATION_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly KEY_ROTATION_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30 days

  private constructor() {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.warn('Missing SUPABASE_URL environment variable');
      throw new Error('Missing SUPABASE_URL');
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Missing SUPABASE_ANON_KEY environment variable');
      throw new Error('Missing SUPABASE_ANON_KEY');
    }

    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    // Initialize key metadata
    this.initializeKeyMetadata();
    
    // Start key validation schedule only on server and in production
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      this.startKeyValidationSchedule();
    }
  }

  private initializeKeyMetadata() {
    // Parse JWT to get expiration
    const parseJWT = (token: string): { exp: number } => {
      try {
        const base64Payload = token.split('.')[1];
        const payload = Buffer.from(base64Payload, 'base64').toString('utf8');
        return JSON.parse(payload);
      } catch (error) {
        securityMonitor.logSecurityEvent('auth', 'parse_jwt', 'failure', error);
        return { exp: Date.now() / 1000 + 86400 }; // Default to 24 hours
      }
    };

    // Initialize anon key metadata
    const anonExp = parseJWT(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!).exp;
    this.keyMetadata.set('anon', {
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      type: 'anon',
      lastValidated: new Date(),
      lastRotated: new Date(),
      expiresAt: new Date(anonExp * 1000),
      isValid: true
    });

    // Initialize service key metadata only if available
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const serviceExp = parseJWT(process.env.SUPABASE_SERVICE_ROLE_KEY).exp;
      this.keyMetadata.set('service', {
        key: process.env.SUPABASE_SERVICE_ROLE_KEY,
        type: 'service',
        lastValidated: new Date(),
        lastRotated: new Date(),
        expiresAt: new Date(serviceExp * 1000),
        isValid: true
      });
    }
  }

  private async startKeyValidationSchedule() {
    setInterval(async () => {
      await this.validateAllKeys();
    }, this.VALIDATION_INTERVAL);

    // Check for key rotation needs
    setInterval(() => {
      this.checkKeyRotationNeeds();
    }, this.VALIDATION_INTERVAL);
  }

  private async validateAllKeys() {
    Array.from(this.keyMetadata.entries()).forEach(async ([type, metadata]) => {
      try {
        const client = this.getSupabaseClient(type as 'anon' | 'service');
        await client.auth.getUser();
        
        metadata.lastValidated = new Date();
        metadata.isValid = true;
        
        securityMonitor.logSecurityEvent(
          'auth',
          `validate_${type}_key`,
          'success'
        );
      } catch (error) {
        metadata.isValid = false;
        securityMonitor.logSecurityEvent(
          'auth',
          `validate_${type}_key`,
          'failure',
          error
        );
      }
    });
  }

  private checkKeyRotationNeeds() {
    Array.from(this.keyMetadata.entries()).forEach(([type, metadata]) => {
      const daysSinceRotation = (Date.now() - metadata.lastRotated.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceRotation >= 30) {
        securityMonitor.logSecurityEvent(
          'auth',
          `key_rotation_needed`,
          'failure', // Changed from 'warn' to 'failure'
          { type, daysSinceRotation }
        );
      }

      // Check expiration
      const daysUntilExpiration = (metadata.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntilExpiration <= 7) {
        securityMonitor.logSecurityEvent(
          'auth',
          `key_expiring_soon`,
          'failure', // Changed from 'warn' to 'failure'
          { type, daysUntilExpiration }
        );
      }
    });
  }

  public static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }

  public getSupabaseClient(type: 'anon' | 'service' = 'anon') {
    const metadata = this.keyMetadata.get(type);
    if (!metadata) {
      if (type === 'service') {
        throw new Error('Service role key not configured. Please add SUPABASE_SERVICE_ROLE_KEY to your environment variables.');
      }
      throw new Error(`${type} key not found`);
    }
    
    if (!metadata.isValid) {
      throw new Error(`Invalid or expired ${type} key`);
    }

    // Return cached client if available
    if (type === 'anon' && this.supabaseClient) {
      return this.supabaseClient;
    }
    
    if (type === 'service' && this.supabaseAdminClient) {
      return this.supabaseAdminClient;
    }

    // Create new client and cache it
    const client = createClient(this.supabaseUrl, metadata.key, {
      auth: {
        persistSession: type === 'anon',
        autoRefreshToken: type === 'anon',
        detectSessionInUrl: false, // Reduce client instances
        storageKey: type === 'anon' ? 'supabase.auth.token' : `supabase.auth.token.${type}`, // Unique storage keys
      },
      global: {
        headers: {
          'X-Client-Info': `yumzoom-app-${type}`
        }
      }
    });

    // Cache the client
    if (type === 'anon') {
      this.supabaseClient = client;
    } else {
      this.supabaseAdminClient = client;
    }

    return client;
  }

  public async validateKeys(): Promise<boolean> {
    try {
      await this.validateAllKeys();
      return Array.from(this.keyMetadata.values()).every(m => m.isValid);
    } catch (error) {
      securityMonitor.logSecurityEvent('auth', 'validate_keys', 'failure', error);
      return false;
    }
  }

  public getKeyHealth(): Record<string, {
    isValid: boolean;
    daysUntilExpiration: number;
    daysSinceLastRotation: number;
  }> {
    const health: Record<string, any> = {};
    
    for (const [type, metadata] of this.keyMetadata.entries()) {
      health[type] = {
        isValid: metadata.isValid,
        daysUntilExpiration: (metadata.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        daysSinceLastRotation: (Date.now() - metadata.lastRotated.getTime()) / (1000 * 60 * 60 * 24)
      };
    }

    return health;
  }
}

export const secretsManager = SecretsManager.getInstance();
