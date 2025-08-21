import { createClient } from '@supabase/supabase-js';
import { securityMonitor } from './monitoring';

interface RotationConfig {
  interval: number; // days
  warningThreshold: number; // days
  autoRotate: boolean;
}

class KeyRotationService {
  private static instance: KeyRotationService;
  private config: RotationConfig;
  private supabaseAdmin: any;

  private constructor() {
    this.config = {
      interval: 30, // Rotate keys every 30 days
      warningThreshold: 7, // Warn 7 days before rotation
      autoRotate: process.env.AUTO_ROTATE_KEYS === 'true',
    };

    // Initialize Supabase admin client
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
    }
  }

  public static getInstance(): KeyRotationService {
    if (!KeyRotationService.instance) {
      KeyRotationService.instance = new KeyRotationService();
    }
    return KeyRotationService.instance;
  }

  private async notifyKeyRotation(keyType: string, action: 'scheduled' | 'completed' | 'failed') {
    // In production, implement proper notification system
    if (process.env.NODE_ENV === 'production') {
      // Example: Send email notification
      /*
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `Key Rotation ${action} for ${keyType}`,
        body: `Key rotation has been ${action} for ${keyType} key.`
      });
      */
    }

    securityMonitor.logSecurityEvent(
      'auth',
      `key_rotation_${action}`,
      action === 'failed' ? 'failure' : 'success',
      { keyType }
    );
  }

  public async checkRotationNeeds(): Promise<void> {
    if (!this.supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    try {
      // Get current API keys
      const { data: apiKeys, error } = await this.supabaseAdmin
        .rpc('get_service_keys');

      if (error) throw error;

      for (const key of apiKeys) {
        const daysSinceCreation = (Date.now() - new Date(key.created_at).getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceCreation >= this.config.interval) {
          if (this.config.autoRotate) {
            await this.rotateKey(key.name);
          } else {
            await this.notifyKeyRotation(key.name, 'scheduled');
          }
        } else if (daysSinceCreation >= (this.config.interval - this.config.warningThreshold)) {
          await this.notifyKeyRotation(key.name, 'scheduled');
        }
      }
    } catch (error) {
      securityMonitor.logSecurityEvent(
        'auth',
        'check_rotation_needs',
        'failure',
        error
      );
    }
  }

  private async rotateKey(keyType: string): Promise<void> {
    if (!this.supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    try {
      // Create new key
      const { data: newKey, error: createError } = await this.supabaseAdmin
        .rpc('create_service_key', { key_name: keyType });

      if (createError) throw createError;

      // Store new key securely (implement your storage solution)
      await this.storeNewKey(keyType, newKey);

      // Revoke old key (implement with proper delay to ensure service continuity)
      setTimeout(async () => {
        try {
          await this.supabaseAdmin
            .rpc('revoke_service_key', { key_name: keyType });
          
          await this.notifyKeyRotation(keyType, 'completed');
        } catch (error) {
          securityMonitor.logSecurityEvent(
            'auth',
            'revoke_old_key',
            'failure',
            error
          );
        }
      }, 1000 * 60 * 60); // 1 hour delay

      await this.notifyKeyRotation(keyType, 'completed');
    } catch (error) {
      await this.notifyKeyRotation(keyType, 'failed');
      throw error;
    }
  }

  private async storeNewKey(keyType: string, newKey: string): Promise<void> {
    // Implement secure key storage
    // In production, use a secure secret management service
    if (process.env.NODE_ENV === 'production') {
      // Example: Store in AWS Secrets Manager
      /*
      const AWS = require('aws-sdk');
      const secretsManager = new AWS.SecretsManager();
      await secretsManager.putSecretValue({
        SecretId: `supabase-${keyType}-key`,
        SecretString: newKey,
      }).promise();
      */
    } else {
      // For development, log to console
      console.log(`New ${keyType} key generated. Update your .env.local file.`);
    }
  }

  // Start the rotation check schedule
  public startRotationSchedule(): void {
    // Check rotation needs daily
    setInterval(() => {
      this.checkRotationNeeds();
    }, 24 * 60 * 60 * 1000);
  }
}

export const keyRotationService = KeyRotationService.getInstance();
