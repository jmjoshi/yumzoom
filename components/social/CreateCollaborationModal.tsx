'use client';

import { useState } from 'react';
import { useSocial } from '@/hooks/useSocial';
import { X, Users, MapPin, Clock, Loader2 } from 'lucide-react';

interface CreateCollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateCollaborationModal({ isOpen, onClose }: CreateCollaborationModalProps) {
  const { createCollaborationSession, loading } = useSocial();
  const [title, setTitle] = useState('');
  const [sessionType, setSessionType] = useState<'restaurant_voting' | 'menu_planning' | 'occasion_planning' | 'group_discovery'>('restaurant_voting');
  const [location, setLocation] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [description, setDescription] = useState('');
  const [inviteEmails, setInviteEmails] = useState('');

  const handleCreate = async () => {
    if (!title.trim()) return;

    try {
      const sessionData = {
        title: title.trim(),
        session_type: sessionType,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
        metadata: inviteEmails.trim() ? { inviteEmails: inviteEmails.split(',').map(e => e.trim()) } : undefined
      };

      await createCollaborationSession(sessionData);
      
      // Reset form
      setTitle('');
      setSessionType('restaurant_voting');
      setLocation('');
      setScheduledFor('');
      setDescription('');
      setInviteEmails('');
      
      onClose();
    } catch (error) {
      console.error('Error creating collaboration session:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Create Collaboration Session</h3>
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
                Session Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Saturday Family Dinner Planning"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Type
              </label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value as any)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="restaurant_voting">Restaurant Voting</option>
                <option value="menu_planning">Menu Planning</option>
                <option value="occasion_planning">Occasion Planning</option>
                <option value="group_discovery">Group Discovery</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-4 w-4 inline mr-1" />
                Location (optional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Downtown area, Mall food court"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Scheduled For (optional)
              </label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about what you're planning..."
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="h-4 w-4 inline mr-1" />
                Invite by Email (optional)
              </label>
              <input
                type="text"
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate multiple emails with commas
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={loading || !title.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
