import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
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

  // Fetch owner status
  const refreshOwnerStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/restaurant-owners/verify');
      if (!response.ok) {
        throw new Error('Failed to fetch owner status');
      }

      const data = await response.json();
      setOwnerStatus(data.restaurants || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
    if (!user) return;

    try {
      const response = await fetch('/api/notifications/responses');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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

  // Load data on mount and user change
  useEffect(() => {
    if (user) {
      refreshOwnerStatus();
      refreshNotifications();
    } else {
      setOwnerStatus([]);
      setDashboardData([]);
      setNotifications([]);
      setUnreadCount(0);
    }
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
