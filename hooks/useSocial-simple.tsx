import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface SimpleSocialReturn {
  loading: boolean;
  error: string | null;
  connections: any[];
  socialStats: {
    connectionsCount: number;
    recommendationsCount: number;
    collaborationsCount: number;
    activitiesCount: number;
  };
  fetchSocialData: () => Promise<void>;
}

export function useSimpleSocial(): SimpleSocialReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [socialStats, setSocialStats] = useState({
    connectionsCount: 0,
    recommendationsCount: 0,
    collaborationsCount: 0,
    activitiesCount: 0
  });

  const fetchSocialData = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      // Fetch connections count only (avoid relationship issues)
      const { count: connectionsCount } = await supabase
        .from('family_connections')
        .select('*', { count: 'exact', head: true })
        .or(`follower_user_id.eq.${user.id},following_user_id.eq.${user.id}`)
        .eq('status', 'accepted');

      // Fetch recommendations count
      const { count: recommendationsCount } = await supabase
        .from('friend_recommendations')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_user_id', user.id);

      // Fetch collaborations count (avoid RLS issues by keeping it simple)
      const { count: collaborationsCount } = await supabase
        .from('family_collaboration_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('created_by_user_id', user.id);

      // Fetch activities count
      const { count: activitiesCount } = await supabase
        .from('user_activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setSocialStats({
        connectionsCount: connectionsCount || 0,
        recommendationsCount: recommendationsCount || 0,
        collaborationsCount: collaborationsCount || 0,
        activitiesCount: activitiesCount || 0
      });

      // For now, just set empty connections to avoid relationship errors
      setConnections([]);

    } catch (err: any) {
      console.error('Social data fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSocialData();
  }, [fetchSocialData]);

  return {
    loading,
    error,
    connections,
    socialStats,
    fetchSocialData
  };
}
