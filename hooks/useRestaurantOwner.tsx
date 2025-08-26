import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
import type { 
  RestaurantOwner, 
  OwnerDashboardStats, 
  CreateResponseRequest, 
  UpdateResponseRequest,
  OwnerVerificationRequest,
  ResponseNotification
} from '@/types/restaurant-owner';

export interface UseRestaurantOwnerReturn {
  // State
  ownerStatus: RestaurantOwner[];
  dashboardData: OwnerDashboardStats[];
  notifications: ResponseNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;

  // Actions
  submitVerificationRequest: (request: OwnerVerificationRequest) => Promise<boolean>;
  createResponse: (request: CreateResponseRequest) => Promise<boolean>;
  updateResponse: (request: UpdateResponseRequest) => Promise<boolean>;
  deleteResponse: (responseId: string) => Promise<boolean>;
  markNotificationsRead: (notificationIds: string[]) => Promise<boolean>;
  refreshOwnerStatus: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export function useRestaurantOwner(): UseRestaurantOwnerReturn {
  const { user } = useAuth();
  const [ownerStatus, setOwnerStatus] = useState<RestaurantOwner[]>([]);
  const [dashboardData, setDashboardData] = useState<OwnerDashboardStats[]>([]);
  const [notifications, setNotifications] = useState<ResponseNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Fetch owner status
  const refreshOwnerStatus = async () => {
    if (!user || retryCount >= MAX_RETRIES) return;

    try {
      setLoading(true);
      setError(null);

      // Get auth token
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('No active session');
      }

      const response = await fetch('/api/restaurant-owners/verify', {
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required');
          return;
        }
        if (response.status === 404) {
          // Endpoint not found, likely not implemented yet
          console.warn('Restaurant owner verification endpoint not available');
          setOwnerStatus([]);
          return;
        }
        throw new Error('Failed to fetch owner status');
      }

      const data = await response.json();
      setOwnerStatus(data.restaurants || []);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setRetryCount(prev => prev + 1);
      console.error('Owner status fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard data
  const refreshDashboard = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/restaurant-owners/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data.restaurants || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications
  const refreshNotifications = async () => {
    if (!user || retryCount >= MAX_RETRIES) return;

    try {
      // Get auth token
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        setError('No active session');
        return;
      }

      const response = await fetch('/api/notifications/responses', {
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required');
          return;
        }
        if (response.status === 404) {
          // Endpoint not found, likely not implemented yet
          console.warn('Notifications endpoint not available');
          setNotifications([]);
          setUnreadCount(0);
          return;
        }
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Notifications fetch error:', err);
    }
  };

  // Submit verification request
  const submitVerificationRequest = async (request: OwnerVerificationRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/restaurant-owners/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit verification request');
      }

      await refreshOwnerStatus();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Create response to review
  const createResponse = async (request: CreateResponseRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/restaurant-owners/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create response');
      }

      await refreshDashboard();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update response
  const updateResponse = async (request: UpdateResponseRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/restaurant-owners/responses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update response');
      }

      await refreshDashboard();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete response
  const deleteResponse = async (responseId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/restaurant-owners/responses?response_id=${responseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete response');
      }

      await refreshDashboard();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Mark notifications as read
  const markNotificationsRead = async (notificationIds: string[]): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications/responses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notification_ids: notificationIds }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to mark notifications as read');
      }

      await refreshNotifications();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  };

  // Load data on mount and user change with debounce
  useEffect(() => {
    if (!user) {
      setOwnerStatus([]);
      setDashboardData([]);
      setNotifications([]);
      setUnreadCount(0);
      setRetryCount(0);
      return;
    }

    // Debounce to prevent rapid API calls
    const timer = setTimeout(() => {
      refreshOwnerStatus();
      refreshNotifications();
    }, 500);

    return () => clearTimeout(timer);
  }, [user]);

  return {
    // State
    ownerStatus,
    dashboardData,
    notifications,
    unreadCount,
    loading,
    error,

    // Actions
    submitVerificationRequest,
    createResponse,
    updateResponse,
    deleteResponse,
    markNotificationsRead,
    refreshOwnerStatus,
    refreshDashboard,
    refreshNotifications,
  };
}
