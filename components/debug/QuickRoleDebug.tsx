'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/lib/supabase';

export function QuickRoleDebug() {
  const { user } = useAuth();
  const { role, loading, error } = useUserRole();
  const [manualCheck, setManualCheck] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkRoleDirectly = async () => {
    if (!user) return;
    
    setIsChecking(true);
    try {
      // Direct database query
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setManualCheck({ data, error, timestamp: new Date().toISOString() });
    } catch (err) {
      setManualCheck({ error: err, timestamp: new Date().toISOString() });
    }
    setIsChecking(false);
  };

  const clearCache = () => {
    // Force a page reload to clear any cached state
    window.location.reload();
  };

  if (!user) {
    return (
      <div className="fixed bottom-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-sm">
        <h4 className="font-bold">❌ Not Authenticated</h4>
        <p>No user found</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded max-w-md z-50">
      <h4 className="font-bold">🔍 Quick Role Debug</h4>
      
      <div className="mt-2 text-sm">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Hook Role:</strong> {loading ? 'Loading...' : role || 'undefined'}</p>
        <p><strong>Hook Error:</strong> {error || 'None'}</p>
      </div>

      <div className="mt-3 space-x-2">
        <button
          onClick={checkRoleDirectly}
          disabled={isChecking}
          className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 disabled:opacity-50"
        >
          {isChecking ? 'Checking...' : 'Check DB Directly'}
        </button>
        
        <button
          onClick={clearCache}
          className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
        >
          Force Refresh
        </button>
      </div>

      {manualCheck && (
        <div className="mt-3 text-xs bg-white p-2 rounded border">
          <p><strong>Direct DB Check:</strong></p>
          {manualCheck.error ? (
            <p className="text-red-600">Error: {JSON.stringify(manualCheck.error)}</p>
          ) : (
            <div>
              <p><strong>Role:</strong> {manualCheck.data?.user_role}</p>
              <p><strong>Name:</strong> {manualCheck.data?.first_name} {manualCheck.data?.last_name}</p>
              <p><strong>All Data:</strong> {JSON.stringify(manualCheck.data, null, 2)}</p>
            </div>
          )}
          <p className="text-gray-500 mt-1">Checked: {manualCheck.timestamp}</p>
        </div>
      )}
    </div>
  );
}
