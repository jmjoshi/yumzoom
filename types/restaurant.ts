export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  cuisine_type?: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  review_count?: number;
  price_range?: number;
  hours?: string;
  created_at: string;
  updated_at: string;
}

export interface RestaurantCharacteristics {
  id: string;
  restaurant_id: string;
  ambience_rating: number;
  decor_rating: number;
  service_rating: number;
  cleanliness_rating: number;
  noise_level_rating: number;
  value_for_money_rating: number;
  food_quality_rating: number;
  overall_rating: number;
  total_ratings_count: number;
  created_at: string;
  updated_at: string;
}

export interface RestaurantWithCharacteristics extends Restaurant {
  characteristics?: RestaurantCharacteristics;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  image_url?: string;
  average_rating?: number;
  created_at: string;
  updated_at: string;
}

export interface MenuItemWithRatings extends MenuItem {
  ratings: Rating[];
  user_ratings?: UserRating[];
}

export interface Rating {
  id: string;
  user_id: string;
  menu_item_id: string;
  rating: number;
  family_member_id?: string;
  notes?: string;
  review_text?: string;
  is_edited?: boolean;
  edited_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewPhoto {
  id: string;
  rating_id: string;
  photo_url: string;
  photo_filename: string;
  photo_size?: number;
  upload_order: number;
  created_at: string;
}

export interface ReviewVote {
  id: string;
  rating_id: string;
  user_id: string;
  is_helpful: boolean;
  created_at: string;
  updated_at: string;
}

export interface RatingWithVotes extends Rating {
  helpful_count: number;
  not_helpful_count: number;
  net_helpfulness: number;
  photos?: ReviewPhoto[];
  user_vote?: ReviewVote;
}

export interface UserRating extends RatingWithVotes {
  family_member?: {
    id: string;
    name: string;
    relationship: string;
  };
}

export interface CreateRating {
  menu_item_id: string;
  rating: number;
  family_member_id?: string;
  notes?: string;
  review_text?: string;
  photos?: File[];
}

export interface UpdateRating {
  rating: number;
  notes?: string;
  review_text?: string;
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  reviews_with_photos: number;
  reviews_with_text: number;
  rating_distribution: Record<string, number>;
}

export interface CreateReviewVote {
  rating_id: string;
  is_helpful: boolean;
}

export interface UserRestaurantRating {
  id: string;
  user_id: string;
  restaurant_id: string;
  ambience_rating: number;
  decor_rating: number;
  service_rating: number;
  cleanliness_rating: number;
  noise_level_rating: number;
  value_for_money_rating: number;
  food_quality_rating: number;
  overall_rating: number;
  review_text?: string;
  visit_date?: string;
  would_recommend?: boolean;
  created_at: string;
  updated_at: string;
}

export interface RestaurantRatingPhoto {
  id: string;
  user_restaurant_rating_id: string;
  photo_url: string;
  photo_filename: string;
  photo_size?: number;
  photo_type?: 'food' | 'ambience' | 'exterior' | 'interior' | 'menu';
  upload_order: number;
  created_at: string;
}

export interface RestaurantRatingVote {
  id: string;
  user_restaurant_rating_id: string;
  user_id: string;
  is_helpful: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRestaurantRatingWithDetails extends UserRestaurantRating {
  photos?: RestaurantRatingPhoto[];
  helpful_count: number;
  not_helpful_count: number;
  net_helpfulness: number;
  user_vote?: RestaurantRatingVote;
  user_profile?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export interface CreateRestaurantRating {
  restaurant_id: string;
  ambience_rating: number;
  decor_rating: number;
  service_rating: number;
  cleanliness_rating: number;
  noise_level_rating: number;
  value_for_money_rating: number;
  food_quality_rating: number;
  overall_rating: number;
  review_text?: string;
  visit_date?: string;
  would_recommend?: boolean;
  photos?: File[];
}

export interface UpdateRestaurantRating {
  ambience_rating: number;
  decor_rating: number;
  service_rating: number;
  cleanliness_rating: number;
  noise_level_rating: number;
  value_for_money_rating: number;
  food_quality_rating: number;
  overall_rating: number;
  review_text?: string;
  visit_date?: string;
  would_recommend?: boolean;
}

export interface RestaurantCharacteristicsBreakdown {
  ambience_rating: number;
  decor_rating: number;
  service_rating: number;
  cleanliness_rating: number;
  noise_level_rating: number;
  value_for_money_rating: number;
  food_quality_rating: number;
  overall_rating: number;
  total_ratings_count: number;
  rating_distribution: {
    ambience: Record<string, number>;
    decor: Record<string, number>;
    service: Record<string, number>;
    cleanliness: Record<string, number>;
    noise_level: Record<string, number>;
    value_for_money: Record<string, number>;
    food_quality: Record<string, number>;
    overall: Record<string, number>;
  };
}