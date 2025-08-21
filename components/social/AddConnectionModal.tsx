'use client';

import { useState } from 'react';
import { useSocial } from '@/hooks/useSocial';
import { X, UserPlus, Search, Loader2 } from 'lucide-react';

interface AddConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddConnectionModal({ isOpen, onClose }: AddConnectionModalProps) {
  const { sendConnectionRequest, loading } = useSocial();
  const [email, setEmail] = useState('');
  const [connectionType, setConnectionType] = useState<'friend' | 'family_friend' | 'neighbor'>('friend');
  const [notes, setNotes] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSendRequest = async (userId: string) => {
    try {
      await sendConnectionRequest({
        following_user_id: userId,
        connection_type: connectionType,
        notes: notes.trim() || undefined
      });
      
      setEmail('');
      setNotes('');
      setSearchResults([]);
      onClose();
    } catch (error) {
      console.error('Error sending connection request:', error);
    }
  };

  const handleSearch = async () => {
    if (!email.trim()) return;
    
    setSearching(true);
    try {
      // This would be implemented with a search API endpoint
      // For now, we'll just show a placeholder
      setSearchResults([
        {
          id: 'placeholder-1',
          first_name: 'John',
          last_name: 'Doe',
          email: email,
          avatar_url: null
        }
      ]);
    } catch (error) {
      console.error('Error searching for users:', error);
    } finally {
      setSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Add Connection</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by email
              </label>
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching || !email.trim()}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Connection Type
              </label>
              <select
                value={connectionType}
                onChange={(e) => setConnectionType(e.target.value as any)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="friend">Friend</option>
                <option value="family_friend">Family Friend</option>
                <option value="neighbor">Neighbor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a personal message..."
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Search Results</h4>
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={`${user.first_name} ${user.last_name}`}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium text-gray-600">
                              {user.first_name[0]}{user.last_name[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSendRequest(user.id)}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Connect
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
