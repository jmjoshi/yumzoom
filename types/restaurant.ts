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