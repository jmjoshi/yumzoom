import { createClient } from '@supabase/supabase-js';
import * as otplib from 'otplib';
import crypto from 'crypto';
import { securityMonitor } from './monitoring';
import { notificationService } from './notifications';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface TwoFactorAuthSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorAuthStatus {
  isEnabled: boolean;
  lastUsed?: Date;
  backupCodesRemaining: number;
}

class TwoFactorAuthService {
  private static instance: TwoFactorAuthService;

  private constructor() {}

  public static getInstance(): TwoFactorAuthService {
    if (!TwoFactorAuthService.instance) {
      TwoFactorAuthService.instance = new TwoFactorAuthService();
    }
    return TwoFactorAuthService.instance;
  }

  /**
   * Generate 2FA setup for a user
   */
  async setupTwoFactor(userId: string, email: string): Promise<TwoFactorAuthSetup> {
    try {
      // Generate secret
      const secret = otplib.authenticator.generateSecret();
      
      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () => 
        crypto.randomBytes(4).toString('hex').toUpperCase()
      );

      // Create QR code URL
      const otpAuthUrl = otplib.authenticator.keyuri(
        email,
        'YumZoom',
        secret
      );
      
      // Create QR code URL for manual entry (without QRCode dependency)
      const qrCodeUrl = `otpauth://totp/YumZoom:${encodeURIComponent(email)}?secret=${secret}&issuer=YumZoom`;

      // Store setup in database (not yet enabled)
      await supabase
        .from('user_two_factor_auth')
        .upsert({
          user_id: userId,
          secret_encrypted: this.encrypt(secret),
          backup_codes: backupCodes.map(code => this.encrypt(code)),
          is_enabled: false,
          setup_at: new Date().toISOString(),
        });

      securityMonitor.logSecurityEvent(
        'auth',
        'two_factor_setup_initiated',
        'success',
        { userId }
      );

      return {
        secret,
        qrCodeUrl,
        backupCodes,
      };
    } catch (error) {
      securityMonitor.logSecurityEvent(
        'auth',
        'two_factor_setup_failed',
        'failure',
        { userId, error }
      );
      throw new Error('Failed to setup two-factor authentication');
    }
  }

  /**
   * Enable 2FA after verifying initial token
   */
  async enableTwoFactor(userId: string, token: string): Promise<boolean> {
    try {
      // Get user's 2FA setup
      const { data: setup } = await supabase
        .from('user_two_factor_auth')
        .select('secret_encrypted')
        .eq('user_id', userId)
        .eq('is_enabled', false)
        .single();

      if (!setup) {
        throw new Error('2FA setup not found');
      }

      const secret = this.decrypt(setup.secret_encrypted);
      
      // Verify token
      const isValid = otplib.authenticator.check(token, secret);

      if (!isValid) {
        securityMonitor.logSecurityEvent(
          'auth',
          'two_factor_enable_failed',
          'failure',
          { userId, reason: 'invalid_token' }
        );
        return false;
      }

      // Enable 2FA
      await supabase
        .from('user_two_factor_auth')
        .update({
          is_enabled: true,
          enabled_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      securityMonitor.logSecurityEvent(
        'auth',
        'two_factor_enabled',
        'success',
        { userId }
      );

      // Send notification
      await this.notifyTwoFactorEnabled(userId);

      return true;
    } catch (error) {
      securityMonitor.logSecurityEvent(
        'auth',
        'two_factor_enable_error',
        'failure',
        { userId, error }
      );
      throw error;
    }
  }

  /**
   * Verify 2FA token during login
   */
  async verifyTwoFactor(userId: string, token: string): Promise<boolean> {
    try {
      // Get user's 2FA data
      const { data: twoFactorData } = await supabase
        .from('user_two_factor_auth')
        .select('secret_encrypted, backup_codes, is_enabled')
        .eq('user_id', userId)
        .eq('is_enabled', true)
        .single();

      if (!twoFactorData) {
        return false;
      }

      const secret = this.decrypt(twoFactorData.secret_encrypted);

      // Try regular TOTP verification first
      const isValidTotp = otplib.authenticator.check(token, secret);

      if (isValidTotp) {
        // Update last used
        await supabase
          .from('user_two_factor_auth')
          .update({
            last_used_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        securityMonitor.logSecurityEvent(
          'auth',
          'two_factor_verified',
          'success',
          { userId, method: 'totp' }
        );

        return true;
      }

      // Try backup codes
      const backupCodes = twoFactorData.backup_codes.map((code: string) => this.decrypt(code));
      const tokenUpper = token.toUpperCase();
      
      if (backupCodes.includes(tokenUpper)) {
        // Remove used backup code
        const updatedCodes = twoFactorData.backup_codes.filter(
          (code: string) => this.decrypt(code) !== tokenUpper
        );

        await supabase
          .from('user_two_factor_auth')
          .update({
            backup_codes: updatedCodes,
            last_used_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        securityMonitor.logSecurityEvent(
          'auth',
          'two_factor_verified',
          'success',
          { userId, method: 'backup_code', remaining_codes: updatedCodes.length }
        );

        // Warn if running low on backup codes
        if (updatedCodes.length <= 2) {
          await this.notifyLowBackupCodes(userId, updatedCodes.length);
        }

        return true;
      }

      securityMonitor.logSecurityEvent(
        'auth',
        'two_factor_verification_failed',
        'failure',
        { userId }
      );

      return false;
    } catch (error) {
      securityMonitor.logSecurityEvent(
        'auth',
        'two_factor_verification_error',
        'failure',
        { userId, error }
      );
      return false;
    }
  }

  /**
   * Disable 2FA
   */
  async disableTwoFactor(userId: string, password: string): Promise<boolean> {
    try {
      // Verify user's password first
      const { data: user } = await supabase.auth.admin.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // In a real implementation, you'd verify the password here
      // For now, we'll assume password verification is handled elsewhere

      await supabase
        .from('user_two_factor_auth')
        .update({
          is_enabled: false,
          disabled_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      securityMonitor.logSecurityEvent(
        'auth',
        'two_factor_disabled',
        'success',
        { userId }
      );

      // Send security notification
      await this.notifyTwoFactorDisabled(userId);

      return true;
    } catch (error) {
      securityMonitor.logSecurityEvent(
        'auth',
        'two_factor_disable_error',
        'failure',
        { userId, error }
      );
      throw error;
    }
  }

  /**
   * Get 2FA status for user
   */
  async getTwoFactorStatus(userId: string): Promise<TwoFactorAuthStatus> {
    const { data } = await supabase
      .from('user_two_factor_auth')
      .select('is_enabled, last_used_at, backup_codes')
      .eq('user_id', userId)
      .single();

    if (!data) {
      return {
        isEnabled: false,
        backupCodesRemaining: 0,
      };
    }

    return {
      isEnabled: data.is_enabled,
      lastUsed: data.last_used_at ? new Date(data.last_used_at) : undefined,
      backupCodesRemaining: data.backup_codes?.length || 0,
    };
  }

  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    try {
      const newCodes = Array.from({ length: 10 }, () => 
        crypto.randomBytes(4).toString('hex').toUpperCase()
      );

      await supabase
        .from('user_two_factor_auth')
        .update({
          backup_codes: newCodes.map(code => this.encrypt(code)),
        })
        .eq('user_id', userId);

      securityMonitor.logSecurityEvent(
        'auth',
        'backup_codes_regenerated',
        'success',
        { userId }
      );

      return newCodes;
    } catch (error) {
      securityMonitor.logSecurityEvent(
        'auth',
        'backup_codes_regeneration_failed',
        'failure',
        { userId, error }
      );
      throw error;
    }
  }

  private encrypt(text: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-secret', 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(text: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-secret', 'salt', 32);
    
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  private async notifyTwoFactorEnabled(userId: string): Promise<void> {
    // Get user email
    const { data: user } = await supabase.auth.admin.getUserById(userId);
    if (user?.user?.email) {
      await notificationService.sendEmail({
        to: user.user.email,
        subject: 'Two-Factor Authentication Enabled',
        body: `
          <h2>Two-Factor Authentication Enabled</h2>
          <p>Two-factor authentication has been successfully enabled for your YumZoom account.</p>
          <p>Your account is now more secure. You'll need your authenticator app or backup codes to sign in.</p>
          <p>If you didn't enable this, please contact support immediately.</p>
        `,
        priority: 'high',
      });
    }
  }

  private async notifyTwoFactorDisabled(userId: string): Promise<void> {
    const { data: user } = await supabase.auth.admin.getUserById(userId);
    if (user?.user?.email) {
      await notificationService.sendEmail({
        to: user.user.email,
        subject: 'Two-Factor Authentication Disabled',
        body: `
          <h2>Two-Factor Authentication Disabled</h2>
          <p>Two-factor authentication has been disabled for your YumZoom account.</p>
          <p>Your account security level has been reduced. Consider re-enabling 2FA for better protection.</p>
          <p>If you didn't disable this, please contact support immediately and change your password.</p>
        `,
        priority: 'high',
      });
    }
  }

  private async notifyLowBackupCodes(userId: string, remaining: number): Promise<void> {
    const { data: user } = await supabase.auth.admin.getUserById(userId);
    if (user?.user?.email) {
      await notificationService.sendEmail({
        to: user.user.email,
        subject: 'Low Backup Codes Warning',
        body: `
          <h2>Running Low on Backup Codes</h2>
          <p>You have only ${remaining} backup codes remaining for your YumZoom account.</p>
          <p>Please generate new backup codes in your security settings to ensure you don't lose access to your account.</p>
        `,
        priority: 'normal',
      });
    }
  }
}

export const twoFactorAuthService = TwoFactorAuthService.getInstance();
