// Advanced Analytics Phase 2 - TypeScript Types
// Implements predictive analytics, competitive analysis, platform statistics, and custom reports

// =====================================================================
// PLATFORM USAGE STATISTICS TYPES
// =====================================================================

export interface PlatformUsageStatistics {
  date: string;
  total_active_users: number;
  total_families: number;
  total_restaurants: number;
  total_ratings: number;
  new_users_count: number;
  new_restaurants_count: number;
  new_ratings_count: number;
  average_session_duration?: string; // ISO duration
  platform_engagement_score: number;
  user_growth_rate?: number;
  restaurant_growth_rate?: number;
  rating_growth_rate?: number;
}

export interface PlatformGrowthMetrics {
  period: string;
  user_acquisition: {
    new_users: number;
    growth_rate: number;
    retention_rate: number;
  };
  content_growth: {
    new_restaurants: number;
    new_ratings: number;
    content_quality_score: number;
  };
  engagement_metrics: {
    avg_session_duration: number;
    pages_per_session: number;
    bounce_rate: number;
  };
}

// =====================================================================
// USER BEHAVIOR ANALYTICS TYPES
// =====================================================================

export interface UserBehaviorAnalytics {
  id: string;
  user_id: string;
  date: string;
  session_count: number;
  total_session_duration: string; // ISO duration
  pages_viewed: number;
  ratings_given: number;
  restaurants_viewed: number;
  search_queries: number;
  feature_usage: Record<string, number>;
  engagement_score: number;
  predicted_next_activity?: string;
  prediction_confidence?: number;
}

export interface UserEngagementPattern {
  user_id: string;
  engagement_level: 'low' | 'medium' | 'high';
  primary_features: string[];
  usage_patterns: {
    peak_hours: number[];
    preferred_days: string[];
    session_length_preference: 'short' | 'medium' | 'long';
  };
  churn_risk: {
    score: number;
    factors: string[];
    recommended_actions: string[];
  };
}

// =====================================================================
// COMPETITIVE ANALYSIS TYPES
// =====================================================================

export interface RestaurantCompetitiveAnalysis {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  analysis_date: string;
  cuisine_category: string;
  geographic_region?: string;
  market_rank?: number;
  percentile_rating: number;
  percentile_review_volume: number;
  percentile_customer_engagement: number;
  avg_competitor_rating: number;
  avg_competitor_review_count: number;
  market_leader_rating: number;
  market_share_estimate: number;
  rating_vs_market: number;
  volume_vs_market: number;
  engagement_vs_market: number;
  improvement_areas: string[];
  competitive_advantages: string[];
  market_opportunities: string[];
}

export interface CompetitiveInsight {
  restaurant_id: string;
  insight_type: 'strength' | 'weakness' | 'opportunity' | 'threat';
  title: string;
  description: string;
  impact_level: 'low' | 'medium' | 'high';
  action_items: string[];
  confidence_score: number;
}

export interface MarketBenchmark {
  metric: string;
  your_value: number;
  market_average: number;
  market_leader: number;
  percentile_rank: number;
  recommendation: string;
  improvement_potential: number;
}

// =====================================================================
// PREDICTIVE ANALYTICS TYPES
// =====================================================================

export interface PredictiveInsight {
  id: string;
  entity_type: 'user' | 'restaurant' | 'platform';
  entity_id?: string;
  insight_type: 'cuisine_recommendation' | 'restaurant_recommendation' | 'menu_optimization' | 
                'user_churn_risk' | 'revenue_forecast' | 'trend_prediction';
  insight_category: 'recommendation' | 'risk_alert' | 'opportunity' | 'forecast' | 'trend';
  title: string;
  description: string;
  prediction_data: Record<string, any>;
  confidence_score: number;
  impact_score: number;
  valid_until?: string;
  action_taken: boolean;
  feedback_rating?: number;
  created_at: string;
}

export interface RecommendationEngine {
  user_recommendations: {
    restaurants: RestaurantRecommendation[];
    cuisines: CuisineRecommendation[];
    menu_items: MenuItemRecommendation[];
  };
  restaurant_recommendations: {
    menu_optimizations: MenuOptimization[];
    pricing_suggestions: PricingSuggestion[];
    marketing_opportunities: MarketingOpportunity[];
  };
  platform_recommendations: {
    feature_developments: FeatureDevelopment[];
    market_expansions: MarketExpansion[];
    partnership_opportunities: PartnershipOpportunity[];
  };
}

export interface RestaurantRecommendation {
  restaurant_id: string;
  restaurant_name: string;
  cuisine_type: string;
  confidence_score: number;
  reasoning: string[];
  expected_rating: number;
  distance?: number;
  price_range?: string;
}

export interface CuisineRecommendation {
  cuisine_type: string;
  confidence_score: number;
  reasoning: string[];
  top_restaurants: {
    restaurant_id: string;
    restaurant_name: string;
    predicted_rating: number;
  }[];
}

export interface MenuItemRecommendation {
  menu_item_id: string;
  menu_item_name: string;
  restaurant_id: string;
  restaurant_name: string;
  confidence_score: number;
  reasoning: string[];
  predicted_rating: number;
}

export interface MenuOptimization {
  suggestion_type: 'promote' | 'improve' | 'remove' | 'price_adjust';
  menu_item_id: string;
  menu_item_name: string;
  current_performance: number;
  potential_improvement: number;
  recommended_action: string;
  confidence_score: number;
}

export interface PricingSuggestion {
  menu_item_id: string;
  current_price: number;
  suggested_price: number;
  reasoning: string;
  expected_impact: {
    demand_change: number;
    revenue_change: number;
  };
  confidence_score: number;
}

export interface MarketingOpportunity {
  opportunity_type: 'social_media' | 'review_response' | 'special_offers' | 'events';
  title: string;
  description: string;
  potential_impact: number;
  effort_required: 'low' | 'medium' | 'high';
  confidence_score: number;
}

export interface FeatureDevelopment {
  feature_name: string;
  priority: 'low' | 'medium' | 'high';
  expected_impact: number;
  development_effort: number;
  user_demand_score: number;
}

export interface MarketExpansion {
  region: string;
  opportunity_score: number;
  user_demand: number;
  competition_level: number;
  recommended_strategy: string;
}

export interface PartnershipOpportunity {
  partner_type: string;
  opportunity_description: string;
  synergy_score: number;
  implementation_complexity: 'low' | 'medium' | 'high';
}

// =====================================================================
// CUSTOM REPORTS TYPES
// =====================================================================

export interface CustomReportDefinition {
  id: string;
  user_id: string;
  report_name: string;
  report_type: 'family_insights' | 'restaurant_performance' | 'competitive_analysis' | 
                'platform_statistics' | 'predictive_insights';
  filters: Record<string, any>;
  metrics: string[];
  visualization_config: VisualizationConfig;
  schedule_config?: ScheduleConfig;
  is_public: boolean;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomReportExecution {
  id: string;
  report_definition_id: string;
  executed_by?: string;
  execution_type: 'manual' | 'scheduled' | 'api';
  status: 'pending' | 'running' | 'completed' | 'failed';
  parameters: Record<string, any>;
  result_data: Record<string, any>;
  execution_duration?: string;
  error_message?: string;
  file_exports: Record<string, string>; // format -> URL mapping
  created_at: string;
  updated_at: string;
}

export interface VisualizationConfig {
  chart_type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'table';
  layout: {
    title: string;
    x_axis?: string;
    y_axis?: string;
    color_scheme?: string;
    show_legend?: boolean;
    show_grid?: boolean;
  };
  formatting: {
    number_format?: string;
    date_format?: string;
    currency_symbol?: string;
  };
}

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  day_of_week?: number; // 0-6, Sunday-Saturday
  day_of_month?: number; // 1-31
  time_of_day: string; // HH:MM format
  timezone: string;
  recipients: string[]; // email addresses
  format: 'pdf' | 'csv' | 'json';
  is_active: boolean;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  preview_image?: string;
  definition: Omit<CustomReportDefinition, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
  usage_count: number;
  rating: number;
}

// =====================================================================
// GEOGRAPHIC ANALYTICS TYPES
// =====================================================================

export interface GeographicAnalytics {
  id: string;
  date: string;
  region_code: string;
  region_name: string;
  region_type: 'country' | 'state' | 'city' | 'postal_code';
  user_count: number;
  restaurant_count: number;
  rating_count: number;
  average_rating: number;
  market_penetration: number;
  growth_rate: number;
  opportunity_score: number;
}

export interface GeographicInsight {
  region: string;
  insight_type: 'high_growth' | 'underserved' | 'saturated' | 'declining';
  opportunity_description: string;
  recommended_actions: string[];
  priority_score: number;
}

export interface MarketHeatmapData {
  region_code: string;
  region_name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  metrics: {
    user_density: number;
    restaurant_density: number;
    engagement_level: number;
    growth_potential: number;
  };
  color_intensity: number; // 0-1 for heatmap coloring
}

// =====================================================================
// TREND ANALYSIS TYPES
// =====================================================================

export interface TrendAnalysis {
  id: string;
  trend_type: 'cuisine_popularity' | 'rating_patterns' | 'user_behavior' | 
              'restaurant_performance' | 'seasonal_trends';
  entity_type: 'global' | 'region' | 'cuisine' | 'restaurant' | 'user';
  entity_id?: string;
  period_start: string;
  period_end: string;
  trend_data: Record<string, any>;
  trend_direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  trend_strength: number; // 0-1
  statistical_significance: number;
  created_at: string;
}

export interface TrendForecast {
  metric: string;
  current_value: number;
  predicted_values: {
    period: string;
    value: number;
    confidence_interval: {
      lower: number;
      upper: number;
    };
  }[];
  factors_influencing: string[];
  accuracy_estimate: number;
}

export interface SeasonalPattern {
  pattern_type: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  peak_periods: {
    period: string;
    intensity: number;
  }[];
  trough_periods: {
    period: string;
    intensity: number;
  }[];
  pattern_strength: number;
  reliability_score: number;
}

// =====================================================================
// AI MODEL PERFORMANCE TYPES
// =====================================================================

export interface AIModelPerformance {
  id: string;
  model_name: string;
  model_version: string;
  prediction_type: string;
  accuracy_score: number;
  precision_score: number;
  recall_score: number;
  f1_score: number;
  confidence_threshold: number;
  training_data_size: number;
  evaluation_date: string;
  production_status: 'testing' | 'staging' | 'production' | 'deprecated';
  performance_notes?: string;
}

export interface ModelComparisonReport {
  comparison_date: string;
  models: {
    model_name: string;
    version: string;
    performance_metrics: AIModelPerformance;
    benchmark_scores: Record<string, number>;
    recommendation: 'deploy' | 'improve' | 'retire';
  }[];
  best_performing_model: string;
  improvement_suggestions: string[];
}

// =====================================================================
// ADVANCED ANALYTICS DASHBOARD TYPES
// =====================================================================

export interface AdvancedAnalyticsDashboard {
  platform_overview: {
    statistics: PlatformUsageStatistics[];
    growth_metrics: PlatformGrowthMetrics;
    key_insights: PredictiveInsight[];
  };
  competitive_intelligence: {
    market_analysis: RestaurantCompetitiveAnalysis[];
    benchmarks: MarketBenchmark[];
    insights: CompetitiveInsight[];
  };
  predictive_insights: {
    recommendations: RecommendationEngine;
    forecasts: TrendForecast[];
    risk_alerts: PredictiveInsight[];
  };
  geographic_analytics: {
    regional_performance: GeographicAnalytics[];
    market_opportunities: GeographicInsight[];
    heatmap_data: MarketHeatmapData[];
  };
  custom_reports: {
    recent_executions: CustomReportExecution[];
    popular_templates: ReportTemplate[];
    user_reports: CustomReportDefinition[];
  };
}

// =====================================================================
// API RESPONSE TYPES
// =====================================================================

export interface AdvancedAnalyticsResponse<T = any> {
  success: boolean;
  data: T;
  metadata: {
    generated_at: string;
    data_freshness: string;
    confidence_level: number;
    processing_time_ms: number;
  };
  pagination?: {
    page: number;
    per_page: number;
    total_pages: number;
    total_count: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PlatformStatisticsResponse extends AdvancedAnalyticsResponse<PlatformUsageStatistics[]> {
  summary: {
    total_growth_rate: number;
    top_performing_metrics: string[];
    areas_for_improvement: string[];
  };
}

export interface CompetitiveAnalysisResponse extends AdvancedAnalyticsResponse<RestaurantCompetitiveAnalysis> {
  market_context: {
    total_competitors: number;
    market_size: number;
    growth_trend: string;
  };
  actionable_insights: CompetitiveInsight[];
}

export interface PredictiveInsightsResponse extends AdvancedAnalyticsResponse<PredictiveInsight[]> {
  insights_summary: {
    high_confidence_count: number;
    high_impact_count: number;
    action_required_count: number;
  };
  recommendation_categories: string[];
}

// =====================================================================
// FILTER AND SEARCH TYPES
// =====================================================================

export interface AdvancedAnalyticsFilters {
  date_range: {
    start: string;
    end: string;
  };
  entity_types?: ('user' | 'restaurant' | 'platform')[];
  entity_ids?: string[];
  insight_types?: string[];
  confidence_threshold?: number;
  impact_threshold?: number;
  geographic_regions?: string[];
  cuisine_types?: string[];
  only_actionable?: boolean;
}

export interface AnalyticsSearchParams {
  query?: string;
  filters: AdvancedAnalyticsFilters;
  sort_by?: 'date' | 'confidence' | 'impact' | 'relevance';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

// =====================================================================
// EXPORT AND SHARING TYPES
// =====================================================================

export interface AnalyticsExportRequest {
  report_type: 'platform_statistics' | 'competitive_analysis' | 'predictive_insights' | 'custom_report';
  format: 'csv' | 'pdf' | 'json' | 'excel';
  filters: AdvancedAnalyticsFilters;
  include_charts?: boolean;
  include_raw_data?: boolean;
  custom_filename?: string;
}

export interface AnalyticsExportResult {
  export_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  download_url?: string;
  file_size?: number;
  expires_at?: string;
  error_message?: string;
}

export interface AnalyticsShareRequest {
  data_type: 'insight' | 'report' | 'dashboard_view';
  data_id: string;
  share_with: string[]; // email addresses
  access_level: 'view' | 'comment' | 'edit';
  expires_in_days?: number;
  message?: string;
}

// =====================================================================
// UTILITY TYPES
// =====================================================================

export type AnalyticsTimeRange = '7d' | '30d' | '90d' | '1y' | 'all' | 'custom';

export type AnalyticsMetricType = 
  | 'count' 
  | 'average' 
  | 'sum' 
  | 'percentage' 
  | 'growth_rate' 
  | 'trend' 
  | 'distribution';

export type AnalyticsVisualizationType = 
  | 'line_chart' 
  | 'bar_chart' 
  | 'pie_chart' 
  | 'scatter_plot' 
  | 'heatmap' 
  | 'geographic_map' 
  | 'funnel_chart' 
  | 'gauge_chart' 
  | 'table';

export type AnalyticsEntityType = 'user' | 'family' | 'restaurant' | 'menu_item' | 'rating' | 'platform';

export type AnalyticsPermissionLevel = 'public' | 'authenticated' | 'family_admin' | 'restaurant_owner' | 'platform_admin';

// =====================================================================
// HOOK RETURN TYPES
// =====================================================================

export interface UseAdvancedAnalyticsReturn {
  // Platform statistics
  platformStatistics: PlatformUsageStatistics[] | null;
  platformGrowthMetrics: PlatformGrowthMetrics | null;
  
  // Competitive analysis
  competitiveAnalysis: RestaurantCompetitiveAnalysis[] | null;
  marketBenchmarks: MarketBenchmark[] | null;
  
  // Predictive insights
  predictiveInsights: PredictiveInsight[] | null;
  recommendations: RecommendationEngine | null;
  
  // Geographic analytics
  geographicAnalytics: GeographicAnalytics[] | null;
  marketHeatmap: MarketHeatmapData[] | null;
  
  // Custom reports
  customReports: CustomReportDefinition[] | null;
  reportTemplates: ReportTemplate[] | null;
  
  // State management
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  
  // Actions
  refreshAnalytics: () => Promise<void>;
  generateReport: (definition: Partial<CustomReportDefinition>) => Promise<CustomReportExecution>;
  exportData: (request: AnalyticsExportRequest) => Promise<AnalyticsExportResult>;
  shareInsight: (request: AnalyticsShareRequest) => Promise<boolean>;
  provideFeedback: (insightId: string, rating: number, comment?: string) => Promise<void>;
}

export interface UsePredictiveAnalyticsReturn {
  insights: PredictiveInsight[] | null;
  recommendations: RecommendationEngine | null;
  forecasts: TrendForecast[] | null;
  loading: boolean;
  error: string | null;
  
  generateInsights: (entityType: string, entityId?: string) => Promise<PredictiveInsight[]>;
  updateInsightFeedback: (insightId: string, rating: number) => Promise<void>;
  markInsightAsActioned: (insightId: string) => Promise<void>;
}

export interface UseCompetitiveAnalysisReturn {
  analysis: RestaurantCompetitiveAnalysis | null;
  benchmarks: MarketBenchmark[] | null;
  insights: CompetitiveInsight[] | null;
  loading: boolean;
  error: string | null;
  
  generateAnalysis: (restaurantId: string) => Promise<RestaurantCompetitiveAnalysis>;
  refreshAnalysis: () => Promise<void>;
  compareWithCompetitors: (restaurantIds: string[]) => Promise<MarketBenchmark[]>;
}

export interface UsePlatformStatisticsReturn {
  statistics: PlatformUsageStatistics[] | null;
  growthMetrics: PlatformGrowthMetrics | null;
  geographicInsights: GeographicAnalytics[] | null;
  loading: boolean;
  error: string | null;
  
  refreshStatistics: () => Promise<void>;
  getRegionalBreakdown: (regionType: string) => Promise<GeographicAnalytics[]>;
  generateGrowthForecast: (timeframe: string) => Promise<TrendForecast>;
}

export interface UseCustomReportsReturn {
  reports: CustomReportDefinition[] | null;
  executions: CustomReportExecution[] | null;
  templates: ReportTemplate[] | null;
  loading: boolean;
  error: string | null;
  
  createReport: (definition: Omit<CustomReportDefinition, 'id' | 'created_at' | 'updated_at'>) => Promise<CustomReportDefinition>;
  executeReport: (reportId: string, parameters?: Record<string, any>) => Promise<CustomReportExecution>;
  scheduleReport: (reportId: string, schedule: ScheduleConfig) => Promise<void>;
  deleteReport: (reportId: string) => Promise<void>;
  exportExecution: (executionId: string, format: string) => Promise<AnalyticsExportResult>;
}
