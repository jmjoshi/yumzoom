'use client';

import { ActivityFeedItem } from '@/types/social';
import { formatDistanceToNow } from 'date-fns';
import { 
  Star, 
  Heart, 
  MessageSquare, 
  MapPin, 
  Clock,
  Users,
  Trophy
} from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityFeedItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Connect with other families to see their dining activities here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
      
      {activities.length >= 20 && (
        <div className="p-6 text-center">
          <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
            Load more activities
          </button>
        </div>
      )}
    </div>
  );
}

function ActivityItem({ activity }: { activity: ActivityFeedItem }) {
  const getActivityIcon = () => {
    switch (activity.activity_type) {
      case 'restaurant_visit':
        return <MapPin className="h-4 w-4 text-blue-500" />;
      case 'review_posted':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'rating_given':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'restaurant_added_to_favorites':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'restaurant_added_to_wishlist':
        return <Heart className="h-4 w-4 text-purple-500" />;
      case 'family_member_added':
        return <Users className="h-4 w-4 text-indigo-500" />;
      case 'achievement_earned':
        return <Trophy className="h-4 w-4 text-orange-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityDetails = () => {
    switch (activity.activity_type) {
      case 'rating_given':
        return (
          <div className="flex items-center space-x-2 mt-1">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${
                    star <= (activity.rating || 0) / 2
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              {activity.rating}/10
            </span>
          </div>
        );
      case 'restaurant_visit':
      case 'restaurant_added_to_favorites':
      case 'restaurant_added_to_wishlist':
        return activity.restaurant_cuisine_type && (
          <div className="mt-1">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {activity.restaurant_cuisine_type}
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 hover:bg-gray-50">
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">
              {activity.user_first_name?.[0]}{activity.user_last_name?.[0]}
            </span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            {getActivityIcon()}
            <p className="text-sm text-gray-900">
              <span className="font-medium">
                {activity.user_first_name} {activity.user_last_name}
              </span>
              <span className="ml-1">{activity.activity_text}</span>
            </p>
          </div>
          
          {activity.restaurant_name && (
            <div className="mt-1">
              <p className="text-sm font-medium text-gray-900">
                {activity.restaurant_name}
              </p>
              {activity.menu_item_name && (
                <p className="text-xs text-gray-500">
                  {activity.menu_item_name}
                </p>
              )}
            </div>
          )}
          
          {getActivityDetails()}
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </span>
              </div>
              
              {activity.is_public && (
                <span className="text-green-600">Public</span>
              )}
            </div>
            
            {activity.can_like && (
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-600">
                  <Heart className="h-3 w-3" />
                  <span>Like</span>
                </button>
                {activity.can_comment && (
                  <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600">
                    <MessageSquare className="h-3 w-3" />
                    <span>Comment</span>
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Activity Data Details */}
          {activity.activity_data && Object.keys(activity.activity_data).length > 0 && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
              {activity.activity_data.notes && (
                <p>"{activity.activity_data.notes}"</p>
              )}
              {activity.activity_data.occasion && (
                <p>Occasion: {activity.activity_data.occasion}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
