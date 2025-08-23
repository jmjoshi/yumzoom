// =====================================================
// YumZoom Business Platform Features Types
// TypeScript type definitions for subscription plans,
// advertising platform, API platform, and admin tools
// =====================================================

// =====================================================
// SUBSCRIPTION PLANS AND MANAGEMENT
// =====================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  price_monthly: number;
  price_yearly?: number;
  features: string[];
  limits: Record<string, number>;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RestaurantSubscription {
  id: string;
  restaurant_id: string;
  subscription_plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending' | 'trial';
  started_at: string;
  expires_at: string;
  cancelled_at?: string;
  trial_ends_at?: string;
  auto_renew: boolean;
  payment_method_id?: string;
  billing_cycle: 'monthly' | 'yearly';
  created_at: string;
  updated_at: string;
  subscription_plan?: SubscriptionPlan;
}

export interface SubscriptionUsage {
  id: string;
  restaurant_subscription_id: string;
  feature_name: string;
  usage_count: number;
  usage_period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionFeatureAccess {
  feature_name: string;
  has_access: boolean;
  usage_limit?: number;
  current_usage?: number;
  usage_remaining?: number;
}

// =====================================================
// ADVERTISING PLATFORM
// =====================================================

export interface AdCampaign {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  campaign_type: 'promoted_listing' | 'targeted_recommendation' | 'sponsored_content' | 'banner_ad';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  budget_type: 'daily' | 'total';
  budget_amount: number;
  spent_amount: number;
  start_date: string;
  end_date?: string;
  targeting_criteria: AdTargetingCriteria;
  creative_assets: AdCreativeAssets;
  performance_goals?: AdPerformanceGoals;
  created_at: string;
  updated_at: string;
}

export interface AdTargetingCriteria {
  geographic_radius?: number;
  age_ranges?: string[];
  family_size?: number[];
  cuisine_preferences?: string[];
  dining_frequency?: string[];
  price_range_preferences?: string[];
  visit_times?: string[];
  device_types?: string[];
}

export interface AdCreativeAssets {
  headline?: string;
  description?: string;
  images?: string[];
  call_to_action?: string;
  promotional_text?: string;
  logo_url?: string;
}

export interface AdPerformanceGoals {
  target_impressions?: number;
  target_clicks?: number;
  target_conversions?: number;
  target_ctr?: number;
  target_conversion_rate?: number;
  target_cost_per_click?: number;
  target_cost_per_conversion?: number;
}

export interface AdInteraction {
  id: string;
  ad_campaign_id: string;
  user_id?: string;
  interaction_type: 'impression' | 'click' | 'conversion';
  location_context?: string;
  device_type?: string;
  referrer_page?: string;
  interaction_data?: Record<string, any>;
  cost_per_interaction?: number;
  created_at: string;
}

export interface AdPerformanceMetrics {
  id: string;
  ad_campaign_id: string;
  date_period: string;
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
  reach: number;
  engagement_rate: number;
  click_through_rate: number;
  conversion_rate: number;
  cost_per_click: number;
  cost_per_conversion: number;
  created_at: string;
  updated_at: string;
}

export interface AdCampaignPerformanceSummary {
  campaign: AdCampaign;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  total_cost: number;
  average_ctr: number;
  average_conversion_rate: number;
  average_cpc: number;
  average_cpa: number;
  daily_metrics: AdPerformanceMetrics[];
}

// =====================================================
// API PLATFORM FOR THIRD-PARTY DEVELOPERS
// =====================================================

export interface ApiApplication {
  id: string;
  name: string;
  description?: string;
  developer_email: string;
  developer_organization?: string;
  app_type: 'web' | 'mobile' | 'backend' | 'webhook';
  status: 'pending' | 'approved' | 'suspended' | 'revoked';
  api_key: string;
  api_secret: string;
  webhook_url?: string;
  allowed_origins?: string[];
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  scopes: string[];
  last_used_at?: string;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiUsageLog {
  id: string;
  api_application_id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms?: number;
  request_size_bytes?: number;
  response_size_bytes?: number;
  user_agent?: string;
  ip_address?: string;
  error_message?: string;
  created_at: string;
}

export interface ApiRateLimit {
  id: string;
  api_application_id: string;
  period_type: 'hour' | 'day';
  period_start: string;
  request_count: number;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  api_application_id: string;
  event_type: string;
  payload: Record<string, any>;
  webhook_url: string;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  http_status_code?: number;
  response_body?: string;
  retry_count: number;
  max_retries: number;
  next_retry_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiApplicationStats {
  application: ApiApplication;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
  requests_per_day: number[];
  popular_endpoints: {
    endpoint: string;
    request_count: number;
  }[];
  error_rate: number;
}

// =====================================================
// ADVANCED RESTAURANT ADMIN TOOLS
// =====================================================

export interface RestaurantAdminAccess {
  id: string;
  restaurant_owner_id: string;
  tool_name: string;
  access_level: 'view' | 'edit' | 'admin' | 'owner';
  granted_by?: string;
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RestaurantPromotion {
  id: string;
  restaurant_id: string;
  title: string;
  description?: string;
  promotion_type: 'discount' | 'special_menu' | 'event' | 'seasonal';
  discount_percentage?: number;
  discount_amount?: number;
  promo_code?: string;
  valid_from: string;
  valid_until: string;
  max_uses?: number;
  current_uses: number;
  target_audience?: PromotionTargetAudience;
  terms_conditions?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromotionTargetAudience {
  family_sizes?: number[];
  cuisine_preferences?: string[];
  visit_frequency?: string[];
  price_preferences?: string[];
  age_groups?: string[];
  location_radius?: number;
}

export interface CustomerEngagementEvent {
  id: string;
  restaurant_id: string;
  user_id?: string;
  event_type: 'profile_view' | 'menu_view' | 'rating_submitted' | 'review_written' | 'photo_uploaded' | 'promotion_viewed' | 'promotion_used';
  event_data?: Record<string, any>;
  session_id?: string;
  device_type?: string;
  referrer?: string;
  created_at: string;
}

export interface RestaurantInsight {
  id: string;
  restaurant_id: string;
  insight_type: 'performance' | 'customer_behavior' | 'competitive' | 'recommendation';
  title: string;
  description?: string;
  insight_data: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'viewed' | 'acted_upon' | 'dismissed';
  action_required: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// DASHBOARD AND ANALYTICS TYPES
// =====================================================

export interface BusinessDashboardStats {
  restaurant_id: string;
  subscription_plan: SubscriptionPlan;
  subscription_status: RestaurantSubscription['status'];
  subscription_expires_at: string;
  
  // Performance metrics
  total_views: number;
  total_ratings: number;
  average_rating: number;
  total_reviews: number;
  
  // Engagement metrics
  monthly_engagement_events: number;
  top_engagement_types: {
    event_type: string;
    count: number;
  }[];
  
  // Subscription usage
  feature_usage: SubscriptionFeatureAccess[];
  
  // Active campaigns
  active_ad_campaigns: number;
  total_ad_spend: number;
  ad_performance_summary: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
  };
  
  // Insights and recommendations
  pending_insights: number;
  high_priority_insights: RestaurantInsight[];
  
  // Promotions
  active_promotions: number;
  promotion_performance: {
    total_views: number;
    total_uses: number;
    conversion_rate: number;
  };
}

export interface SubscriptionUpgradeRecommendation {
  current_plan: SubscriptionPlan;
  recommended_plan: SubscriptionPlan;
  reasons: string[];
  potential_benefits: string[];
  cost_difference: number;
  feature_comparisons: {
    feature: string;
    current_limit: number | string;
    recommended_limit: number | string;
  }[];
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface CreateSubscriptionRequest {
  restaurant_id: string;
  subscription_plan_id: string;
  billing_cycle: 'monthly' | 'yearly';
  payment_method_id?: string;
  auto_renew?: boolean;
}

export interface UpdateSubscriptionRequest {
  subscription_id: string;
  auto_renew?: boolean;
  payment_method_id?: string;
}

export interface CreateAdCampaignRequest {
  restaurant_id: string;
  name: string;
  description?: string;
  campaign_type: AdCampaign['campaign_type'];
  budget_type: AdCampaign['budget_type'];
  budget_amount: number;
  start_date: string;
  end_date?: string;
  targeting_criteria: AdTargetingCriteria;
  creative_assets: AdCreativeAssets;
  performance_goals?: AdPerformanceGoals;
}

export interface UpdateAdCampaignRequest {
  campaign_id: string;
  name?: string;
  description?: string;
  status?: AdCampaign['status'];
  budget_amount?: number;
  end_date?: string;
  targeting_criteria?: AdTargetingCriteria;
  creative_assets?: AdCreativeAssets;
  performance_goals?: AdPerformanceGoals;
}

export interface CreateApiApplicationRequest {
  name: string;
  description?: string;
  developer_email: string;
  developer_organization?: string;
  app_type: ApiApplication['app_type'];
  webhook_url?: string;
  allowed_origins?: string[];
  scopes: string[];
}

export interface CreatePromotionRequest {
  restaurant_id: string;
  title: string;
  description?: string;
  promotion_type: RestaurantPromotion['promotion_type'];
  discount_percentage?: number;
  discount_amount?: number;
  promo_code?: string;
  valid_from: string;
  valid_until: string;
  max_uses?: number;
  target_audience?: PromotionTargetAudience;
  terms_conditions?: string;
  image_url?: string;
}

export interface BusinessPlatformError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// =====================================================
// UTILITY TYPES
// =====================================================

export type SubscriptionFeatureName = 
  | 'basic_profile'
  | 'respond_to_reviews'
  | 'view_analytics'
  | 'view_basic_analytics'
  | 'advanced_analytics'
  | 'promotional_content'
  | 'customer_insights'
  | 'ad_campaigns'
  | 'api_access'
  | 'priority_support'
  | 'custom_integrations';

export type ApiScope =
  | 'read:restaurants'
  | 'read:ratings'
  | 'read:reviews'
  | 'read:analytics'
  | 'write:restaurants'
  | 'write:responses'
  | 'webhook:all';

export type AdminToolName =
  | 'analytics_dashboard'
  | 'customer_insights'
  | 'promotional_manager'
  | 'ad_campaign_manager'
  | 'api_management'
  | 'subscription_manager'
  | 'business_insights';

// =====================================================
// RESPONSE WRAPPER TYPES
// =====================================================

export interface BusinessPlatformResponse<T> {
  success: boolean;
  data?: T;
  error?: BusinessPlatformError;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface FilterParams {
  status?: string;
  date_from?: string;
  date_to?: string;
  campaign_type?: string;
  subscription_plan?: string;
}
