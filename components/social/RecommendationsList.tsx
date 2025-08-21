'use client';

import { FriendRecommendation } from '@/types/social';
import { useSocial } from '@/hooks/useSocial';
import { formatDistanceToNow } from 'date-fns';
import { 
  Heart, 
  MapPin, 
  Star, 
  Check, 
  Clock,
  MessageSquare,
  ChefHat,
  Calendar
} from 'lucide-react';

interface RecommendationsListProps {
  recommendations: FriendRecommendation[];
}

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  const { markRecommendationAsRead, acceptRecommendation, loading } = useSocial();

  const handleMarkAsRead = async (recommendationId: string) => {
    try {
      await markRecommendationAsRead(recommendationId);
    } catch (error) {
      console.error('Error marking recommendation as read:', error);
    }
  };

  const handleAcceptRecommendation = async (recommendationId: string) => {
    try {
      await acceptRecommendation(recommendationId);
    } catch (error) {
      console.error('Error accepting recommendation:', error);
    }
  };

  if (recommendations.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Heart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No recommendations yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Your connections will share restaurant recommendations with you here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {recommendations.map((recommendation) => (
        <RecommendationItem
          key={recommendation.id}
          recommendation={recommendation}
          onMarkAsRead={handleMarkAsRead}
          onAccept={handleAcceptRecommendation}
          loading={loading}
        />
      ))}
    </div>
  );
}

function RecommendationItem({ 
  recommendation, 
  onMarkAsRead, 
  onAccept, 
  loading 
}: { 
  recommendation: FriendRecommendation;
  onMarkAsRead: (id: string) => void;
  onAccept: (id: string) => void;
  loading: boolean;
}) {
  const getRecommendationTypeIcon = () => {
    switch (recommendation.recommendation_type) {
      case 'occasion_based':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'dietary_friendly':
        return <ChefHat className="h-4 w-4 text-green-500" />;
      case 'family_suitable':
        return <Heart className="h-4 w-4 text-purple-500" />;
      default:
        return <Star className="h-4 w-4 text-orange-500" />;
    }
  };

  const getRecommendationTypeLabel = () => {
    switch (recommendation.recommendation_type) {
      case 'occasion_based':
        return 'Perfect for the occasion';
      case 'dietary_friendly':
        return 'Dietary friendly';
      case 'family_suitable':
        return 'Family suitable';
      default:
        return 'General recommendation';
    }
  };

  return (
    <div className={`p-6 hover:bg-gray-50 ${!recommendation.is_read ? 'bg-blue-50' : ''}`}>
      <div className="flex space-x-4">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            {recommendation.recommender_profile?.avatar_url ? (
              <img
                src={recommendation.recommender_profile.avatar_url}
                alt={`${recommendation.recommender_profile.first_name} ${recommendation.recommender_profile.last_name}`}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-gray-600">
                {recommendation.recommender_profile?.first_name?.[0]}
                {recommendation.recommender_profile?.last_name?.[0]}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-900">
                {recommendation.recommender_profile?.first_name} {recommendation.recommender_profile?.last_name}
              </p>
              {!recommendation.is_read && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  New
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>
                {formatDistanceToNow(new Date(recommendation.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mt-1">
            recommended a restaurant for you
          </p>
          
          {/* Restaurant Card */}
          <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex">
              {recommendation.restaurant?.image_url && (
                <div className="flex-shrink-0">
                  <img
                    src={recommendation.restaurant.image_url}
                    alt={recommendation.restaurant.name}
                    className="h-20 w-20 object-cover"
                  />
                </div>
              )}
              <div className="flex-1 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    {recommendation.restaurant?.name}
                  </h4>
                  <div className="flex items-center space-x-1">
                    {getRecommendationTypeIcon()}
                    <span className="text-xs text-gray-500">
                      {getRecommendationTypeLabel()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 mt-1">
                  {recommendation.restaurant?.cuisine_type && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {recommendation.restaurant.cuisine_type}
                    </span>
                  )}
                  
                  {recommendation.restaurant?.address && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span>{recommendation.restaurant.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Recommendation Details */}
          {(recommendation.message || recommendation.occasion || recommendation.recommended_items) && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              {recommendation.message && (
                <div className="flex items-start space-x-2">
                  <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">"{recommendation.message}"</p>
                </div>
              )}
              
              {recommendation.occasion && (
                <div className="flex items-center space-x-2 mt-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Perfect for: <span className="font-medium">{recommendation.occasion}</span>
                  </p>
                </div>
              )}
              
              {recommendation.recommended_items && recommendation.recommended_items.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Recommended items:</p>
                  <div className="flex flex-wrap gap-1">
                    {recommendation.recommended_items.map((item, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-3">
              {!recommendation.is_accepted && (
                <button
                  onClick={() => onAccept(recommendation.id)}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Add to Wishlist
                </button>
              )}
              
              {!recommendation.is_read && (
                <button
                  onClick={() => onMarkAsRead(recommendation.id)}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Mark as Read
                </button>
              )}
            </div>
            
            {recommendation.is_accepted && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <Check className="h-3 w-3 mr-1" />
                Added to Wishlist
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
