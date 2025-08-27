// Restaurant Compliance System Types
// Types for restaurant compliance, takedown requests, business verification, and legal notices

export interface RestaurantTakedownRequest {
  id: string;
  restaurant_id: string;
  requester_id: string | null;
  requester_type: 'owner' | 'legal_representative' | 'customer' | 'other';
  reason: 'ownership_dispute' | 'incorrect_information' | 'privacy_violation' | 'copyright_violation' | 'other';
  description: string;
  contact_email: string;
  verification_documents: string[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'completed';
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_notes: string | null;
  resolution_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessOwnerVerification {
  id: string;
  user_id: string;
  restaurant_id: string;
  business_name: string;
  business_email: string;
  business_phone: string;
  business_address: string;
  verification_documents: string[];
  status: 'pending' | 'verified' | 'rejected' | 'requires_additional_info';
  submitted_at: string;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  verification_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DataAttribution {
  id: string;
  data_type: 'restaurant_info' | 'menu' | 'photos' | 'reviews' | 'ratings';
  restaurant_id: string;
  source_type: 'user_submission' | 'business_owner' | 'admin_entry' | 'api_import' | 'public_data';
  source_id: string;
  source_name: string;
  contributor_id: string | null;
  original_url: string | null;
  license_type: 'user_generated' | 'business_provided' | 'public_domain' | 'licensed' | 'fair_use';
  created_at: string;
  last_verified: string | null;
  verification_status: 'unverified' | 'verified' | 'disputed' | 'removed';
  updated_at: string;
}

export interface LegalNotice {
  id: string;
  type: 'takedown_notice' | 'copyright_claim' | 'trademark_dispute' | 'privacy_complaint' | 'data_correction';
  restaurant_id: string | null;
  claimant_name: string;
  claimant_email: string;
  claimant_type: 'individual' | 'business' | 'legal_representative';
  description: string;
  affected_content: string[];
  legal_basis: string;
  requested_action: 'remove' | 'modify' | 'attribute' | 'clarify';
  supporting_documents: string[];
  status: 'received' | 'under_review' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submitted_at: string;
  review_deadline: string;
  resolved_at: string | null;
  resolution: string | null;
  created_at: string;
  updated_at: string;
}

export interface RestaurantOwner {
  id: string;
  user_id: string;
  restaurant_id: string;
  role: 'owner' | 'manager' | 'representative';
  verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  permissions: {
    can_edit: boolean;
    can_respond_reviews: boolean;
    can_manage_menu: boolean;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

// Compliance Dashboard Types
export interface ComplianceDashboard {
  pending_takedowns: number;
  pending_verifications: number;
  active_legal_notices: number;
  recent_attributions: number;
  urgent_items: number;
}

export interface ComplianceActivity {
  recent_takedowns: Array<RestaurantTakedownRequest & {
    restaurants?: { name: string };
  }>;
  recent_verifications: Array<BusinessOwnerVerification & {
    restaurants?: { name: string };
  }>;
  recent_legal_notices: LegalNotice[];
  upcoming_deadlines: LegalNotice[];
}

export interface ComplianceTrends {
  takedown_requests_trend: number;
  period: string;
}

export interface ComplianceDashboardData {
  overview: ComplianceDashboard;
  activity: ComplianceActivity;
  trends: ComplianceTrends;
  errors?: {
    takedowns?: any;
    verifications?: any;
    legal_notices?: any;
    deadlines?: any;
  };
}

// Form Types for UI Components
export interface TakedownRequestForm {
  restaurant_id: string;
  requester_type: RestaurantTakedownRequest['requester_type'];
  reason: RestaurantTakedownRequest['reason'];
  description: string;
  contact_email: string;
  verification_documents?: string[];
}

export interface BusinessVerificationForm {
  restaurant_id: string;
  business_name: string;
  business_email: string;
  business_phone: string;
  business_address: string;
  verification_documents: string[];
}

export interface LegalNoticeForm {
  type: LegalNotice['type'];
  restaurant_id?: string;
  claimant_name: string;
  claimant_email: string;
  claimant_type: LegalNotice['claimant_type'];
  description: string;
  affected_content: string[];
  legal_basis: string;
  requested_action: LegalNotice['requested_action'];
  supporting_documents?: string[];
  priority?: LegalNotice['priority'];
}

// API Response Types
export interface ComplianceApiResponse<T = any> {
  data?: T;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Restaurant Compliance Service Types
export interface RestaurantComplianceConfig {
  auto_approval_threshold: number;
  review_deadline_hours: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  notification_settings: {
    email_enabled: boolean;
    slack_webhook?: string;
    sms_enabled: boolean;
  };
}

export interface ComplianceMetrics {
  total_requests: number;
  pending_requests: number;
  resolved_requests: number;
  average_resolution_time: number;
  compliance_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

// File Upload Types
export interface DocumentUpload {
  file: File;
  type: string;
  description?: string;
}

export interface UploadedDocument {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
  description?: string;
}

// Notification Types
export interface ComplianceNotification {
  id: string;
  type: 'takedown_request' | 'legal_notice' | 'verification_request' | 'deadline_reminder';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recipient_id: string;
  related_id: string;
  read: boolean;
  created_at: string;
}

// All types are already exported above with their interface declarations
