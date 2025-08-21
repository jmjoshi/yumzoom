'use client';

import { useState, useEffect } from 'react';
import { useSocial } from '@/hooks/useSocial';
import { FriendSuggestion } from '@/types/social';
import { 
  UserPlus, 
  Users, 
  ChefHat,
  X,
  Loader2
} from 'lucide-react';

export function FriendSuggestions() {
  const { friendSuggestions, sendConnectionRequest, fetchFriendSuggestions, loading } = useSocial();
  const [localLoading, setLocalLoading] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFriendSuggestions();
  }, [fetchFriendSuggestions]);

  const handleSendRequest = async (userId: string) => {
    try {
      setLocalLoading(true);
      await sendConnectionRequest({
        following_user_id: userId,
        connection_type: 'friend'
      });
      // Remove from suggestions after sending request
      setDismissedSuggestions(prev => new Set([...prev, userId]));
    } catch (error) {
      console.error('Error sending connection request:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleDismiss = (userId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, userId]));
  };

  const visibleSuggestions = friendSuggestions.filter(
    suggestion => !dismissedSuggestions.has(suggestion.user_id)
  );

  if (loading && visibleSuggestions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Friend Suggestions</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (visibleSuggestions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Friend Suggestions</h3>
        <div className="text-center py-6">
          <Users className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            No friend suggestions available right now.
          </p>
          <button
            onClick={fetchFriendSuggestions}
            className="mt-2 text-sm text-orange-600 hover:text-orange-700"
          >
            Refresh suggestions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Friend Suggestions</h3>
          <button
            onClick={fetchFriendSuggestions}
            disabled={loading}
            className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Refresh'
            )}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Connect with families who share similar tastes
        </p>
      </div>
      
      <div className="p-6 space-y-4">
        {visibleSuggestions.slice(0, 5).map((suggestion) => (
          <FriendSuggestionItem
            key={suggestion.user_id}
            suggestion={suggestion}
            onSendRequest={handleSendRequest}
            onDismiss={handleDismiss}
            loading={localLoading}
          />
        ))}
        
        {visibleSuggestions.length > 5 && (
          <div className="text-center pt-4">
            <button className="text-sm text-orange-600 hover:text-orange-700">
              View all suggestions ({visibleSuggestions.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FriendSuggestionItem({ 
  suggestion, 
  onSendRequest, 
  onDismiss, 
  loading 
}: { 
  suggestion: FriendSuggestion;
  onSendRequest: (userId: string) => void;
  onDismiss: (userId: string) => void;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            {suggestion.avatar_url ? (
              <img
                src={suggestion.avatar_url}
                alt={`${suggestion.first_name} ${suggestion.last_name}`}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-gray-600">
                {suggestion.first_name[0]}{suggestion.last_name[0]}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {suggestion.first_name} {suggestion.last_name}
          </h4>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            {suggestion.mutual_connections_count > 0 && (
              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>
                  {suggestion.mutual_connections_count} mutual connection{suggestion.mutual_connections_count !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            
            {suggestion.common_cuisines.length > 0 && (
              <div className="flex items-center space-x-1">
                <ChefHat className="h-3 w-3" />
                <span>
                  Likes {suggestion.common_cuisines.slice(0, 2).join(', ')}
                  {suggestion.common_cuisines.length > 2 && ` +${suggestion.common_cuisines.length - 2} more`}
                </span>
              </div>
            )}
          </div>
          
          {/* Common Cuisines Tags */}
          {suggestion.common_cuisines.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {suggestion.common_cuisines.slice(0, 3).map((cuisine) => (
                <span
                  key={cuisine}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                >
                  {cuisine}
                </span>
              ))}
              {suggestion.common_cuisines.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  +{suggestion.common_cuisines.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onSendRequest(suggestion.user_id)}
          disabled={loading}
          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
        >
          <UserPlus className="h-3 w-3 mr-1" />
          Connect
        </button>
        <button
          onClick={() => onDismiss(suggestion.user_id)}
          className="p-1 text-gray-400 hover:text-gray-600"
          title="Dismiss suggestion"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
