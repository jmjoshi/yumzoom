'use client';

import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useState } from 'react';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';

export function RoleDebugger() {
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();
  const { role, permissions, loading, error } = useUserRole();

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title="Show Role Debugger"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Role Debugger</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 text-xs">
        {/* Authentication Status */}
        <div>
          <span className="font-medium text-gray-700">Auth Status:</span>
          <span className={`ml-2 px-2 py-1 rounded ${user ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {user ? '✅ Authenticated' : '❌ Not Authenticated'}
          </span>
        </div>

        {/* User Email */}
        {user && (
          <div>
            <span className="font-medium text-gray-700">Email:</span>
            <span className="ml-2 text-gray-600">{user.email}</span>
          </div>
        )}

        {/* User ID */}
        {user && (
          <div>
            <span className="font-medium text-gray-700">User ID:</span>
            <span className="ml-2 text-gray-600 font-mono text-xs">
              {user.id.substring(0, 8)}...
            </span>
          </div>
        )}

        {/* Role Loading Status */}
        <div>
          <span className="font-medium text-gray-700">Role Loading:</span>
          <span className={`ml-2 px-2 py-1 rounded ${loading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
            {loading ? '⏳ Loading...' : '✅ Complete'}
          </span>
        </div>

        {/* Role Error */}
        {error && (
          <div>
            <span className="font-medium text-red-700">Error:</span>
            <span className="ml-2 text-red-600 text-xs">{error}</span>
          </div>
        )}

        {/* Current Role */}
        <div>
          <span className="font-medium text-gray-700">Role:</span>
          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
            role === 'admin' ? 'bg-red-100 text-red-800' :
            role === 'restaurant_owner' ? 'bg-orange-100 text-orange-800' :
            role === 'business_partner' ? 'bg-purple-100 text-purple-800' :
            role === 'customer' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {role || 'undefined'}
          </span>
        </div>

        {/* Key Permissions */}
        {!loading && (
          <div>
            <span className="font-medium text-gray-700">Key Permissions:</span>
            <div className="mt-1 space-y-1">
              <div className="flex items-center">
                <span className={`w-3 h-3 rounded-full mr-2 ${permissions.canAccessAdmin ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-xs">Admin Access</span>
              </div>
              <div className="flex items-center">
                <span className={`w-3 h-3 rounded-full mr-2 ${permissions.canAccessRestaurantManagement ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-xs">Restaurant Management</span>
              </div>
              <div className="flex items-center">
                <span className={`w-3 h-3 rounded-full mr-2 ${permissions.canAccessBusinessDashboard ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-xs">Business Dashboard</span>
              </div>
              <div className="flex items-center">
                <span className={`w-3 h-3 rounded-full mr-2 ${permissions.canModerateContent ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-xs">Content Moderation</span>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="pt-2 border-t">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-xs"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh Page</span>
          </button>
        </div>

        {/* Database Check Tip */}
        {user && role === 'customer' && user.email?.includes('admin') && (
          <div className="pt-2 border-t">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
              <p className="text-xs text-yellow-800">
                💡 <strong>Tip:</strong> If you're logged in as an admin but showing as customer, 
                you may need to run the database migration to add the user_role column.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
