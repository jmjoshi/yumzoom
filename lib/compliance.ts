import { createClient } from '@supabase/supabase-js';
import { generateSecureUrl } from './https-config';
import { securityMonitor } from './monitoring';
import { notificationService } from './notifications';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface DataExportRequest {
  id: string;
  userId: string;
  requestType: 'gdpr' | 'ccpa' | 'general';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
}

export interface DataDeletionRequest {
  id: string;
  userId: string;
  requestType: 'gdpr' | 'ccpa' | 'general';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: Date;
  completedAt?: Date;
  retentionPeriod?: number; // days
}

export interface ConsentRecord {
  userId: string;
  consentType: 'essential' | 'analytics' | 'marketing' | 'functional';
  granted: boolean;
  grantedAt: Date;
  ipAddress: string;
  userAgent: string;
  version: string;
}

export interface PrivacySettings {
  dataProcessing: boolean;
  marketing: boolean;
  analytics: boolean;
  profileVisibility: 'public' | 'friends' | 'private';
  activityTracking: boolean;
  emailNotifications: boolean;
  dataRetention: 'standard' | 'minimal' | 'extended';
}

class ComplianceService {
  private static instance: ComplianceService;

  private constructor() {}

  public static getInstance(): ComplianceService {
    if (!ComplianceService.instance) {
      ComplianceService.instance = new ComplianceService();
    }
    return ComplianceService.instance;
  }

  /**
   * Record user consent
   */
  async recordConsent(
    userId: string,
    consents: Partial<Record<ConsentRecord['consentType'], boolean>>,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      const consentRecords = Object.entries(consents).map(([type, granted]) => ({
        user_id: userId,
        consent_type: type,
        granted,
        granted_at: new Date().toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
        version: '1.0', // Increment when consent options change
      }));

      await supabase
        .from('user_consent_records')
        .insert(consentRecords);

      securityMonitor.logSecurityEvent(
        'database',
        'consent_recorded',
        'success',
        { userId, consents }
      );
    } catch (error) {
      securityMonitor.logSecurityEvent(
        'database',
        'consent_recording_failed',
        'failure',
        { userId, error }
      );
      throw error;
    }
  }

  /**
   * Get current consent status
   */
  async getConsentStatus(userId: string): Promise<Record<string, boolean>> {
    try {
      const { data: consents } = await supabase
        .from('user_consent_records')
        .select('consent_type, granted')
        .eq('user_id', userId)
        .order('granted_at', { ascending: false });

      if (!consents) return {};

      // Get latest consent for each type
      const latestConsents: Record<string, boolean> = {};
      consents.forEach(consent => {
        if (!(consent.consent_type in latestConsents)) {
          latestConsents[consent.consent_type] = consent.granted;
        }
      });

      return latestConsents;
    } catch (error) {
      securityMonitor.logSecurityEvent(
        'database',
        'consent_retrieval_failed',
        'failure',
        { userId, error }
      );
      throw error;
    }
  }

  /**
   * Request data export (GDPR Article 15 / CCPA Right to Know)
   */
  async requestDataExport(
    userId: string,
    requestType: 'gdpr' | 'ccpa' | 'general' = 'general'
  ): Promise<string> {
    try {
      const { data: request } = await supabase
        .from('data_export_requests')
        .insert({
          user_id: userId,
          request_type: requestType,
          status: 'pending',
          requested_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (!request) {
        throw new Error('Failed to create export request');
      }

      securityMonitor.logSecurityEvent(
        'database',
        'data_export_requested',
        'success',
        { userId, requestType, requestId: request.id }
      );

      // Process export asynchronously
      this.processDataExport(request.id).catch(error => {
        console.error('Data export processing failed:', error);
      });

      return request.id;
    } catch (error) {
      securityMonitor.logSecurityEvent(
        'database',
        'data_export_request_failed',
        'failure',
        { userId, error }
      );
      throw error;
    }
  }

  /**
   * Request data deletion (GDPR Article 17 / CCPA Right to Delete)
   */
  async requestDataDeletion(
    userId: string,
    requestType: 'gdpr' | 'ccpa' | 'general' = 'general'
  ): Promise<string> {
    try {
      const { data: request } = await supabase
        .from('data_deletion_requests')
        .insert({
          user_id: userId,
          request_type: requestType,
          status: 'pending',
          requested_at: new Date().toISOString(),
          retention_period: this.getRetentionPeriod(requestType),
        })
        .select('id')
        .single();

      if (!request) {
        throw new Error('Failed to create deletion request');
      }

      securityMonitor.logSecurityEvent(
        'database',
        'data_deletion_requested',
        'success',
        { userId, requestType, requestId: request.id }
      );

      // Notify admins for manual review
      await this.notifyAdminsOfDeletionRequest(userId, request.id, requestType);

      return request.id;
    } catch (error) {
      securityMonitor.logSecurityEvent(
        'database',
        'data_deletion_request_failed',
        'failure',
        { userId, error }
      );
      throw error;
    }
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(
    userId: string,
    settings: Partial<PrivacySettings>
  ): Promise<void> {
    try {
      await supabase
        .from('user_privacy_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString(),
        });

      securityMonitor.logSecurityEvent(
        'database',
        'privacy_settings_updated',
        'success',
        { userId, settings }
      );
    } catch (error) {
      securityMonitor.logSecurityEvent(
        'database',
        'privacy_settings_update_failed',
        'failure',
        { userId, error }
      );
      throw error;
    }
  }

  /**
   * Get privacy settings
   */
  async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    try {
      const { data: settings } = await supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!settings) {
        // Return default settings
        return {
          dataProcessing: true,
          marketing: false,
          analytics: false,
          profileVisibility: 'friends',
          activityTracking: true,
          emailNotifications: true,
          dataRetention: 'standard',
        };
      }

      return {
        dataProcessing: settings.data_processing,
        marketing: settings.marketing,
        analytics: settings.analytics,
        profileVisibility: settings.profile_visibility,
        activityTracking: settings.activity_tracking,
        emailNotifications: settings.email_notifications,
        dataRetention: settings.data_retention,
      };
    } catch (error) {
      securityMonitor.logSecurityEvent(
        'database',
        'privacy_settings_retrieval_failed',
        'failure',
        { userId, error }
      );
      throw error;
    }
  }

  /**
   * Check if user can be contacted for marketing
   */
  async canContactForMarketing(userId: string): Promise<boolean> {
    const consents = await this.getConsentStatus(userId);
    const privacySettings = await this.getPrivacySettings(userId);
    
    return consents.marketing === true && privacySettings.marketing === true;
  }

  /**
   * Check if analytics can be collected
   */
  async canCollectAnalytics(userId: string): Promise<boolean> {
    const consents = await this.getConsentStatus(userId);
    const privacySettings = await this.getPrivacySettings(userId);
    
    return consents.analytics === true && privacySettings.analytics === true;
  }

  /**
   * Process data export request
   */
  private async processDataExport(requestId: string): Promise<void> {
    try {
      // Mark as processing
      await supabase
        .from('data_export_requests')
        .update({ status: 'processing' })
        .eq('id', requestId);

      // Get request details
      const { data: request } = await supabase
        .from('data_export_requests')
        .select('user_id, request_type')
        .eq('id', requestId)
        .single();

      if (!request) {
        throw new Error('Request not found');
      }

      // Collect all user data
      const userData = await this.collectUserData(request.user_id);

      // Generate export file (JSON format)
      const exportData = {
        exportDate: new Date().toISOString(),
        requestType: request.request_type,
        userData,
      };

      // In a real implementation, you'd upload this to secure storage
      // For now, we'll simulate generating a download URL
      const downloadUrl = await this.generateSecureDownloadUrl(
        JSON.stringify(exportData, null, 2),
        requestId
      );

      // Mark as completed
      await supabase
        .from('data_export_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          download_url: downloadUrl,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        })
        .eq('id', requestId);

      // Notify user
      await this.notifyUserOfExportCompletion(request.user_id, downloadUrl);

    } catch (error) {
      await supabase
        .from('data_export_requests')
        .update({ status: 'failed' })
        .eq('id', requestId);

      securityMonitor.logSecurityEvent(
        'database',
        'data_export_processing_failed',
        'failure',
        { requestId, error }
      );
    }
  }

  /**
   * Collect all user data for export
   */
  private async collectUserData(userId: string): Promise<any> {
    const userData: any = {};

    try {
      // Basic profile data
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      userData.profile = profile;

      // Reviews and ratings
      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', userId);
      userData.reviews = reviews;

      // Restaurant ratings
      const { data: ratings } = await supabase
        .from('restaurant_ratings')
        .select('*')
        .eq('user_id', userId);
      userData.ratings = ratings;

      // Social connections
      const { data: connections } = await supabase
        .from('user_connections')
        .select('*')
        .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`);
      userData.socialConnections = connections;

      // Favorites
      const { data: favorites } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', userId);
      userData.favorites = favorites;

      // Family memberships
      const { data: familyMemberships } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', userId);
      userData.familyMemberships = familyMemberships;

      // Privacy settings
      const { data: privacySettings } = await supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', userId);
      userData.privacySettings = privacySettings;

      // Consent records
      const { data: consentRecords } = await supabase
        .from('user_consent_records')
        .select('*')
        .eq('user_id', userId);
      userData.consentRecords = consentRecords;

      return userData;
    } catch (error) {
      securityMonitor.logSecurityEvent(
        'database',
        'user_data_collection_failed',
        'failure',
        { userId, error }
      );
      throw error;
    }
  }

  /**
   * Generate secure download URL for export data
   */
  private async generateSecureDownloadUrl(data: string, requestId: string): Promise<string> {
    // In a real implementation, you'd upload to secure cloud storage
    // and generate a signed URL. For now, we'll return a placeholder
    return generateSecureUrl(`/api/data-export/${requestId}/download`);
  }

  /**
   * Get data retention period based on request type
   */
  private getRetentionPeriod(requestType: string): number {
    switch (requestType) {
      case 'gdpr':
        return 30; // 30 days as per GDPR
      case 'ccpa':
        return 45; // 45 days as per CCPA
      default:
        return 30;
    }
  }

  /**
   * Notify admins of deletion request
   */
  private async notifyAdminsOfDeletionRequest(
    userId: string,
    requestId: string,
    requestType: string
  ): Promise<void> {
    const adminEmail = process.env.GDPR_COMPLIANCE_EMAIL;
    if (adminEmail) {
      await notificationService.sendEmail({
        to: adminEmail,
        subject: `Data Deletion Request - ${requestType.toUpperCase()}`,
        body: `
          <h2>Data Deletion Request</h2>
          <p><strong>Request ID:</strong> ${requestId}</p>
          <p><strong>User ID:</strong> ${userId}</p>
          <p><strong>Request Type:</strong> ${requestType.toUpperCase()}</p>
          <p><strong>Requested At:</strong> ${new Date().toISOString()}</p>
          
          <p>Please review this request and take appropriate action within the required timeframe.</p>
          
          <p><a href="${generateSecureUrl('/admin/compliance')}">Review in Admin Panel</a></p>
        `,
        priority: 'high',
      });
    }
  }

  /**
   * Notify user of export completion
   */
  private async notifyUserOfExportCompletion(
    userId: string,
    downloadUrl: string
  ): Promise<void> {
    const { data: user } = await supabase.auth.admin.getUserById(userId);
    
    if (user?.user?.email) {
      await notificationService.sendEmail({
        to: user.user.email,
        subject: 'Your Data Export is Ready',
        body: `
          <h2>Data Export Complete</h2>
          <p>Your requested data export is now ready for download.</p>
          
          <p><strong>Download Link:</strong> <a href="${downloadUrl}">Download Your Data</a></p>
          
          <p><strong>Important:</strong></p>
          <ul>
            <li>This link will expire in 7 days</li>
            <li>The download requires authentication</li>
            <li>Please store your data securely</li>
          </ul>
          
          <p>If you have any questions, please contact our support team.</p>
        `,
        priority: 'high',
      });
    }
  }
}

export const complianceService = ComplianceService.getInstance();
