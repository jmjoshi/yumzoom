import { createClient } from '@supabase/supabase-js';
import { securityMonitor } from './monitoring';
import { notificationService } from './notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export class RestaurantComplianceService {
  private supabase;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient(supabaseUrl, supabaseServiceKey);
  }

  // Takedown Request Management
  async submitTakedownRequest(request: any): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('restaurant_takedown_requests')
        .insert({
          ...request,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Log security event
      securityMonitor.logSecurityEvent(
        'compliance',
        'takedown_request_submitted',
        'success',
        { 
          requestId: data.id,
          restaurantId: request.restaurant_id,
          reason: request.reason
        }
      );

      // Notify legal team
      await this.notifyLegalTeam('takedown_request', data.id);

      return data;
    } catch (error) {
      console.error('Takedown request submission failed:', error);
      throw error;
    }
  }

  async approveTakedownRequest(id: string, reviewedBy: string, resolutionNotes?: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('restaurant_takedown_requests')
        .update({
          status: 'approved',
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          admin_notes: resolutionNotes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log security event
      securityMonitor.logSecurityEvent(
        'compliance',
        'takedown_request_approved',
        'success',
        { requestId: id, reviewerId: reviewedBy }
      );

      return data;
    } catch (error) {
      console.error('Takedown approval failed:', error);
      throw error;
    }
  }

  async rejectTakedownRequest(id: string, reviewedBy: string, rejectionReason: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('restaurant_takedown_requests')
        .update({
          status: 'rejected',
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          admin_notes: rejectionReason,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log security event
      securityMonitor.logSecurityEvent(
        'compliance',
        'takedown_request_rejected',
        'success',
        { requestId: id, reviewerId: reviewedBy, reason: rejectionReason }
      );

      return data;
    } catch (error) {
      console.error('Takedown rejection failed:', error);
      throw error;
    }
  }

  // Business Owner Verification
  async submitBusinessVerification(request: any): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('business_owner_verifications')
        .insert({
          ...request,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Log security event
      securityMonitor.logSecurityEvent(
        'compliance',
        'business_verification_submitted',
        'success',
        { 
          verificationId: data.id,
          userId: request.user_id,
          restaurantId: request.restaurant_id
        }
      );

      // Notify verification team
      await this.notifyVerificationTeam(data.id);

      return data;
    } catch (error) {
      console.error('Business verification submission failed:', error);
      throw error;
    }
  }

  async approveBusinessVerification(id: string, verifiedBy: string, notes?: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('business_owner_verifications')
        .update({
          status: 'verified',
          verified_by: verifiedBy,
          verified_at: new Date().toISOString(),
          verification_notes: notes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log security event
      securityMonitor.logSecurityEvent(
        'compliance',
        'business_verification_approved',
        'success',
        { verificationId: id, verifierId: verifiedBy }
      );

      return data;
    } catch (error) {
      console.error('Business verification approval failed:', error);
      throw error;
    }
  }

  async rejectBusinessVerification(id: string, verifiedBy: string, rejectionReason: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('business_owner_verifications')
        .update({
          status: 'rejected',
          verified_by: verifiedBy,
          verified_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log security event
      securityMonitor.logSecurityEvent(
        'compliance',
        'business_verification_rejected',
        'success',
        { verificationId: id, verifierId: verifiedBy, reason: rejectionReason }
      );

      return data;
    } catch (error) {
      console.error('Business verification rejection failed:', error);
      throw error;
    }
  }

  // Legal Notice Management
  async submitLegalNotice(notice: any): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('legal_notices')
        .insert({
          ...notice,
          status: 'received',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Log security event
      securityMonitor.logSecurityEvent(
        'compliance',
        'legal_notice_submitted',
        'success',
        { 
          noticeId: data.id,
          type: notice.type,
          priority: notice.priority
        }
      );

      return data;
    } catch (error) {
      console.error('Legal notice submission failed:', error);
      throw error;
    }
  }

  // Private helper methods
  private async notifyLegalTeam(type: string, itemId: string): Promise<void> {
    try {
      await notificationService.sendEmail({
        to: process.env.LEGAL_TEAM_EMAIL || 'legal@yumzoom.com',
        subject: `New ${type.replace('_', ' ')} requiring review`,
        body: `
          <h2>New ${type.replace('_', ' ')} Submitted</h2>
          <p>A new ${type.replace('_', ' ')} has been submitted and requires your review.</p>
          <p><strong>Item ID:</strong> ${itemId}</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/compliance/${type}/${itemId}">Review Item</a></p>
        `,
        priority: 'high',
      });
    } catch (error) {
      console.error('Failed to notify legal team:', error);
    }
  }

  private async notifyVerificationTeam(verificationId: string): Promise<void> {
    try {
      await notificationService.sendEmail({
        to: process.env.VERIFICATION_TEAM_EMAIL || 'verification@yumzoom.com',
        subject: 'New business owner verification request',
        body: `
          <h2>New Business Owner Verification</h2>
          <p>A new business owner verification request has been submitted.</p>
          <p><strong>Verification ID:</strong> ${verificationId}</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/compliance/verification/${verificationId}">Review Verification</a></p>
        `,
        priority: 'normal',
      });
    } catch (error) {
      console.error('Failed to notify verification team:', error);
    }
  }
}

export const restaurantComplianceService = new RestaurantComplianceService();
