'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CalendarIntegration, ReservationRequest, DeliveryOption } from '@/lib/integrations';

interface UserIntegration {
  id: string;
  integration_type: string;
  provider: string;
  is_active: boolean;
  settings: any;
  created_at: string;
  updated_at: string;
}

interface Reservation {
  id: string;
  restaurant_id: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: string;
  provider: string;
  confirmation_number?: string;
  created_at: string;
}

interface CalendarEvent {
  id: string;
  restaurant_id: string;
  event_title: string;
  event_date: string;
  event_time: string;
  duration_hours: number;
  provider: string;
  created_at: string;
}

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<UserIntegration[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user integrations
  const loadIntegrations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integrations');
    } finally {
      setIsLoading(false);
    }
  };

  // Load user reservations
  const loadReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('reservation_date', { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reservations');
    }
  };

  // Load calendar events
  const loadCalendarEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;
      setCalendarEvents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar events');
    }
  };

  // Create calendar integration
  const connectCalendar = async (provider: string = 'google') => {
    try {
      const response = await fetch(`/api/integrations/calendar?provider=${provider}`);
      const data = await response.json();
      
      if (data.authUrl) {
        // Open authorization popup
        const popup = window.open(
          data.authUrl, 
          'calendar-auth', 
          'width=500,height=600,scrollbars=yes'
        );
        
        // Wait for popup to close (simple implementation)
        return new Promise((resolve, reject) => {
          const checkClosed = setInterval(() => {
            if (popup?.closed) {
              clearInterval(checkClosed);
              // Reload integrations to check if auth was successful
              loadIntegrations().then(() => resolve(true));
            }
          }, 1000);
          
          // Timeout after 5 minutes
          setTimeout(() => {
            clearInterval(checkClosed);
            if (popup && !popup.closed) popup.close();
            reject(new Error('Authentication timeout'));
          }, 300000);
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect calendar');
      throw err;
    }
  };

  // Create calendar event
  const createCalendarEvent = async (
    restaurantId: string,
    eventData: {
      date: string;
      time: string;
      duration?: number;
      notes?: string;
    }
  ) => {
    try {
      const calendarIntegration = integrations.find(
        i => i.integration_type === 'calendar' && i.is_active
      );
      
      if (!calendarIntegration) {
        throw new Error('No calendar integration found. Please connect your calendar first.');
      }

      // Get restaurant data
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();

      if (restaurantError) throw restaurantError;

      const response = await fetch('/api/integrations/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant,
          ...eventData,
          accessToken: 'user_token', // In real implementation, decrypt from integration
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await loadCalendarEvents(); // Refresh events
        return result;
      } else {
        throw new Error(result.message || 'Failed to create calendar event');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create calendar event');
      throw err;
    }
  };

  // Make reservation
  const makeReservation = async (reservationData: ReservationRequest) => {
    try {
      const response = await fetch('/api/integrations/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData),
      });

      const result = await response.json();
      
      if (result.success) {
        await loadReservations(); // Refresh reservations
        return result;
      } else {
        throw new Error(result.message || 'Failed to make reservation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make reservation');
      throw err;
    }
  };

  // Get delivery options
  const getDeliveryOptions = async (restaurantId: string): Promise<DeliveryOption[]> => {
    try {
      const response = await fetch('/api/integrations/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId }),
      });

      const result = await response.json();
      
      if (result.success) {
        return result.deliveryOptions;
      } else {
        throw new Error(result.message || 'Failed to get delivery options');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get delivery options');
      throw err;
    }
  };

  // Share on social media
  const shareOnSocial = async (
    restaurantId: string,
    platform: string,
    options?: {
      rating?: number;
      review?: string;
      customMessage?: string;
    }
  ) => {
    try {
      const response = await fetch('/api/integrations/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          platform,
          ...options,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.message || 'Failed to prepare share content');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share on social media');
      throw err;
    }
  };

  // Disconnect integration
  const disconnectIntegration = async (integrationId: string) => {
    try {
      const { error } = await supabase
        .from('user_integrations')
        .update({ is_active: false })
        .eq('id', integrationId);

      if (error) throw error;
      
      await loadIntegrations(); // Refresh integrations
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect integration');
      throw err;
    }
  };

  // Cancel reservation
  const cancelReservation = async (reservationId: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId);

      if (error) throw error;
      
      await loadReservations(); // Refresh reservations
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel reservation');
      throw err;
    }
  };

  // Get integration status
  const getIntegrationStatus = (type: string, provider?: string) => {
    const integration = integrations.find(i => 
      i.integration_type === type && 
      i.is_active && 
      (provider ? i.provider === provider : true)
    );
    return integration ? 'connected' : 'disconnected';
  };

  // Check if specific integration is available
  const isIntegrationAvailable = (type: string, provider?: string) => {
    return getIntegrationStatus(type, provider) === 'connected';
  };

  useEffect(() => {
    loadIntegrations();
    loadReservations();
    loadCalendarEvents();
  }, []);

  return {
    // State
    integrations,
    reservations,
    calendarEvents,
    isLoading,
    error,
    
    // Actions
    connectCalendar,
    createCalendarEvent,
    makeReservation,
    getDeliveryOptions,
    shareOnSocial,
    disconnectIntegration,
    cancelReservation,
    
    // Utilities
    getIntegrationStatus,
    isIntegrationAvailable,
    
    // Refresh functions
    loadIntegrations,
    loadReservations,
    loadCalendarEvents,
  };
}
