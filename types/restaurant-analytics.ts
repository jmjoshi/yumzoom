// Restaurant Analytics Types
export interface RestaurantAnalyticsSummary {
  id: string;
  restaurant_id: string;
  period_type: 'daily' | 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  total_ratings: number;
  average_rating: number;
  total_reviews: number;
  total_responses: number;
  response_rate: number;
  unique_customers: number;
  new_customers: number;
  returning_customers: number;
  created_at: string;
  updated_at: string;
}

export interface MenuItemAnalytics {
  id: string;
  menu_item_id: string;
  restaurant_id: string;
  period_type: 'daily' | 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  total_ratings: number;
  average_rating: number;
  rating_trend: 'improving' | 'declining' | 'stable';
  total_reviews: number;
  popularity_rank?: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerFeedbackSummary {
  id: string;
  restaurant_id: string;
  period_type: 'daily' | 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  sentiment_score?: number;
  common_keywords?: string[];
  positive_mentions: number;
  negative_mentions: number;
  neutral_mentions: number;
  top_praised_aspects?: string[];
  improvement_areas?: string[];
  created_at: string;
  updated_at: string;
}

export interface RestaurantPerformanceDashboard {
  restaurant_id: string;
  restaurant_name: string;
  current_period: {
    total_ratings: number;
    average_rating: number;
    unique_customers: number;
    total_reviews: number;
    total_responses: number;
    response_rate: number;
  };
  previous_period: {
    total_ratings: number;
    average_rating: number;
    unique_customers: number;
    total_reviews: number;
    total_responses: number;
  };
  period_comparison: {
    ratings_change: number;
    rating_change: number;
    customers_change: number;
  };
  top_menu_items: MenuItemPerformance[];
  recent_reviews: RecentReview[];
  rating_distribution: {
    [key: string]: number; // '1_star', '2_star', etc.
  };
  customer_insights: {
    customer_retention: number;
    avg_rating_trend: 'improving' | 'declining' | 'stable';
  };
}

export interface MenuItemPerformance {
  menu_item_id: string;
  menu_item_name: string;
  category?: string;
  price?: number;
  total_ratings: number;
  average_rating: number;
  rating_trend: 'improving' | 'declining' | 'stable';
  performance_score: number;
  recommendations: string[];
}

export interface RecentReview {
  id: string;
  rating: number;
  review_text?: string;
  customer_name: string;
  created_at: string;
  menu_item: string;
  has_response: boolean;
}

export interface CustomerFeedbackInsights {
  feedback_summary: {
    total_reviews: number;
    average_rating: number;
    review_volume_trend: 'high' | 'moderate' | 'low';
  };
  sentiment_breakdown: {
    positive: number;
    neutral: number;
    negative: number;
    positive_percentage: number;
    negative_percentage: number;
  };
  common_themes: {
    service_mentions: number;
    food_quality_mentions: number;
    ambiance_mentions: number;
    value_mentions: number;
  };
  actionable_insights: string[];
}

export interface RestaurantAnalyticsTimeRange {
  value: 'week' | 'month' | 'quarter';
  label: string;
  days: number;
}

export interface AnalyticsExportData {
  restaurant_name: string;
  time_period: string;
  performance_dashboard: RestaurantPerformanceDashboard;
  menu_performance: MenuItemPerformance[];
  feedback_insights: CustomerFeedbackInsights;
  export_date: string;
}

// API Response Types
export interface RestaurantAnalyticsResponse {
  success: boolean;
  data: RestaurantPerformanceDashboard[];
  error?: string;
}

export interface MenuItemAnalyticsResponse {
  success: boolean;
  data: MenuItemPerformance[];
  error?: string;
}

export interface CustomerFeedbackResponse {
  success: boolean;
  data: CustomerFeedbackInsights;
  error?: string;
}

// Hook return types
export interface UseRestaurantAnalyticsReturn {
  performanceData: RestaurantPerformanceDashboard[];
  menuAnalytics: MenuItemPerformance[];
  feedbackInsights: CustomerFeedbackInsights | null;
  selectedRestaurant: string | null;
  timeRange: RestaurantAnalyticsTimeRange['value'];
  loading: boolean;
  error: string | null;
  setSelectedRestaurant: (restaurantId: string | null) => void;
  setTimeRange: (range: RestaurantAnalyticsTimeRange['value']) => void;
  refreshAnalytics: () => void;
  exportAnalytics: (format: 'csv' | 'pdf' | 'json') => void;
}

// Dashboard widget types
export interface PerformanceMetricCard {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  format?: 'number' | 'percentage' | 'currency' | 'rating';
  icon?: React.ComponentType;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  trend?: 'up' | 'down' | 'stable';
}

export interface RatingDistributionData {
  rating: number;
  count: number;
  percentage: number;
}

// Filter and sort options
export interface AnalyticsFilters {
  timeRange: RestaurantAnalyticsTimeRange['value'];
  restaurantId?: string;
  menuCategory?: string;
  ratingThreshold?: number;
  sortBy?: 'rating' | 'volume' | 'trend' | 'alphabetical';
  sortOrder?: 'asc' | 'desc';
}

export interface AnalyticsPreferences {
  defaultTimeRange: RestaurantAnalyticsTimeRange['value'];
  autoRefresh: boolean;
  refreshInterval: number; // minutes
  emailReports: boolean;
  reportFrequency: 'weekly' | 'monthly';
  dashboardLayout: 'grid' | 'list';
}

// Comparison and benchmark types
export interface CompetitorBenchmark {
  metric: string;
  your_value: number;
  industry_average: number;
  percentile_rank: number;
  recommendation?: string;
}

export interface TrendAnalysis {
  metric: string;
  current_value: number;
  previous_value: number;
  change_percentage: number;
  trend_direction: 'improving' | 'declining' | 'stable';
  significance: 'high' | 'medium' | 'low';
}

// Notification types for analytics
export interface AnalyticsAlert {
  id: string;
  restaurant_id: string;
  alert_type: 'rating_drop' | 'review_surge' | 'response_needed' | 'performance_milestone';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  action_required: boolean;
  created_at: string;
  acknowledged: boolean;
}

export interface AnalyticsGoal {
  id: string;
  restaurant_id: string;
  goal_type: 'average_rating' | 'review_count' | 'response_rate' | 'customer_retention';
  target_value: number;
  current_value: number;
  target_date: string;
  status: 'on_track' | 'behind' | 'achieved';
  created_at: string;
}

export const ANALYTICS_TIME_RANGES: RestaurantAnalyticsTimeRange[] = [
  { value: 'week', label: 'Last 7 Days', days: 7 },
  { value: 'month', label: 'Last 30 Days', days: 30 },
  { value: 'quarter', label: 'Last 90 Days', days: 90 },
];

export const PERFORMANCE_THRESHOLDS = {
  EXCELLENT_RATING: 8.5,
  GOOD_RATING: 7.0,
  POOR_RATING: 5.0,
  HIGH_RESPONSE_RATE: 80,
  GOOD_RESPONSE_RATE: 60,
  MIN_REVIEWS_FOR_TREND: 5,
} as const;

export const CHART_COLORS = {
  PRIMARY: '#f97316', // orange-500
  SECONDARY: '#3b82f6', // blue-500
  SUCCESS: '#10b981', // emerald-500
  WARNING: '#f59e0b', // amber-500
  DANGER: '#ef4444', // red-500
  INFO: '#6366f1', // indigo-500
  NEUTRAL: '#6b7280', // gray-500
} as const;

export type AnalyticsChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter';

export interface ChartConfiguration {
  type: AnalyticsChartType;
  data: ChartDataPoint[];
  options?: {
    title?: string;
    showLegend?: boolean;
    showTooltip?: boolean;
    colors?: string[];
    height?: number;
    responsive?: boolean;
  };
}
