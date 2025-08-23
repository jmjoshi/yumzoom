import crypto from 'crypto';
import { securityMonitor } from './monitoring';

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  tag?: string;
}

export interface EncryptionKeyInfo {
  keyId: string;
  algorithm: string;
  keySize: number;
  createdAt: Date;
  rotatedAt?: Date;
  isActive: boolean;
}

class EncryptionService {
  private static instance: EncryptionService;
  private readonly algorithm = 'aes-256-gcm';
  private readonly keySize = 32; // 256 bits
  private readonly ivSize = 16; // 128 bits
  private currentKeyId: string;

  private constructor() {
    this.currentKeyId = this.generateKeyId();
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(data: string, keyId?: string): EncryptionResult {
    try {
      const key = this.getEncryptionKey(keyId || this.currentKeyId);
      const iv = crypto.randomBytes(this.ivSize);
      
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAAD(Buffer.from(keyId || this.currentKeyId));
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();

      securityMonitor.logSecurityEvent(
        'database',
        'data_encrypted',
        'success',
        { keyId: keyId || this.currentKeyId, dataLength: data.length }
      );

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
      };
    } catch (error) {
      securityMonitor.logSecurityEvent(
        'database',
        'encryption_failed',
        'failure',
        { keyId: keyId || this.currentKeyId, error }
      );
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: EncryptionResult, keyId?: string): string {
    try {
      const key = this.getEncryptionKey(keyId || this.currentKeyId);
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = encryptedData.tag ? Buffer.from(encryptedData.tag, 'hex') : undefined;
      
      const decipher = crypto.createDecipher(this.algorithm, key);
      if (tag) {
        decipher.setAuthTag(tag);
      }
      decipher.setAAD(Buffer.from(keyId || this.currentKeyId));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      securityMonitor.logSecurityEvent(
        'database',
        'data_decrypted',
        'success',
        { keyId: keyId || this.currentKeyId }
      );

      return decrypted;
    } catch (error) {
      securityMonitor.logSecurityEvent(
        'database',
        'decryption_failed',
        'failure',
        { keyId: keyId || this.currentKeyId, error }
      );
      throw new Error('Decryption failed');
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  hash(data: string, salt?: string): string {
    try {
      const actualSalt = salt || crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync(data, actualSalt, 64);
      
      securityMonitor.logSecurityEvent(
        'database',
        'data_hashed',
        'success',
        { dataLength: data.length }
      );

      return actualSalt + ':' + hash.toString('hex');
    } catch (error) {
      securityMonitor.logSecurityEvent(
        'database',
        'hashing_failed',
        'failure',
        { error }
      );
      throw new Error('Hashing failed');
    }
  }

  /**
   * Verify hashed data
   */
  verifyHash(data: string, hashedData: string): boolean {
    try {
      const [salt, hash] = hashedData.split(':');
      const newHash = crypto.scryptSync(data, salt, 64);
      
      const isValid = crypto.timingSafeEqual(
        Buffer.from(hash, 'hex'),
        newHash
      );

      securityMonitor.logSecurityEvent(
        'database',
        'hash_verified',
        isValid ? 'success' : 'failure',
        { isValid }
      );

      return isValid;
    } catch (error) {
      securityMonitor.logSecurityEvent(
        'database',
        'hash_verification_failed',
        'failure',
        { error }
      );
      return false;
    }
  }

  /**
   * Encrypt PII (Personally Identifiable Information)
   */
  encryptPII(data: string): string {
    const result = this.encrypt(data);
    return `${this.currentKeyId}:${result.iv}:${result.tag}:${result.encrypted}`;
  }

  /**
   * Decrypt PII
   */
  decryptPII(encryptedPII: string): string {
    const [keyId, iv, tag, encrypted] = encryptedPII.split(':');
    return this.decrypt({ encrypted, iv, tag }, keyId);
  }

  /**
   * Encrypt payment information
   */
  encryptPaymentInfo(data: string): string {
    // Use additional security for payment data
    const salt = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.getEncryptionKey(this.currentKeyId), salt, 32);
    
    const result = this.encrypt(data, this.currentKeyId);
    return `${this.currentKeyId}:${salt.toString('hex')}:${result.iv}:${result.tag}:${result.encrypted}`;
  }

  /**
   * Generate secure tokens
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate API keys
   */
  generateAPIKey(): { key: string; hash: string } {
    const key = `yz_${crypto.randomBytes(32).toString('hex')}`;
    const hash = this.hash(key);
    
    securityMonitor.logSecurityEvent(
      'auth',
      'api_key_generated',
      'success',
      { keyPrefix: key.substring(0, 8) }
    );

    return { key, hash };
  }

  /**
   * Verify API key
   */
  verifyAPIKey(providedKey: string, storedHash: string): boolean {
    return this.verifyHash(providedKey, storedHash);
  }

  /**
   * Rotate encryption keys
   */
  rotateKey(): string {
    const oldKeyId = this.currentKeyId;
    this.currentKeyId = this.generateKeyId();
    
    securityMonitor.logSecurityEvent(
      'auth',
      'encryption_key_rotated',
      'success',
      { oldKeyId, newKeyId: this.currentKeyId }
    );

    return this.currentKeyId;
  }

  /**
   * Get current key information
   */
  getCurrentKeyInfo(): EncryptionKeyInfo {
    return {
      keyId: this.currentKeyId,
      algorithm: this.algorithm,
      keySize: this.keySize,
      createdAt: new Date(),
      isActive: true,
    };
  }

  /**
   * Encrypt file contents
   */
  encryptFile(fileBuffer: Buffer): EncryptionResult {
    const data = fileBuffer.toString('base64');
    return this.encrypt(data);
  }

  /**
   * Decrypt file contents
   */
  decryptFile(encryptedData: EncryptionResult): Buffer {
    const data = this.decrypt(encryptedData);
    return Buffer.from(data, 'base64');
  }

  /**
   * Generate HMAC signature
   */
  generateHMAC(data: string, secret?: string): string {
    const key = secret || this.getEncryptionKey(this.currentKeyId);
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  verifyHMAC(data: string, signature: string, secret?: string): boolean {
    const expectedSignature = this.generateHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Secure compare strings
   */
  secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  /**
   * Generate password hash with salt
   */
  hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verify password
   */
  verifyPassword(password: string, hashedPassword: string): boolean {
    try {
      const [salt, hash] = hashedPassword.split(':');
      const newHash = crypto.scryptSync(password, salt, 64).toString('hex');
      return this.secureCompare(hash, newHash);
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate session token
   */
  generateSessionToken(): { token: string; expiresAt: Date } {
    const token = this.generateSecureToken(48);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    return { token, expiresAt };
  }

  /**
   * Get encryption key by ID
   */
  private getEncryptionKey(keyId: string): string {
    // In production, retrieve keys from secure key management service
    // For now, derive from environment variable
    const baseKey = process.env.ENCRYPTION_SECRET || 'default-encryption-secret';
    return crypto.scryptSync(baseKey, keyId, 32).toString('hex');
  }

  /**
   * Generate unique key ID
   */
  private generateKeyId(): string {
    return `key_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Encrypt database fields
   */
  encryptDatabaseField(fieldName: string, value: string, userId?: string): string {
    const context = `${fieldName}:${userId || 'system'}`;
    const contextHash = crypto.createHash('sha256').update(context).digest('hex').substring(0, 16);
    
    const result = this.encrypt(value);
    return `${this.currentKeyId}:${contextHash}:${result.iv}:${result.tag}:${result.encrypted}`;
  }

  /**
   * Decrypt database fields
   */
  decryptDatabaseField(encryptedValue: string, fieldName: string, userId?: string): string {
    const [keyId, contextHash, iv, tag, encrypted] = encryptedValue.split(':');
    
    // Verify context
    const context = `${fieldName}:${userId || 'system'}`;
    const expectedHash = crypto.createHash('sha256').update(context).digest('hex').substring(0, 16);
    
    if (!this.secureCompare(contextHash, expectedHash)) {
      throw new Error('Invalid encryption context');
    }
    
    return this.decrypt({ encrypted, iv, tag }, keyId);
  }
}

export const encryptionService = EncryptionService.getInstance();
