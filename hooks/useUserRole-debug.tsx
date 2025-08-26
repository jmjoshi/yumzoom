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
  refetchRole: () => Promise<void>;
  debugInfo: any;
}

export function useUserRole(): UseUserRoleResult {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  const fetchUserRole = async () => {
    if (!user) {
      setRole(undefined);
      setLoading(false);
      setDebugInfo({ reason: 'No user found' });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching user role for:', user.email, 'ID:', user.id);

      // Try multiple approaches to get the role
      
      // Approach 1: Standard query
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_role, first_name, last_name, created_at, updated_at')
        .eq('id', user.id)
        .single();

      console.log('📊 Profile query result:', { profile, profileError });

      let finalRole: UserRole = 'customer';
      let debugData: any = {
        userId: user.id,
        userEmail: user.email,
        profileData: profile,
        profileError: profileError,
        timestamp: new Date().toISOString()
      };

      if (profileError) {
        console.log('❌ Profile error:', profileError);
        
        // If no profile exists, try to create one
        if (profileError.code === 'PGRST116') {
          console.log('🆕 No profile found, creating default profile...');
          
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              id: user.id,
              first_name: user.user_metadata?.first_name || 'User',
              last_name: user.user_metadata?.last_name || '',
              user_role: 'customer'
            })
            .select('user_role')
            .single();

          if (createError) {
            console.log('❌ Failed to create profile:', createError);
            debugData.createError = createError;
          } else {
            console.log('✅ Created new profile:', newProfile);
            finalRole = newProfile?.user_role as UserRole || 'customer';
            debugData.newProfile = newProfile;
          }
        } else {
          debugData.unexpectedError = profileError;
        }
      } else {
        console.log('✅ Profile found:', profile);
        finalRole = profile?.user_role as UserRole || 'customer';
      }

      console.log('🎯 Final role determined:', finalRole);
      
      setRole(finalRole);
      setDebugInfo(debugData);
      
    } catch (err) {
      console.error('💥 Unexpected error fetching user role:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user role');
      setRole('customer'); // Default fallback
      setDebugInfo({ 
        unexpectedError: err,
        fallbackRole: 'customer',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
    refetchRole: fetchUserRole,
    debugInfo,
  };
}
