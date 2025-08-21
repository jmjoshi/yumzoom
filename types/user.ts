export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_mobile?: string;
  phone_home?: string;
  phone_work?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone_mobile?: string;
  phone_home?: string;
  phone_work?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface EnhancedFamilyMember {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  age_range?: 'child' | 'teen' | 'adult';
  dietary_restrictions?: string[];
  favorite_cuisines?: string[];
  notes?: string;
  avatar_url?: string;
  date_of_birth?: string;
  allergies?: string[];
  food_preferences?: Record<string, any>;
  privacy_level?: 'public' | 'family' | 'private';
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserProfile {
  first_name: string;
  last_name: string;
  phone_mobile?: string;
  phone_home?: string;
  phone_work?: string;
}

export interface CreateFamilyMember {
  name: string;
  relationship: string;
  age_range?: 'child' | 'teen' | 'adult';
  dietary_restrictions?: string[];
  favorite_cuisines?: string[];
  notes?: string;
  date_of_birth?: string;
  allergies?: string[];
  privacy_level?: 'public' | 'family' | 'private';
}

export interface UpdateFamilyMember {
  name?: string;
  relationship?: string;
  age_range?: 'child' | 'teen' | 'adult';
  dietary_restrictions?: string[];
  favorite_cuisines?: string[];
  notes?: string;
  avatar_url?: string;
  date_of_birth?: string;
  allergies?: string[];
  food_preferences?: Record<string, any>;
  privacy_level?: 'public' | 'family' | 'private';
}

export interface UserFavoriteRestaurant {
  id: string;
  user_id: string;
  family_member_id?: string;
  restaurant_id: string;
  notes?: string;
  tags?: string[];
  is_wishlist: boolean;
  priority_level: number;
  occasion_suitable?: string[];
  created_at: string;
  updated_at: string;
  restaurant?: {
    id: string;
    name: string;
    cuisine_type: string;
    image_url?: string;
    address?: string;
  };
  family_member?: {
    id: string;
    name: string;
    relationship: string;
  };
}

export interface UserFavoriteMenuItem {
  id: string;
  user_id: string;
  family_member_id?: string;
  menu_item_id: string;
  personal_notes?: string;
  last_ordered_date?: string;
  created_at: string;
  updated_at: string;
  menu_item?: {
    id: string;
    name: string;
    description?: string;
    price?: number;
    category?: string;
    restaurant_id: string;
    restaurant?: {
      name: string;
    };
  };
}

export interface UserPrivacySettings {
  id: string;
  user_id: string;
  profile_visibility: 'public' | 'friends' | 'family' | 'private';
  dining_history_visibility: 'public' | 'friends' | 'family' | 'private';
  reviews_visibility: 'public' | 'friends' | 'family' | 'private';
  favorites_visibility: 'public' | 'friends' | 'family' | 'private';
  allow_friend_requests: boolean;
  show_activity_status: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  family_member_public_visibility: boolean;
  created_at: string;
  updated_at: string;
}

export interface DietaryRestriction {
  id: string;
  name: string;
  description?: string;
  severity_level: 'preference' | 'intolerance' | 'allergy' | 'medical';
  created_at: string;
}

export interface UserDiningOccasion {
  id: string;
  user_id: string;
  occasion_name: string;
  preferred_cuisines?: string[];
  preferred_price_range?: string;
  preferred_ambiance?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserFavoriteRestaurant {
  restaurant_id: string;
  family_member_id?: string;
  notes?: string;
  tags?: string[];
  is_wishlist?: boolean;
  priority_level?: number;
  occasion_suitable?: string[];
}

export interface CreateUserFavoriteMenuItem {
  menu_item_id: string;
  family_member_id?: string;
  personal_notes?: string;
  last_ordered_date?: string;
}

export interface UpdateUserPrivacySettings {
  profile_visibility?: 'public' | 'friends' | 'family' | 'private';
  dining_history_visibility?: 'public' | 'friends' | 'family' | 'private';
  reviews_visibility?: 'public' | 'friends' | 'family' | 'private';
  favorites_visibility?: 'public' | 'friends' | 'family' | 'private';
  allow_friend_requests?: boolean;
  show_activity_status?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
  family_member_public_visibility?: boolean;
}