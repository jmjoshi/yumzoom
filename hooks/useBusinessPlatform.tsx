import { useState, useCallback } from 'react';
import {
  SubscriptionPlan,
  RestaurantSubscription,
  AdCampaign,
  ApiApplication,
  RestaurantPromotion,
  BusinessDashboardStats,
  CreateSubscriptionRequest,
  CreateAdCampaignRequest,
  CreateApiApplicationRequest,
  CreatePromotionRequest,
  BusinessPlatformResponse
} from '@/types/business-platform';

export function useBusinessPlatform() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to handle API responses
  const handleApiResponse = useCallback(async <T,>(response: Response): Promise<T> => {
    const data: BusinessPlatformResponse<T> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'An error occurred');
    }
    
    return data.data as T;
  }, []);

  // Subscription Management
  const getSubscriptionPlans = useCallback(async (): Promise<SubscriptionPlan[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/business-platform/subscriptions?plans_only=true');
      return await handleApiResponse<SubscriptionPlan[]>(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subscription plans';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleApiResponse]);

  const getRestaurantSubscriptions = useCallback(async (restaurantId: string): Promise<RestaurantSubscription[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/business-platform/subscriptions?restaurant_id=${restaurantId}`);
      return await handleApiResponse<RestaurantSubscription[]>(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch restaurant subscriptions';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleApiResponse]);

  const createSubscription = useCallback(async (subscriptionData: CreateSubscriptionRequest): Promise<RestaurantSubscription> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/business-platform/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });
      
      return await handleApiResponse<RestaurantSubscription>(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create subscription';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleApiResponse]);

  const updateSubscription = useCallback(async (subscriptionId: string, updateData: { auto_renew?: boolean; payment_method_id?: string }): Promise<RestaurantSubscription> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/business-platform/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      return await handleApiResponse<RestaurantSubscription>(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update subscription';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleApiResponse]);

  const cancelSubscription = useCallback(async (subscriptionId: string): Promise<RestaurantSubscription> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/business-platform/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
      });
      
      return await handleApiResponse<RestaurantSubscription>(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel subscription';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleApiResponse]);

  // Advertising Management
  const getAdCampaigns = useCallback(async (restaurantId: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ campaigns: AdCampaign[]; pagination: any }> => {
    setLoading(true);
    setError(null);
    
    try {
      const searchParamsObj: Record<string, string> = {
        restaurant_id: restaurantId,
      };

      // Convert all params to strings
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParamsObj[key] = String(value);
          }
        });
      }

      const searchParams = new URLSearchParams(searchParamsObj);
      
      const response = await fetch(`/api/business-platform/advertising?${searchParams}`);
      const data = await handleApiResponse<AdCampaign[]>(response);
      
      return {
        campaigns: data,
        pagination: {} // Will be populated from API response
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch ad campaigns';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleApiResponse]);

  const createAdCampaign = useCallback(async (campaignData: CreateAdCampaignRequest): Promise<AdCampaign> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/business-platform/advertising', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });
      
      return await handleApiResponse<AdCampaign>(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create ad campaign';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleApiResponse]);

  // API Management
  const getApiApplications = useCallback(async (params?: {
    status?: string;
    developer_email?: string;
    page?: number;
    limit?: number;
  }): Promise<{ applications: ApiApplication[]; pagination: any }> => {
    setLoading(true);
    setError(null);
    
    try {
      const searchParamsObj: Record<string, string> = {};

      // Convert all params to strings
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParamsObj[key] = String(value);
          }
        });
      }

      const searchParams = new URLSearchParams(searchParamsObj);
      
      const response = await fetch(`/api/business-platform/developer-api?${searchParams}`);
      const data = await handleApiResponse<ApiApplication[]>(response);
      
      return {
        applications: data,
        pagination: {} // Will be populated from API response
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch API applications';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleApiResponse]);

  const createApiApplication = useCallback(async (applicationData: CreateApiApplicationRequest): Promise<ApiApplication> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/business-platform/developer-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });
      
      return await handleApiResponse<ApiApplication>(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create API application';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleApiResponse]);

  // Feature Access Utilities
  const checkFeatureAccess = useCallback(async (restaurantId: string, featureName: string): Promise<boolean> => {
    try {
      // This would be implemented as a separate API endpoint
      // For now, return true as a placeholder
      return true;
    } catch (err) {
      console.error('Error checking feature access:', err);
      return false;
    }
  }, []);

  const getUsageStats = useCallback(async (restaurantId: string): Promise<any> => {
    try {
      // This would be implemented as a separate API endpoint
      // For now, return empty object as a placeholder
      return {};
    } catch (err) {
      console.error('Error fetching usage stats:', err);
      return {};
    }
  }, []);

  return {
    // State
    loading,
    error,
    
    // Subscription methods
    getSubscriptionPlans,
    getRestaurantSubscriptions,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    
    // Advertising methods
    getAdCampaigns,
    createAdCampaign,
    
    // API management methods
    getApiApplications,
    createApiApplication,
    
    // Utility methods
    checkFeatureAccess,
    getUsageStats,
    
    // Clear error
    clearError: () => setError(null)
  };
}

// Specialized hook for subscription management
export function useSubscriptions(restaurantId: string) {
  const {
    loading,
    error,
    getSubscriptionPlans,
    getRestaurantSubscriptions,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    clearError
  } = useBusinessPlatform();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<RestaurantSubscription[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<RestaurantSubscription | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [plansData, subscriptionsData] = await Promise.all([
        getSubscriptionPlans(),
        getRestaurantSubscriptions(restaurantId)
      ]);
      
      setPlans(plansData);
      setSubscriptions(subscriptionsData);
      
      // Find active subscription
      const active = subscriptionsData.find(sub => sub.status === 'active');
      setCurrentSubscription(active || null);
    } catch (err) {
      console.error('Error fetching subscription data:', err);
    }
  }, [restaurantId, getSubscriptionPlans, getRestaurantSubscriptions]);

  const subscribe = useCallback(async (planId: string, billingCycle: 'monthly' | 'yearly') => {
    const newSubscription = await createSubscription({
      restaurant_id: restaurantId,
      subscription_plan_id: planId,
      billing_cycle: billingCycle
    });
    
    // Refresh data
    await fetchData();
    return newSubscription;
  }, [restaurantId, createSubscription, fetchData]);

  const upgradeSubscription = useCallback(async (newPlanId: string) => {
    if (!currentSubscription) {
      throw new Error('No active subscription found');
    }
    
    // Cancel current subscription
    await cancelSubscription(currentSubscription.id);
    
    // Create new subscription
    return await subscribe(newPlanId, currentSubscription.billing_cycle);
  }, [currentSubscription, cancelSubscription, subscribe]);

  const toggleAutoRenew = useCallback(async () => {
    if (!currentSubscription) {
      throw new Error('No active subscription found');
    }
    
    const updated = await updateSubscription(currentSubscription.id, {
      auto_renew: !currentSubscription.auto_renew
    });
    
    setCurrentSubscription(updated);
    return updated;
  }, [currentSubscription, updateSubscription]);

  return {
    // State
    loading,
    error,
    plans,
    subscriptions,
    currentSubscription,
    
    // Methods
    fetchData,
    subscribe,
    upgradeSubscription,
    toggleAutoRenew,
    cancelSubscription: async () => {
      if (!currentSubscription) return;
      await cancelSubscription(currentSubscription.id);
      await fetchData();
    },
    
    // Utils
    clearError
  };
}

// Specialized hook for advertising management
export function useAdvertising(restaurantId: string) {
  const {
    loading,
    error,
    getAdCampaigns,
    createAdCampaign,
    checkFeatureAccess,
    clearError
  } = useBusinessPlatform();

  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [hasAccess, setHasAccess] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    try {
      const { campaigns } = await getAdCampaigns(restaurantId);
      setCampaigns(campaigns);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    }
  }, [restaurantId, getAdCampaigns]);

  const checkAccess = useCallback(async () => {
    const access = await checkFeatureAccess(restaurantId, 'ad_campaigns');
    setHasAccess(access);
  }, [restaurantId, checkFeatureAccess]);

  const createCampaign = useCallback(async (campaignData: Omit<CreateAdCampaignRequest, 'restaurant_id'>) => {
    const newCampaign = await createAdCampaign({
      ...campaignData,
      restaurant_id: restaurantId
    });
    
    // Refresh campaigns
    await fetchCampaigns();
    return newCampaign;
  }, [restaurantId, createAdCampaign, fetchCampaigns]);

  return {
    // State
    loading,
    error,
    campaigns,
    hasAccess,
    
    // Methods
    fetchCampaigns,
    checkAccess,
    createCampaign,
    
    // Utils
    clearError
  };
}
