'use client';

import React, { useState } from 'react';
import { Restaurant } from '@/types/restaurant';
import { Calendar, Clock, Users, MapPin, AlertCircle } from 'lucide-react';

interface CalendarIntegrationProps {
  restaurant: Restaurant;
  onEventCreated?: (eventId: string) => void;
}

export function CalendarIntegration({ restaurant, onEventCreated }: CalendarIntegrationProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [eventForm, setEventForm] = useState({
    date: '',
    time: '19:00',
    duration: 2,
    notes: '',
  });

  const handleConnectCalendar = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/integrations/calendar');
      const data = await response.json();
      
      if (data.authUrl) {
        // Open in popup or redirect
        window.open(data.authUrl, 'calendar-auth', 'width=500,height=600,scrollbars=yes');
        // In a real app, you'd listen for the popup to close and check auth status
        setTimeout(() => {
          setIsConnected(true);
          setIsConnecting(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Calendar connection error:', error);
      setIsConnecting(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.date || !eventForm.time) return;

    setIsCreatingEvent(true);
    try {
      // In a real implementation, you'd get the access token from user's stored integrations
      const mockAccessToken = 'mock_token'; // This would come from your auth flow
      
      const response = await fetch('/api/integrations/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant,
          date: eventForm.date,
          time: eventForm.time,
          duration: eventForm.duration,
          accessToken: mockAccessToken,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Dining event added to your calendar!');
        setShowEventForm(false);
        onEventCreated?.(data.eventId);
      } else {
        alert('Failed to create calendar event. Please try again.');
      }
    } catch (error) {
      console.error('Create event error:', error);
      alert('Error creating calendar event.');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold">Calendar Integration</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          Connect your calendar to easily plan dining reservations and track your restaurant visits.
        </p>
        
        <button
          onClick={handleConnectCalendar}
          disabled={isConnecting}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Calendar className="h-4 w-4" />
          {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="h-6 w-6 text-green-600" />
        <h3 className="text-lg font-semibold">Calendar Integration</h3>
        <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Connected</span>
      </div>

      {!showEventForm ? (
        <div>
          <p className="text-gray-600 mb-4">
            Add a dining event for {restaurant.name} to your calendar.
          </p>
          
          <button
            onClick={() => setShowEventForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Calendar className="h-4 w-4" />
            Plan Dining Event
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={eventForm.date}
                onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                value={eventForm.time}
                onChange={(e) => setEventForm(prev => ({ ...prev, time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (hours)
            </label>
            <select
              value={eventForm.duration}
              onChange={(e) => setEventForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>1 hour</option>
              <option value={1.5}>1.5 hours</option>
              <option value={2}>2 hours</option>
              <option value={2.5}>2.5 hours</option>
              <option value={3}>3 hours</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={eventForm.notes}
              onChange={(e) => setEventForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Special occasion, dietary restrictions, etc."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Event Preview</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{restaurant.name} - {restaurant.address}, {restaurant.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {eventForm.date && new Date(eventForm.date).toLocaleDateString()} at {eventForm.time}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Duration: {eventForm.duration} hours</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleCreateEvent}
              disabled={isCreatingEvent || !eventForm.date || !eventForm.time}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Calendar className="h-4 w-4" />
              {isCreatingEvent ? 'Adding to Calendar...' : 'Add to Calendar'}
            </button>
            
            <button
              onClick={() => setShowEventForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
