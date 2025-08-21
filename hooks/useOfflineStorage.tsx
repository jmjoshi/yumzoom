'use client';

import { useState, useEffect, useCallback } from 'react';

// Generic offline storage hook
export function useOfflineStorage<T>(
  key: string,
  initialValue: T,
  maxItems = 50
) {
  const [value, setValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStoredValue = () => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          setValue(JSON.parse(stored));
        }
      } catch (error) {
        console.warn(`Failed to load ${key} from localStorage:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredValue();
  }, [key]);

  const updateValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(prev => {
      const updated = typeof newValue === 'function' ? (newValue as Function)(prev) : newValue;
      
      try {
        // Handle arrays with max items
        if (Array.isArray(updated) && updated.length > maxItems) {
          const trimmed = updated.slice(-maxItems);
          localStorage.setItem(key, JSON.stringify(trimmed));
          return trimmed as T;
        } else {
          localStorage.setItem(key, JSON.stringify(updated));
          return updated;
        }
      } catch (error) {
        console.warn(`Failed to save ${key} to localStorage:`, error);
        return updated;
      }
    });
  }, [key, maxItems]);

  const clearValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setValue(initialValue);
    } catch (error) {
      console.warn(`Failed to clear ${key} from localStorage:`, error);
    }
  }, [key, initialValue]);

  return { value, updateValue, clearValue, isLoading };
}

// Hook for offline restaurant data
// Hook for offline restaurant data
export function useOfflineRestaurants() {
  return useOfflineStorage<any[]>('offline_restaurants', [], 100);
}

// Hook for offline reviews
export function useOfflineReviews() {
  const { value: pendingReviews, updateValue, clearValue } = useOfflineStorage<any[]>('pending_reviews', []);

  const addPendingReview = useCallback((review: any) => {
    const reviewWithId = {
      ...review,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      status: 'pending',
    };

    updateValue((prev: any[]) => [...prev, reviewWithId]);
    return reviewWithId.id;
  }, [updateValue]);

  const removePendingReview = useCallback((reviewId: string) => {
    updateValue((prev: any[]) => prev.filter((review: any) => review.id !== reviewId));
  }, [updateValue]);

  const getPendingReviews = useCallback(() => {
    return pendingReviews;
  }, [pendingReviews]);

  return {
    pendingReviews,
    addPendingReview,
    removePendingReview,
    getPendingReviews,
    clearPendingReviews: clearValue,
  };
}

// Hook for offline favorites
export function useOfflineFavorites() {
  const { value: favorites, updateValue } = useOfflineStorage<Set<string>>(
    'offline_favorites', 
    new Set<string>()
  );

  const addFavorite = useCallback((restaurantId: string) => {
    updateValue((prev: Set<string>) => new Set([...Array.from(prev), restaurantId]));
  }, [updateValue]);

  const removeFavorite = useCallback((restaurantId: string) => {
    updateValue((prev: Set<string>) => {
      const newSet = new Set(prev);
      newSet.delete(restaurantId);
      return newSet;
    });
  }, [updateValue]);

  const isFavorite = useCallback((restaurantId: string) => {
    return favorites.has(restaurantId);
  }, [favorites]);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
  };
}

// Hook for managing offline queue
export function useOfflineQueue() {
  const { value: queue, updateValue, clearValue } = useOfflineStorage<any[]>('offline_queue', []);

  const addToQueue = useCallback((action: {
    type: string;
    data: any;
    timestamp: number;
    retryCount?: number;
  }) => {
    const queueItem = {
      ...action,
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: action.timestamp || Date.now(),
      retryCount: action.retryCount || 0,
    };

    updateValue((prev: any[]) => [...prev, queueItem]);
    return queueItem.id;
  }, [updateValue]);

  const removeFromQueue = useCallback((itemId: string) => {
    updateValue((prev: any[]) => prev.filter((item: any) => item.id !== itemId));
  }, [updateValue]);

  const updateQueueItem = useCallback((itemId: string, updates: any) => {
    updateValue((prev: any[]) => prev.map((item: any) => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  }, [updateValue]);

  const getQueuedActions = useCallback((type?: string) => {
    return type ? queue.filter((item: any) => item.type === type) : queue;
  }, [queue]);

  return {
    queue,
    addToQueue,
    removeFromQueue,
    updateQueueItem,
    getQueuedActions,
    clearQueue: clearValue,
  };
}

// Hook for sync management
export function useSyncManager() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { queue, removeFromQueue, updateQueueItem } = useOfflineQueue();

  const syncPendingActions = useCallback(async () => {
    if (isSyncing || !navigator.onLine || queue.length === 0) {
      return;
    }

    setIsSyncing(true);

    try {
      for (const item of queue as any[]) {
        try {
          // Process each queued action
          await processQueuedAction(item);
          removeFromQueue(item.id);
        } catch (error) {
          console.warn('Failed to sync action:', item, error);
          
          // Increment retry count
          const newRetryCount = (item.retryCount || 0) + 1;
          
          if (newRetryCount < 3) {
            updateQueueItem(item.id, { retryCount: newRetryCount });
          } else {
            // Remove after 3 failed attempts
            removeFromQueue(item.id);
          }
        }
      }

      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, queue, removeFromQueue, updateQueueItem]);

  // Auto-sync when online
  useEffect(() => {
    const handleOnline = () => {
      if (queue.length > 0) {
        setTimeout(syncPendingActions, 1000); // Delay to ensure connection is stable
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [queue.length, syncPendingActions]);

  return {
    isSyncing,
    lastSyncTime,
    syncPendingActions,
    pendingCount: queue.length,
  };
}

// Helper function to process queued actions
async function processQueuedAction(action: any) {
  const { type, data } = action;

  switch (type) {
    case 'create_review':
      return await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

    case 'update_rating':
      return await fetch(`/api/restaurants/${data.restaurant_id}/rating`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

    case 'add_favorite':
      return await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

    case 'remove_favorite':
      return await fetch(`/api/favorites/${data.restaurant_id}`, {
        method: 'DELETE',
      });

    default:
      throw new Error(`Unknown action type: ${type}`);
  }
}

// Hook for caching API responses
export function useAPICache<T>(
  cacheKey: string,
  fetchFunction: () => Promise<T>,
  ttlMinutes = 30
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem(`cache_${cacheKey}`);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > ttlMinutes * 60 * 1000;
      
      return isExpired ? null : data;
    } catch {
      return null;
    }
  }, [cacheKey, ttlMinutes]);

  const setCachedData = useCallback((data: T) => {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(`cache_${cacheKey}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }, [cacheKey]);

  const fetchData = useCallback(async (useCache = true) => {
    setLoading(true);
    setError(null);

    try {
      // Try cache first if online and cache is enabled
      if (useCache && navigator.onLine) {
        const cachedData = getCachedData();
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return cachedData;
        }
      }

      // Fetch fresh data if online
      if (navigator.onLine) {
        const freshData = await fetchFunction();
        setData(freshData);
        setCachedData(freshData);
        return freshData;
      } else {
        // Use cache as fallback when offline
        const cachedData = getCachedData();
        if (cachedData) {
          setData(cachedData);
          return cachedData;
        } else {
          throw new Error('No cached data available offline');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, getCachedData, setCachedData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(false),
    refresh: () => fetchData(true),
  };
}
