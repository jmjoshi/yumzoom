import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import {
  FamilyConnection,
  CreateFamilyConnection,
  UpdateFamilyConnection,
  UserActivity,
  CreateUserActivity,
  FriendRecommendation,
  CreateFriendRecommendation,
  UpdateFriendRecommendation,
  FamilyCollaborationSession,
  CreateFamilyCollaborationSession,
  UpdateFamilyCollaborationSession,
  CollaborationOption,
  CreateCollaborationOption,
  CollaborationVote,
  CreateCollaborationVote,
  CollaborationParticipant,
  SocialDiscoverySettings,
  UpdateSocialDiscoverySettings,
  FriendSuggestion,
  ActivityFeedItem,
  SocialStats,
  ConnectionInfo,
  ConnectionStatus,
  CollaborationSessionDetails,
  ActivityFeedFilters,
  VotingResults
} from '@/types/social';

interface UseSocialReturn {
  // State
  loading: boolean;
  error: string | null;
  
  // Connections
  connections: FamilyConnection[];
  pendingRequests: FamilyConnection[];
  sentRequests: FamilyConnection[];
  friendSuggestions: FriendSuggestion[];
  
  // Activity Feed
  activityFeed: ActivityFeedItem[];
  
  // Recommendations
  receivedRecommendations: FriendRecommendation[];
  sentRecommendations: FriendRecommendation[];
  
  // Collaborations
  activeCollaborations: FamilyCollaborationSession[];
  collaborationDetails: CollaborationSessionDetails | null;
  
  // Settings
  socialSettings: SocialDiscoverySettings | null;
  
  // Stats
  socialStats: SocialStats | null;
  
  // Connection Management
  sendConnectionRequest: (data: CreateFamilyConnection) => Promise<FamilyConnection>;
  respondToConnectionRequest: (connectionId: string, accept: boolean) => Promise<void>;
  removeConnection: (connectionId: string) => Promise<void>;
  getConnectionStatus: (userId: string) => Promise<ConnectionInfo>;
  
  // Activity Management
  createActivity: (data: CreateUserActivity) => Promise<UserActivity>;
  fetchActivityFeed: (filters?: ActivityFeedFilters) => Promise<void>;
  
  // Recommendation Management
  sendRecommendation: (data: CreateFriendRecommendation) => Promise<FriendRecommendation>;
  markRecommendationAsRead: (recommendationId: string) => Promise<void>;
  acceptRecommendation: (recommendationId: string) => Promise<void>;
  
  // Collaboration Management
  createCollaborationSession: (data: CreateFamilyCollaborationSession) => Promise<FamilyCollaborationSession>;
  addCollaborationOption: (data: CreateCollaborationOption) => Promise<CollaborationOption>;
  castVote: (data: CreateCollaborationVote) => Promise<CollaborationVote>;
  getCollaborationDetails: (sessionId: string) => Promise<CollaborationSessionDetails>;
  getVotingResults: (sessionId: string) => Promise<VotingResults>;
  
  // Settings Management
  updateSocialSettings: (data: UpdateSocialDiscoverySettings) => Promise<SocialDiscoverySettings>;
  
  // Data Fetching
  fetchConnections: () => Promise<void>;
  fetchFriendSuggestions: () => Promise<void>;
  fetchRecommendations: () => Promise<void>;
  fetchCollaborations: () => Promise<void>;
  fetchSocialStats: () => Promise<void>;
  
  // Utility Functions
  refreshAll: () => Promise<void>;
}

export function useSocial(): UseSocialReturn {
  const { user } = useAuth();
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connections, setConnections] = useState<FamilyConnection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FamilyConnection[]>([]);
  const [sentRequests, setSentRequests] = useState<FamilyConnection[]>([]);
  const [friendSuggestions, setFriendSuggestions] = useState<FriendSuggestion[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [receivedRecommendations, setReceivedRecommendations] = useState<FriendRecommendation[]>([]);
  const [sentRecommendations, setSentRecommendations] = useState<FriendRecommendation[]>([]);
  const [activeCollaborations, setActiveCollaborations] = useState<FamilyCollaborationSession[]>([]);
  const [collaborationDetails, setCollaborationDetails] = useState<CollaborationSessionDetails | null>(null);
  const [socialSettings, setSocialSettings] = useState<SocialDiscoverySettings | null>(null);
  const [socialStats, setSocialStats] = useState<SocialStats | null>(null);

  // Connection Management
  const sendConnectionRequest = useCallback(async (data: CreateFamilyConnection): Promise<FamilyConnection> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setLoading(true);
      setError(null);

      const { data: connection, error } = await supabase
        .from('family_connections')
        .insert({
          follower_user_id: user.id,
          following_user_id: data.following_user_id,
          connection_type: data.connection_type || 'friend',
          notes: data.notes,
          status: 'pending'
        })
        .select('*')
        .single();

      if (error) throw error;

      // Fetch the following user's profile separately
      const { data: followingProfile } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', data.following_user_id)
        .single();

      const connectionWithProfile = {
        ...connection,
        following_profile: followingProfile
      };

      // Log activity
      await createActivity({
        activity_type: 'family_member_added',
        activity_data: { connection_type: data.connection_type },
        is_public: false
      });

      await fetchConnections();
      return connectionWithProfile;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const respondToConnectionRequest = useCallback(async (connectionId: string, accept: boolean): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('family_connections')
        .update({ 
          status: accept ? 'accepted' : 'blocked',
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId)
        .eq('following_user_id', user.id);

      if (error) throw error;

      await fetchConnections();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const removeConnection = useCallback(async (connectionId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('family_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      await fetchConnections();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getConnectionStatus = useCallback(async (userId: string): Promise<ConnectionInfo> => {
    if (!user) return { status: 'none' };
    
    try {
      const { data: connection, error } = await supabase
        .from('family_connections')
        .select('*')
        .or(`and(follower_user_id.eq.${user.id},following_user_id.eq.${userId}),and(follower_user_id.eq.${userId},following_user_id.eq.${user.id})`)
        .maybeSingle();

      if (error) throw error;

      if (!connection) {
        return { status: 'none' };
      }

      if (connection.status === 'accepted') {
        return { status: 'connected', connection };
      } else if (connection.status === 'blocked') {
        return { status: 'blocked', connection };
      } else if (connection.follower_user_id === user.id) {
        return { status: 'pending_sent', connection };
      } else {
        return { status: 'pending_received', connection };
      }
    } catch (err: any) {
      console.error('Error getting connection status:', err);
      return { status: 'none' };
    }
  }, [user]);

  // Activity Management
  const createActivity = useCallback(async (data: CreateUserActivity): Promise<UserActivity> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data: activity, error } = await supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          activity_type: data.activity_type,
          activity_data: data.activity_data || {},
          restaurant_id: data.restaurant_id,
          menu_item_id: data.menu_item_id,
          family_member_id: data.family_member_id,
          rating: data.rating,
          is_public: data.is_public !== false
        })
        .select()
        .single();

      if (error) throw error;

      return activity;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [user]);

  const fetchActivityFeed = useCallback(async (filters?: ActivityFeedFilters): Promise<void> => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      const { data: activities, error } = await supabase.rpc('get_user_activity_feed', {
        p_user_id: user.id,
        p_limit: 50,
        p_offset: 0
      });

      if (error) throw error;

      // Transform activities into feed items with rich formatting
      const feedItems: ActivityFeedItem[] = (activities || []).map((activity: any) => ({
        ...activity,
        activity_text: formatActivityText(activity),
        activity_icon: getActivityIcon(activity.activity_type),
        can_like: activity.user_id !== user.id,
        can_comment: true
      }));

      setActivityFeed(feedItems);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Recommendation Management
  const sendRecommendation = useCallback(async (data: CreateFriendRecommendation): Promise<FriendRecommendation> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setLoading(true);
      setError(null);

      const { data: recommendation, error } = await supabase
        .from('friend_recommendations')
        .insert({
          recommender_user_id: user.id,
          recipient_user_id: data.recipient_user_id,
          restaurant_id: data.restaurant_id,
          recommendation_type: data.recommendation_type || 'general',
          message: data.message,
          occasion: data.occasion,
          recommended_items: data.recommended_items
        })
        .select('*')
        .single();

      if (error) throw error;

      // Manually fetch the related data
      if (recommendation) {
        const [recommenderProfile, restaurant] = await Promise.all([
          supabase.from('user_profiles').select('first_name, last_name, avatar_url').eq('id', recommendation.recommender_user_id).single(),
          supabase.from('restaurants').select('id, name, cuisine_type, image_url, address').eq('id', recommendation.restaurant_id).single()
        ]);

        const enrichedRecommendation = {
          ...recommendation,
          recommender_profile: recommenderProfile.data,
          restaurant: restaurant.data
        };

        await fetchRecommendations();
        return enrichedRecommendation;
      }

      await fetchRecommendations();
      return recommendation;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markRecommendationAsRead = useCallback(async (recommendationId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('friend_recommendations')
        .update({ is_read: true })
        .eq('id', recommendationId);

      if (error) throw error;

      await fetchRecommendations();
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const acceptRecommendation = useCallback(async (recommendationId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('friend_recommendations')
        .update({ is_accepted: true, is_read: true })
        .eq('id', recommendationId);

      if (error) throw error;

      await fetchRecommendations();
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  // Collaboration Management
  const createCollaborationSession = useCallback(async (data: CreateFamilyCollaborationSession): Promise<FamilyCollaborationSession> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setLoading(true);
      setError(null);

      const { data: session, error } = await supabase
        .from('family_collaboration_sessions')
        .insert({
          creator_user_id: user.id,
          title: data.title,
          description: data.description,
          session_type: data.session_type || 'restaurant_voting',
          deadline: data.deadline,
          voting_rules: data.voting_rules || { multiple_votes: false, require_unanimous: false }
        })
        .select()
        .single();

      if (error) throw error;

      await fetchCollaborations();
      return session;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addCollaborationOption = useCallback(async (data: CreateCollaborationOption): Promise<CollaborationOption> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data: option, error } = await supabase
        .from('collaboration_options')
        .insert({
          session_id: data.session_id,
          restaurant_id: data.restaurant_id,
          suggested_by_user_id: user.id,
          suggested_by_family_member_id: data.suggested_by_family_member_id,
          suggestion_reason: data.suggestion_reason
        })
        .select(`
          *,
          restaurant:restaurants(id, name, cuisine_type, image_url, address, description)
        `)
        .single();

      if (error) throw error;

      return option;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [user]);

  const castVote = useCallback(async (data: CreateCollaborationVote): Promise<CollaborationVote> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data: vote, error } = await supabase
        .from('collaboration_votes')
        .upsert({
          session_id: data.session_id,
          option_id: data.option_id,
          voter_user_id: user.id,
          voter_family_member_id: data.voter_family_member_id,
          vote_weight: data.vote_weight || 1,
          comment: data.comment
        })
        .select()
        .single();

      if (error) throw error;

      return vote;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [user]);

  const getCollaborationDetails = useCallback(async (sessionId: string): Promise<CollaborationSessionDetails> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      // Fetch session details
      const { data: session, error: sessionError } = await supabase
        .from('family_collaboration_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Fetch creator profile separately
      let creatorProfile = null;
      if (session?.creator_user_id) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('first_name, last_name, avatar_url')
          .eq('id', session.creator_user_id)
          .single();
        
        if (!profileError) {
          creatorProfile = profile;
        }
      }

      // Fetch participants with manual joins
      const { data: participants, error: participantsError } = await supabase
        .from('collaboration_participants')
        .select('*')
        .eq('session_id', sessionId);

      if (participantsError) throw participantsError;

      // Manually fetch participant profiles
      const participantsWithProfiles = await Promise.all(
        (participants || []).map(async (participant: CollaborationParticipant) => {
          const [userProfile, familyMember] = await Promise.all([
            participant.user_id ? supabase.from('user_profiles').select('first_name, last_name, avatar_url').eq('id', participant.user_id).single() : Promise.resolve({ data: null }),
            participant.family_member_id ? supabase.from('family_members').select('name, relationship, avatar_url').eq('id', participant.family_member_id).single() : Promise.resolve({ data: null })
          ]);
          
          return {
            ...participant,
            user_profile: userProfile.data,
            family_member: familyMember.data
          };
        })
      );

      // Fetch options with manual joins
      const { data: options, error: optionsError } = await supabase
        .from('collaboration_options')
        .select('*')
        .eq('session_id', sessionId);

      if (optionsError) throw optionsError;

      // Manually fetch option details
      const optionsWithDetails = await Promise.all(
        (options || []).map(async (option: CollaborationOption) => {
          const [restaurant, suggestedByProfile, suggestedByFamilyMember] = await Promise.all([
            option.restaurant_id ? supabase.from('restaurants').select('id, name, cuisine_type, image_url, address, description').eq('id', option.restaurant_id).single() : Promise.resolve({ data: null }),
            option.suggested_by_user_id ? supabase.from('user_profiles').select('first_name, last_name, avatar_url').eq('id', option.suggested_by_user_id).single() : Promise.resolve({ data: null }),
            option.suggested_by_family_member_id ? supabase.from('family_members').select('name, relationship').eq('id', option.suggested_by_family_member_id).single() : Promise.resolve({ data: null })
          ]);
          
          return {
            ...option,
            restaurant: restaurant.data,
            suggested_by_profile: suggestedByProfile.data,
            suggested_by_family_member: suggestedByFamilyMember.data
          };
        })
      );

      // Fetch user's votes for each option
      const { data: userVotes, error: votesError } = await supabase
        .from('collaboration_votes')
        .select('*')
        .eq('session_id', sessionId)
        .eq('voter_user_id', user.id);

      if (votesError) throw votesError;

      // Enhance options with user votes
      const enhancedOptions = optionsWithDetails.map(option => ({
        ...option,
        user_vote: userVotes.find((vote: CollaborationVote) => vote.option_id === option.id)
      }));

      // Find winning option
      const winningOption = enhancedOptions.reduce((prev, current) => 
        (current.vote_count > prev.vote_count) ? current : prev
      );

      const details: CollaborationSessionDetails = {
        ...session,
        creator_profile: creatorProfile,
        participants: participantsWithProfiles || [],
        options: enhancedOptions,
        winning_option: winningOption,
        is_participant: participantsWithProfiles?.some(p => p.user_id === user.id) || session.creator_user_id === user.id,
        can_vote: session.status === 'active',
        user_has_voted: userVotes.length > 0
      };

      setCollaborationDetails(details);
      return details;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [user]);

  const getVotingResults = useCallback(async (sessionId: string): Promise<VotingResults> => {
    try {
      const { data: options, error } = await supabase
        .from('collaboration_options')
        .select(`
          *,
          restaurant:restaurants(name, cuisine_type)
        `)
        .eq('session_id', sessionId)
        .order('vote_count', { ascending: false });

      if (error) throw error;

      const totalVotes = options.reduce((sum: number, option: CollaborationOption) => sum + option.vote_count, 0);
      const { data: participants } = await supabase
        .from('collaboration_participants')
        .select('id')
        .eq('session_id', sessionId);

      const totalParticipants = participants?.length || 0;
      const participationRate = totalParticipants > 0 ? (totalVotes / totalParticipants) * 100 : 0;

      const enhancedOptions = options.map((option: CollaborationOption) => ({
        ...option,
        percentage: totalVotes > 0 ? (option.vote_count / totalVotes) * 100 : 0
      }));

      const winningOption = enhancedOptions[0];
      const isTie = enhancedOptions.length > 1 && enhancedOptions[0].vote_count === enhancedOptions[1].vote_count;
      const isUnanimous = enhancedOptions.length > 0 && enhancedOptions[0].vote_count === totalVotes && totalVotes > 0;

      return {
        total_votes: totalVotes,
        total_participants: totalParticipants,
        participation_rate: participationRate,
        winning_option: winningOption,
        all_options: enhancedOptions,
        is_tie: isTie,
        is_unanimous: isUnanimous
      };
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Settings Management
  const updateSocialSettings = useCallback(async (data: UpdateSocialDiscoverySettings): Promise<SocialDiscoverySettings> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setLoading(true);
      setError(null);

      const { data: settings, error } = await supabase
        .from('social_discovery_settings')
        .upsert({
          user_id: user.id,
          ...data
        })
        .select()
        .single();

      if (error) throw error;

      setSocialSettings(settings);
      return settings;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Data Fetching Functions
  const fetchConnections = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      // Fetch accepted connections with manual joins
      const { data: acceptedConnections, error: acceptedError } = await supabase
        .from('family_connections')
        .select('*')
        .or(`follower_user_id.eq.${user.id},following_user_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (acceptedError) throw acceptedError;

      // Manually fetch profiles for accepted connections
      const connectionsWithProfiles = await Promise.all(
        (acceptedConnections || []).map(async (connection: FamilyConnection) => {
          const [followerProfile, followingProfile] = await Promise.all([
            supabase.from('user_profiles').select('first_name, last_name, avatar_url').eq('id', connection.follower_user_id).single(),
            supabase.from('user_profiles').select('first_name, last_name, avatar_url').eq('id', connection.following_user_id).single()
          ]);
          
          return {
            ...connection,
            follower_profile: followerProfile.data || undefined,
            following_profile: followingProfile.data || undefined
          };
        })
      );

      // Fetch pending requests received with manual joins
      const { data: pendingReceived, error: pendingError } = await supabase
        .from('family_connections')
        .select('*')
        .eq('following_user_id', user.id)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // Manually fetch profiles for pending received
      const pendingReceivedWithProfiles = await Promise.all(
        (pendingReceived || []).map(async (connection: FamilyConnection) => {
          const [followerProfile, followingProfile] = await Promise.all([
            supabase.from('user_profiles').select('first_name, last_name, avatar_url').eq('id', connection.follower_user_id).single(),
            supabase.from('user_profiles').select('first_name, last_name, avatar_url').eq('id', connection.following_user_id).single()
          ]);
          
          return {
            ...connection,
            follower_profile: followerProfile.data || undefined,
            following_profile: followingProfile.data || undefined
          };
        })
      );

      // Fetch pending requests sent with manual joins
      const { data: pendingSent, error: sentError } = await supabase
        .from('family_connections')
        .select('*')
        .eq('follower_user_id', user.id)
        .eq('status', 'pending');

      if (sentError) throw sentError;

      // Manually fetch profiles for pending sent
      const pendingSentWithProfiles = await Promise.all(
        (pendingSent || []).map(async (connection: FamilyConnection) => {
          const [followerProfile, followingProfile] = await Promise.all([
            supabase.from('user_profiles').select('first_name, last_name, avatar_url').eq('id', connection.follower_user_id).single(),
            supabase.from('user_profiles').select('first_name, last_name, avatar_url').eq('id', connection.following_user_id).single()
          ]);
          
          return {
            ...connection,
            follower_profile: followerProfile.data || undefined,
            following_profile: followingProfile.data || undefined
          };
        })
      );

      setConnections(connectionsWithProfiles || []);
      setPendingRequests(pendingReceivedWithProfiles || []);
      setSentRequests(pendingSentWithProfiles || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchFriendSuggestions = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    try {
      const { data: suggestions, error } = await supabase.rpc('get_friend_suggestions', {
        p_user_id: user.id,
        p_limit: 10
      });

      if (error) throw error;

      setFriendSuggestions(suggestions || []);
    } catch (err: any) {
      setError(err.message);
    }
  }, [user]);

  const fetchRecommendations = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      // Fetch received recommendations with manual joins
      const { data: received, error: receivedError } = await supabase
        .from('friend_recommendations')
        .select('*')
        .eq('recipient_user_id', user.id)
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      // Manually fetch profiles and restaurant data for received recommendations
      const receivedWithProfiles = await Promise.all(
        (received || []).map(async (rec: FriendRecommendation) => {
          const [recommenderProfile, restaurant] = await Promise.all([
            supabase.from('user_profiles').select('first_name, last_name, avatar_url').eq('id', rec.recommender_user_id).single(),
            supabase.from('restaurants').select('id, name, cuisine_type, image_url, address').eq('id', rec.restaurant_id).single()
          ]);
          
          return {
            ...rec,
            recommender_profile: recommenderProfile.data || undefined,
            restaurant: restaurant.data || undefined
          };
        })
      );

      // Fetch sent recommendations with manual joins
      const { data: sent, error: sentError } = await supabase
        .from('friend_recommendations')
        .select('*')
        .eq('recommender_user_id', user.id)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      // Manually fetch restaurant data for sent recommendations
      const sentWithProfiles = await Promise.all(
        (sent || []).map(async (rec: FriendRecommendation) => {
          const restaurant = await supabase.from('restaurants').select('id, name, cuisine_type, image_url, address').eq('id', rec.restaurant_id).single();
          
          return {
            ...rec,
            restaurant: restaurant.data || undefined
          };
        })
      );

      setReceivedRecommendations(receivedWithProfiles || []);
      setSentRecommendations(sentWithProfiles || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchCollaborations = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      // Temporarily disable collaboration queries to avoid recursion
      console.log('Skipping collaboration fetch to avoid recursion');
      setActiveCollaborations([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchSocialStats = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    try {
      // Fetch all stats in parallel
      const [
        connectionsResult,
        pendingResult,
        recommendationsResult,
        unreadRecommendationsResult,
        collaborationsResult,
        activitiesResult
      ] = await Promise.all([
        supabase.from('family_connections').select('id', { count: 'exact' }).or(`follower_user_id.eq.${user.id},following_user_id.eq.${user.id}`).eq('status', 'accepted'),
        supabase.from('family_connections').select('id', { count: 'exact' }).eq('following_user_id', user.id).eq('status', 'pending'),
        supabase.from('friend_recommendations').select('id', { count: 'exact' }).eq('recipient_user_id', user.id),
        supabase.from('friend_recommendations').select('id', { count: 'exact' }).eq('recipient_user_id', user.id).eq('is_read', false),
        supabase.from('family_collaboration_sessions').select('id', { count: 'exact' }).eq('creator_user_id', user.id).eq('status', 'active'),
        supabase.from('user_activities').select('id', { count: 'exact' }).eq('user_id', user.id)
      ]);

      const stats: SocialStats = {
        connections_count: connectionsResult.count || 0,
        pending_requests_count: pendingResult.count || 0,
        recommendations_received_count: recommendationsResult.count || 0,
        unread_recommendations_count: unreadRecommendationsResult.count || 0,
        active_collaborations_count: collaborationsResult.count || 0,
        total_activities_count: activitiesResult.count || 0
      };

      setSocialStats(stats);
    } catch (err: any) {
      setError(err.message);
    }
  }, [user]);

  // Utility Functions
  const refreshAll = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    await Promise.all([
      fetchConnections(),
      fetchFriendSuggestions(),
      fetchActivityFeed(),
      fetchRecommendations(),
      fetchCollaborations(),
      fetchSocialStats()
    ]);
  }, [user, fetchConnections, fetchFriendSuggestions, fetchActivityFeed, fetchRecommendations, fetchCollaborations, fetchSocialStats]);

  // Load social settings on mount
  useEffect(() => {
    if (!user) return;
    
    const loadSocialSettings = async () => {
      try {
        const { data: settings, error } = await supabase
          .from('social_discovery_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setSocialSettings(settings);
      } catch (err: any) {
        console.error('Error loading social settings:', err);
      }
    };

    loadSocialSettings();
    refreshAll();
  }, [user, refreshAll]);

  return {
    // State
    loading,
    error,
    
    // Data
    connections,
    pendingRequests,
    sentRequests,
    friendSuggestions,
    activityFeed,
    receivedRecommendations,
    sentRecommendations,
    activeCollaborations,
    collaborationDetails,
    socialSettings,
    socialStats,
    
    // Connection Management
    sendConnectionRequest,
    respondToConnectionRequest,
    removeConnection,
    getConnectionStatus,
    
    // Activity Management
    createActivity,
    fetchActivityFeed,
    
    // Recommendation Management
    sendRecommendation,
    markRecommendationAsRead,
    acceptRecommendation,
    
    // Collaboration Management
    createCollaborationSession,
    addCollaborationOption,
    castVote,
    getCollaborationDetails,
    getVotingResults,
    
    // Settings Management
    updateSocialSettings,
    
    // Data Fetching
    fetchConnections,
    fetchFriendSuggestions,
    fetchRecommendations,
    fetchCollaborations,
    fetchSocialStats,
    
    // Utility Functions
    refreshAll
  };
}

// Helper function to format activity text
function formatActivityText(activity: any): string {
  const userName = `${activity.user_first_name} ${activity.user_last_name}`;
  
  switch (activity.activity_type) {
    case 'restaurant_visit':
      return `${userName} visited ${activity.restaurant_name}`;
    case 'review_posted':
      return `${userName} posted a review for ${activity.restaurant_name}`;
    case 'rating_given':
      return `${userName} rated ${activity.menu_item_name || activity.restaurant_name} ${activity.rating}/10`;
    case 'restaurant_added_to_favorites':
      return `${userName} added ${activity.restaurant_name} to favorites`;
    case 'restaurant_added_to_wishlist':
      return `${userName} added ${activity.restaurant_name} to wishlist`;
    case 'family_member_added':
      return `${userName} added a family member`;
    case 'achievement_earned':
      return `${userName} earned an achievement`;
    default:
      return `${userName} had activity`;
  }
}

// Helper function to get activity icon
function getActivityIcon(activityType: string): string {
  switch (activityType) {
    case 'restaurant_visit':
      return '🏪';
    case 'review_posted':
      return '📝';
    case 'rating_given':
      return '⭐';
    case 'restaurant_added_to_favorites':
      return '❤️';
    case 'restaurant_added_to_wishlist':
      return '📋';
    case 'family_member_added':
      return '👨‍👩‍👧‍👦';
    case 'achievement_earned':
      return '🏆';
    default:
      return '📱';
  }
}
