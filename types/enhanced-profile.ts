export interface PreferenceTracking {
  id: string;
  user_id: string;
  family_member_id?: string;
  preference_type: 'cuisine' | 'dietary' | 'ambiance' | 'price_range' | 'occasion' | 'ingredient';
  preference_value: string;
  preference_strength: number; // 1-10 scale
  last_updated: string;
  confidence_score: number; // AI-generated confidence in preference
  source: 'manual' | 'learned' | 'inferred';
  created_at: string;
  updated_at: string;
}

export interface DiningPattern {
  id: string;
  user_id: string;
  pattern_type: 'frequency' | 'timing' | 'seasonal' | 'social' | 'spending';
  pattern_data: Record<string, any>;
  insights: string[];
  confidence_level: number;
  date_range_start: string;
  date_range_end: string;
  created_at: string;
  updated_at: string;
}

export interface UserWishlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  is_collaborative: boolean;
  created_at: string;
  updated_at: string;
  wishlist_items?: WishlistItem[];
}

export interface WishlistItem {
  id: string;
  wishlist_id: string;
  restaurant_id: string;
  added_by_user_id: string;
  priority_level: number;
  notes?: string;
  target_occasion?: string;
  estimated_visit_date?: string;
  votes: number;
  status: 'pending' | 'visited' | 'removed';
  created_at: string;
  updated_at: string;
  restaurant?: {
    id: string;
    name: string;
    cuisine_type: string;
    image_url?: string;
    address?: string;
    price_range?: string;
  };
  added_by?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'explorer' | 'reviewer' | 'social' | 'loyalty' | 'milestone';
  points_value: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  requirements: Record<string, any>;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  family_member_id?: string;
  earned_date: string;
  progress: number; // 0-100 percentage
  is_unlocked: boolean;
  is_displayed: boolean;
  created_at: string;
  achievement?: Achievement;
}

export interface UserStreak {
  id: string;
  user_id: string;
  streak_type: 'dining_out' | 'reviewing' | 'exploring' | 'social';
  current_streak: number;
  best_streak: number;
  last_activity_date: string;
  created_at: string;
  updated_at: string;
}

export interface PersonalizationSettings {
  id: string;
  user_id: string;
  auto_learn_preferences: boolean;
  recommendation_frequency: 'aggressive' | 'moderate' | 'conservative';
  exploration_vs_exploitation: number; // 0-100, 0 = only familiar, 100 = only new
  dietary_strictness: 'strict' | 'moderate' | 'flexible';
  social_discovery_enabled: boolean;
  location_based_suggestions: boolean;
  price_sensitivity: number; // 1-10 scale
  created_at: string;
  updated_at: string;
}

export interface DiningInsight {
  id: string;
  user_id: string;
  insight_type: 'preference_change' | 'new_favorite' | 'dining_pattern' | 'recommendation' | 'milestone';
  title: string;
  description: string;
  data: Record<string, any>;
  importance_score: number;
  is_read: boolean;
  expiry_date?: string;
  created_at: string;
}

export interface UserPreferenceHistory {
  id: string;
  user_id: string;
  family_member_id?: string;
  preference_type: string;
  old_value?: string;
  new_value: string;
  change_reason: 'manual_update' | 'learned_behavior' | 'rating_feedback' | 'explicit_feedback';
  confidence_change: number;
  created_at: string;
}

export interface FamilyDiningStats {
  total_restaurants_visited: number;
  total_reviews_written: number;
  favorite_cuisines: { cuisine: string; percentage: number }[];
  dining_frequency: {
    weekly_average: number;
    monthly_trend: 'increasing' | 'decreasing' | 'stable';
  };
  price_distribution: {
    budget: number;
    moderate: number;
    upscale: number;
    fine_dining: number;
  };
  top_family_preferences: {
    member_name: string;
    top_cuisines: string[];
    dietary_restrictions: string[];
  }[];
  seasonal_patterns: {
    season: string;
    popular_cuisines: string[];
    dining_frequency: number;
  }[];
}

export interface CreatePreferenceTracking {
  family_member_id?: string;
  preference_type: 'cuisine' | 'dietary' | 'ambiance' | 'price_range' | 'occasion' | 'ingredient';
  preference_value: string;
  preference_strength: number;
  source?: 'manual' | 'learned' | 'inferred';
}

export interface CreateWishlist {
  name: string;
  description?: string;
  is_public?: boolean;
  is_collaborative?: boolean;
}

export interface CreateWishlistItem {
  restaurant_id: string;
  priority_level?: number;
  notes?: string;
  target_occasion?: string;
  estimated_visit_date?: string;
}

export interface UpdatePersonalizationSettings {
  auto_learn_preferences?: boolean;
  recommendation_frequency?: 'aggressive' | 'moderate' | 'conservative';
  exploration_vs_exploitation?: number;
  dietary_strictness?: 'strict' | 'moderate' | 'flexible';
  social_discovery_enabled?: boolean;
  location_based_suggestions?: boolean;
  price_sensitivity?: number;
}

export interface PreferenceAnalytics {
  preference_stability: number; // how stable preferences are over time
  discovery_rate: number; // rate of trying new cuisines/restaurants
  social_influence: number; // how much social connections influence choices
  seasonal_variation: number; // how much preferences change by season
  recommendation_acceptance: number; // how often recommended places are tried
}

export interface RecommendationFeedback {
  id: string;
  user_id: string;
  restaurant_id: string;
  recommendation_type: 'cuisine_match' | 'social_recommendation' | 'pattern_based' | 'exploration';
  feedback_type: 'visited' | 'not_interested' | 'saved_for_later' | 'negative';
  feedback_details?: string;
  created_at: string;
}
