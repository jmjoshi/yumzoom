'use client';

import { useState } from 'react';
import { FamilyConnection } from '@/types/social';
import { useSocial } from '@/hooks/useSocial';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Check, 
  X, 
  MoreVertical,
  Clock,
  Shield
} from 'lucide-react';

interface ConnectionsListProps {
  connections: FamilyConnection[];
  pendingRequests: FamilyConnection[];
}

export function ConnectionsList({ connections, pendingRequests }: ConnectionsListProps) {
  const { respondToConnectionRequest, removeConnection, loading } = useSocial();
  const [activeTab, setActiveTab] = useState<'connections' | 'pending'>('connections');

  const handleAcceptRequest = async (connectionId: string) => {
    try {
      await respondToConnectionRequest(connectionId, true);
    } catch (error) {
      console.error('Error accepting connection request:', error);
    }
  };

  const handleDeclineRequest = async (connectionId: string) => {
    try {
      await respondToConnectionRequest(connectionId, false);
    } catch (error) {
      console.error('Error declining connection request:', error);
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    if (window.confirm('Are you sure you want to remove this connection?')) {
      try {
        await removeConnection(connectionId);
      } catch (error) {
        console.error('Error removing connection:', error);
      }
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('connections')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'connections'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Connections ({connections.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Clock className="h-4 w-4 inline mr-2" />
            Pending ({pendingRequests.length})
            {pendingRequests.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'connections' && (
          <div className="space-y-4">
            {connections.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No connections yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start connecting with other families to discover new restaurants together.
                </p>
                <div className="mt-6">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700">
                    <UserPlus className="-ml-1 mr-2 h-5 w-5" />
                    Find Families
                  </button>
                </div>
              </div>
            ) : (
              connections.map((connection) => {
                const otherProfile = connection.follower_profile?.first_name ? 
                  connection.follower_profile : connection.following_profile;
                
                return (
                  <div key={connection.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {otherProfile?.avatar_url ? (
                          <img
                            src={otherProfile.avatar_url}
                            alt={`${otherProfile.first_name} ${otherProfile.last_name}`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {otherProfile?.first_name?.[0]}{otherProfile?.last_name?.[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {otherProfile?.first_name} {otherProfile?.last_name}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span className="capitalize">{connection.connection_type.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>Connected {new Date(connection.created_at).toLocaleDateString()}</span>
                        </div>
                        {connection.notes && (
                          <p className="text-xs text-gray-600 mt-1">{connection.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRemoveConnection(connection.id)}
                        disabled={loading}
                        className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-50"
                        title="Remove connection"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No pending requests</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You'll see connection requests from other families here.
                </p>
              </div>
            ) : (
              pendingRequests.map((request) => {
                const requesterProfile = request.follower_profile;
                
                return (
                  <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-blue-50">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {requesterProfile?.avatar_url ? (
                          <img
                            src={requesterProfile.avatar_url}
                            alt={`${requesterProfile.first_name} ${requesterProfile.last_name}`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {requesterProfile?.first_name?.[0]}{requesterProfile?.last_name?.[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {requesterProfile?.first_name} {requesterProfile?.last_name}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>Wants to connect as {request.connection_type.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                        {request.notes && (
                          <p className="text-xs text-gray-600 mt-1">"{request.notes}"</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(request.id)}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
