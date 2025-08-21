// Social Features - Phase 1 Types
// TypeScript definitions for social networking features

export interface FamilyConnection {
  id: string;
  follower_user_id: string;
  following_user_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  connection_type: 'friend' | 'family_friend' | 'neighbor';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Populated by joins
  follower_profile?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  following_profile?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export interface CreateFamilyConnection {
  following_user_id: string;
  connection_type?: 'friend' | 'family_friend' | 'neighbor';
  notes?: string;
}

export interface UpdateFamilyConnection {
  status?: 'pending' | 'accepted' | 'blocked';
  connection_type?: 'friend' | 'family_friend' | 'neighbor';
  notes?: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: 'restaurant_visit' | 'review_posted' | 'rating_given' | 
                'restaurant_added_to_favorites' | 'restaurant_added_to_wishlist' | 
                'family_member_added' | 'achievement_earned';
  activity_data: Record<string, any>;
  restaurant_id?: string;
  menu_item_id?: string;
  family_member_id?: string;
  rating?: number;
  is_public: boolean;
  created_at: string;
  // Populated by joins
  user_first_name?: string;
  user_last_name?: string;
  restaurant_name?: string;
  restaurant_cuisine_type?: string;
  menu_item_name?: string;
  family_member_name?: string;
}

export interface CreateUserActivity {
  activity_type: UserActivity['activity_type'];
  activity_data?: Record<string, any>;
  restaurant_id?: string;
  menu_item_id?: string;
  family_member_id?: string;
  rating?: number;
  is_public?: boolean;
}

export interface FriendRecommendation {
  id: string;
  recommender_user_id: string;
  recipient_user_id: string;
  restaurant_id: string;
  recommendation_type: 'general' | 'occasion_based' | 'dietary_friendly' | 'family_suitable';
  message?: string;
  occasion?: string;
  recommended_items?: string[];
  is_read: boolean;
  is_accepted: boolean;
  created_at: string;
  updated_at: string;
  // Populated by joins
  recommender_profile?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  restaurant?: {
    id: string;
    name: string;
    cuisine_type: string;
    image_url?: string;
    address?: string;
  };
}

export interface CreateFriendRecommendation {
  recipient_user_id: string;
  restaurant_id: string;
  recommendation_type?: 'general' | 'occasion_based' | 'dietary_friendly' | 'family_suitable';
  message?: string;
  occasion?: string;
  recommended_items?: string[];
}

export interface UpdateFriendRecommendation {
  is_read?: boolean;
  is_accepted?: boolean;
}

export interface FamilyCollaborationSession {
  id: string;
  creator_user_id: string;
  title: string;
  description?: string;
  session_type: 'restaurant_voting' | 'menu_planning' | 'occasion_planning' | 'group_discovery';
  status: 'active' | 'completed' | 'cancelled';
  deadline?: string;
  voting_rules: {
    multiple_votes?: boolean;
    require_unanimous?: boolean;
    allow_comments?: boolean;
    max_options?: number;
  };
  created_at: string;
  updated_at: string;
  // Populated by joins
  creator_profile?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  participants_count?: number;
  options_count?: number;
  votes_count?: number;
}

export interface CreateFamilyCollaborationSession {
  title: string;
  description?: string;
  session_type?: 'restaurant_voting' | 'menu_planning' | 'occasion_planning' | 'group_discovery';
  deadline?: string;
  voting_rules?: FamilyCollaborationSession['voting_rules'];
}

export interface UpdateFamilyCollaborationSession {
  title?: string;
  description?: string;
  status?: 'active' | 'completed' | 'cancelled';
  deadline?: string;
  voting_rules?: FamilyCollaborationSession['voting_rules'];
}

export interface CollaborationParticipant {
  id: string;
  session_id: string;
  user_id?: string;
  family_member_id?: string;
  participant_type: 'voter' | 'observer' | 'decision_maker';
  has_voted: boolean;
  invited_at: string;
  responded_at?: string;
  // Populated by joins
  user_profile?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  family_member?: {
    name: string;
    relationship: string;
    avatar_url?: string;
  };
}

export interface CreateCollaborationParticipant {
  session_id: string;
  user_id?: string;
  family_member_id?: string;
  participant_type?: 'voter' | 'observer' | 'decision_maker';
}

export interface UpdateCollaborationParticipant {
  participant_type?: 'voter' | 'observer' | 'decision_maker';
  has_voted?: boolean;
  responded_at?: string;
}

export interface CollaborationOption {
  id: string;
  session_id: string;
  restaurant_id: string;
  suggested_by_user_id?: string;
  suggested_by_family_member_id?: string;
  suggestion_reason?: string;
  vote_count: number;
  created_at: string;
  // Populated by joins
  restaurant?: {
    id: string;
    name: string;
    cuisine_type: string;
    image_url?: string;
    address?: string;
    description?: string;
  };
  suggested_by_profile?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  suggested_by_family_member?: {
    name: string;
    relationship: string;
  };
  user_vote?: CollaborationVote;
}

export interface CreateCollaborationOption {
  session_id: string;
  restaurant_id: string;
  suggested_by_family_member_id?: string;
  suggestion_reason?: string;
}

export interface CollaborationVote {
  id: string;
  session_id: string;
  option_id: string;
  voter_user_id?: string;
  voter_family_member_id?: string;
  vote_weight: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  // Populated by joins
  voter_profile?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  voter_family_member?: {
    name: string;
    relationship: string;
  };
}

export interface CreateCollaborationVote {
  session_id: string;
  option_id: string;
  voter_family_member_id?: string;
  vote_weight?: number;
  comment?: string;
}

export interface UpdateCollaborationVote {
  vote_weight?: number;
  comment?: string;
}

export interface SocialDiscoverySettings {
  id: string;
  user_id: string;
  discoverable_by_email: boolean;
  discoverable_by_phone: boolean;
  allow_connection_suggestions: boolean;
  show_in_friend_activities: boolean;
  auto_accept_family_connections: boolean;
  share_dining_activities: boolean;
  share_favorites_with_friends: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateSocialDiscoverySettings {
  discoverable_by_email?: boolean;
  discoverable_by_phone?: boolean;
  allow_connection_suggestions?: boolean;
  show_in_friend_activities?: boolean;
  auto_accept_family_connections?: boolean;
  share_dining_activities?: boolean;
  share_favorites_with_friends?: boolean;
}

export interface FriendSuggestion {
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  mutual_connections_count: number;
  common_cuisines: string[];
}

export interface ActivityFeedItem extends UserActivity {
  activity_text: string;
  activity_icon: string;
  can_like: boolean;
  can_comment: boolean;
  likes_count?: number;
  comments_count?: number;
}

// Collaboration session with full details for dashboard view
export interface CollaborationSessionDetails extends FamilyCollaborationSession {
  participants: CollaborationParticipant[];
  options: CollaborationOption[];
  winning_option?: CollaborationOption;
  is_participant: boolean;
  can_vote: boolean;
  user_has_voted: boolean;
}

// Summary stats for social features
export interface SocialStats {
  connections_count: number;
  pending_requests_count: number;
  recommendations_received_count: number;
  unread_recommendations_count: number;
  active_collaborations_count: number;
  total_activities_count: number;
}

// Connection status helpers
export type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'connected' | 'blocked';

export interface ConnectionInfo {
  status: ConnectionStatus;
  connection?: FamilyConnection;
}

// Activity feed filters
export interface ActivityFeedFilters {
  activity_types?: UserActivity['activity_type'][];
  include_own_activities?: boolean;
  include_friend_activities?: boolean;
  date_from?: string;
  date_to?: string;
  restaurant_ids?: string[];
}

// Collaboration voting results
export interface VotingResults {
  total_votes: number;
  total_participants: number;
  participation_rate: number;
  winning_option: CollaborationOption & { percentage: number };
  all_options: (CollaborationOption & { percentage: number })[];
  is_tie: boolean;
  is_unanimous: boolean;
}
