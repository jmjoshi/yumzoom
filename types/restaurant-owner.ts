// Restaurant Owner Response System Types
export interface RestaurantOwner {
  id: string;
  user_id: string;
  restaurant_id: string;
  business_name: string;
  business_email: string;
  business_phone?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_documents?: {
    document_type: string;
    document_url: string;
    uploaded_at: string;
  }[];
  verified_at?: string;
  verified_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewResponse {
  id: string;
  rating_id: string;
  restaurant_owner_id: string;
  response_text: string;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ResponseNotification {
  id: string;
  user_id: string;
  rating_id: string;
  response_id: string;
  notification_type: 'owner_response';
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface RatingWithResponse {
  id: string;
  user_id: string;
  menu_item_id: string;
  family_member_id?: string;
  rating: number;
  notes?: string;
  review_text?: string;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  updated_at: string;
  response_id?: string;
  response_text?: string;
  response_is_edited?: boolean;
  response_edited_at?: string;
  response_created_at?: string;
  restaurant_business_name?: string;
  verification_status?: string;
}

export interface OwnerVerificationRequest {
  restaurant_id: string;
  business_name: string;
  business_email: string;
  business_phone?: string;
  verification_documents?: File[];
}

export interface OwnerDashboardStats {
  restaurant_id: string;
  restaurant_name: string;
  total_reviews: number;
  average_rating: number;
  reviews_with_responses: number;
  pending_responses: number;
  recent_reviews: {
    id: string;
    rating: number;
    review_text?: string;
    created_at: string;
    user_name: string;
    has_response: boolean;
  }[];
}

export interface CreateResponseRequest {
  rating_id: string;
  response_text: string;
}

export interface UpdateResponseRequest {
  response_id: string;
  response_text: string;
}

// API Response types
export interface OwnerStatusResponse {
  restaurants: {
    restaurant_id: string;
    restaurant_name: string;
    business_name: string;
    verification_status: string;
    verified_at?: string;
  }[];
}

export interface NotificationsResponse {
  notifications: (ResponseNotification & {
    rating: {
      id: string;
      rating: number;
      review_text?: string;
      menu_item: {
        name: string;
        restaurant: {
          name: string;
        };
      };
    };
    response: {
      response_text: string;
      restaurant_owner: {
        business_name: string;
      };
    };
  })[];
  unread_count: number;
}
