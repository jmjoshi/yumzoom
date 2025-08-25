'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { UserRole, getUserPermissions, UserPermissions } from '@/lib/rbac';

interface UseUserRoleResult {
  role: UserRole | undefined;
  permissions: UserPermissions;
  loading: boolean;
  error: string | null;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  isAdmin: boolean;
  isRestaurantOwner: boolean;
  isBusinessPartner: boolean;
  isCustomer: boolean;
}

export function useUserRole(): UseUserRoleResult {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserRole() {
      if (!user) {
        setRole(undefined);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch user role from user_profiles table
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('user_role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          // If no profile exists, default to customer
          if (profileError.code === 'PGRST116') {
            setRole('customer');
          } else {
            throw profileError;
          }
        } else {
          setRole(profile?.user_role as UserRole || 'customer');
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user role');
        setRole('customer'); // Default fallback
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [user]);

  const permissions = getUserPermissions(role);

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    return permissions[permission];
  };

  return {
    role,
    permissions,
    loading,
    error,
    hasPermission,
    isAdmin: role === 'admin',
    isRestaurantOwner: role === 'restaurant_owner',
    isBusinessPartner: role === 'business_partner',
    isCustomer: role === 'customer',
  };
}
