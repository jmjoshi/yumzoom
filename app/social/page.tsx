'use client';

import { useState, useEffect } from 'react';
import { useSocial } from '@/hooks/useSocial';
// import { useSimpleSocial } from '@/hooks/useSocial-simple';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  MessageSquare, 
  UserPlus, 
  Activity, 
  Vote,
  Heart,
  Bell,
  Settings,
  Search,
  Filter
} from 'lucide-react';

// Import components (to be created)
import { ConnectionsList } from '@/components/social/ConnectionsList';
import { ActivityFeed } from '@/components/social/ActivityFeed';
import { RecommendationsList } from '@/components/social/RecommendationsList';
import { CollaborationsList } from '@/components/social/CollaborationsList';
import { FriendSuggestions } from '@/components/social/FriendSuggestions';
import { SocialStats } from '@/components/social/SocialStats';
import { AddConnectionModal } from '@/components/social/AddConnectionModal';
import { CreateCollaborationModal } from '@/components/social/CreateCollaborationModal';

export default function SocialPage() {
  const { user } = useAuth();
  const {
    loading,
    error,
    connections,
    pendingRequests,
    receivedRecommendations,
    activeCollaborations,
    activityFeed,
    socialStats,
    refreshAll
  } = useSocial();
  
  // Remove temporary placeholders since we're back to full useSocial
  
  const [activeTab, setActiveTab] = useState<'feed' | 'connections' | 'recommendations' | 'collaborations'>('feed');
  const [showAddConnectionModal, setShowAddConnectionModal] = useState(false);
  const [showCreateCollaborationModal, setShowCreateCollaborationModal] = useState(false);

  useEffect(() => {
    if (user) {
      refreshAll();
    }
  }, [user, refreshAll]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign in to access social features</h2>
          <p className="text-gray-600">Connect with other families and discover new restaurants together.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Users className="h-8 w-8 text-orange-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Social Hub</h1>
                <p className="text-sm text-gray-500">Connect with families and discover together</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notification badges */}
              {socialStats && (
                <div className="flex items-center space-x-2">
                  {socialStats.pending_requests_count > 0 && (
                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {socialStats.pending_requests_count} requests
                    </div>
                  )}
                  {socialStats.unread_recommendations_count > 0 && (
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      {socialStats.unread_recommendations_count} recommendations
                    </div>
                  )}
                </div>
              )}
              
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Bell className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Settings className="h-5 w-5" />
              </button>
              
              {/* Action buttons */}
              <button
                onClick={() => setShowAddConnectionModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Connection
              </button>
              
              <button
                onClick={() => setShowCreateCollaborationModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Vote className="h-4 w-4 mr-2" />
                New Session
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Stats Overview */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Social Stats</h3>
              <SocialStats stats={socialStats} />
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('feed')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium ${
                    activeTab === 'feed'
                      ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-500'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Activity className="h-5 w-5 mr-3" />
                  Activity Feed
                  {activityFeed.length > 0 && (
                    <span className="ml-auto bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {activityFeed.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('connections')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium ${
                    activeTab === 'connections'
                      ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-500'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Users className="h-5 w-5 mr-3" />
                  Connections
                  {socialStats && socialStats.connections_count > 0 && (
                    <span className="ml-auto bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {socialStats.connections_count}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('recommendations')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium ${
                    activeTab === 'recommendations'
                      ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-500'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Heart className="h-5 w-5 mr-3" />
                  Recommendations
                  {socialStats && socialStats.unread_recommendations_count > 0 && (
                    <span className="ml-auto bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                      {socialStats.unread_recommendations_count}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('collaborations')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium ${
                    activeTab === 'collaborations'
                      ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-500'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Vote className="h-5 w-5 mr-3" />
                  Collaborations
                  {socialStats && socialStats.active_collaborations_count > 0 && (
                    <span className="ml-auto bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                      {socialStats.active_collaborations_count}
                    </span>
                  )}
                </button>
              </nav>
            </div>

            {/* Friend Suggestions */}
            <div className="mt-6">
              <FriendSuggestions />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-lg shadow p-8">
                <div className="animate-pulse">
                  <div className="flex space-x-4">
                    <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!loading && (
              <>
                {activeTab === 'feed' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Activity Feed</h2>
                        <p className="text-sm text-gray-500 mt-1">
                          See what your connected families are discovering
                        </p>
                      </div>
                      <ActivityFeed activities={activityFeed} />
                    </div>
                  </div>
                )}

                {activeTab === 'connections' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900">Your Connections</h2>
                            <p className="text-sm text-gray-500 mt-1">
                              Manage your family network
                            </p>
                          </div>
                          <button className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700">
                            <UserPlus className="h-4 w-4 mr-2 inline" />
                            Add Connection
                          </button>
                        </div>
                      </div>
                      <ConnectionsList 
                        connections={connections}
                        pendingRequests={pendingRequests}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'recommendations' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Restaurant Recommendations</h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Discover restaurants recommended by your friends
                        </p>
                      </div>
                      <RecommendationsList recommendations={receivedRecommendations} />
                    </div>
                  </div>
                )}

                {activeTab === 'collaborations' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900">Family Collaborations</h2>
                            <p className="text-sm text-gray-500 mt-1">
                              Decide together where to dine
                            </p>
                          </div>
                          <button className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700">
                            <Vote className="h-4 w-4 mr-2 inline" />
                            Start Collaboration
                          </button>
                        </div>
                      </div>
                      <CollaborationsList collaborations={activeCollaborations} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <AddConnectionModal
        isOpen={showAddConnectionModal}
        onClose={() => setShowAddConnectionModal(false)}
      />
      
      <CreateCollaborationModal
        isOpen={showCreateCollaborationModal}
        onClose={() => setShowCreateCollaborationModal(false)}
      />
    </div>
  );
}
