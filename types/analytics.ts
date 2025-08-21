export type TimeRange = 'week' | 'month' | 'quarter' | 'year';

export interface FamilyInsights {
  total_restaurants: number;
  total_ratings: number;
  average_family_rating: number;
  estimated_spending: number;
  total_family_members: number;
  active_members: number;
  period_start: string;
  period_end: string;
}

export interface PopularRestaurant {
  restaurant_id: string;
  restaurant_name: string;
  restaurant_address?: string;
  cuisine_type?: string;
  visit_frequency: number;
  average_rating: number;
  last_visit: string;
  total_ratings: number;
}

export interface CuisinePreference {
  cuisine_type: string;
  rating_count: number;
  average_rating: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface MemberActivity {
  member_id: string;
  member_name: string;
  relationship?: string;
  rating_count: number;
  average_rating: number;
  most_recent_activity: string;
  favorite_restaurant?: string;
  favorite_cuisine?: string;
  engagement_trend: 'up' | 'down' | 'stable';
}

export interface DiningPattern {
  period: string; // Date or time period
  rating_count: number;
  average_rating: number;
  restaurant_count: number;
}

export interface RatingDistribution {
  rating: number;
  count: number;
  percentage: number;
}

export interface AnalyticsFilters {
  timeRange: TimeRange;
  memberIds?: string[];
  cuisineTypes?: string[];
  restaurantIds?: string[];
}

export interface AnalyticsExport {
  type: 'csv' | 'pdf' | 'json';
  data: any;
  filename: string;
}
