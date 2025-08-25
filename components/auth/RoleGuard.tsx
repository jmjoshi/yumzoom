'use client';

import { ReactNode } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { UserRole, UserPermissions } from '@/lib/rbac';
import { AlertCircle, Lock, UserX } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: keyof UserPermissions;
  fallback?: ReactNode;
  showError?: boolean;
}

// Unauthorized access component
function UnauthorizedAccess({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <Lock className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {message}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Insufficient Permissions
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  You don't have the required permissions to access this page. 
                  If you believe this is an error, please contact your administrator.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <a
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

// Loading component
function RoleGuardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Checking permissions...</p>
      </div>
    </div>
  );
}

// Error component
function RoleGuardError({ error }: { error: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <UserX className="mx-auto h-16 w-16 text-orange-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Permission Check Failed
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Unable to verify your permissions
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-orange-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">
                Error Details
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

export function RoleGuard({
  children,
  allowedRoles,
  requiredPermission,
  fallback,
  showError = true
}: RoleGuardProps) {
  const { role, hasPermission, loading, error } = useUserRole();

  // Show loading state while checking permissions
  if (loading) {
    return <RoleGuardLoading />;
  }

  // Show error state if permission check failed
  if (error && showError) {
    return <RoleGuardError error={error} />;
  }

  // Check role-based access
  if (allowedRoles && role) {
    if (!allowedRoles.includes(role)) {
      if (fallback) {
        return <>{fallback}</>;
      }
      return (
        <UnauthorizedAccess 
          message={`This page is restricted to ${allowedRoles.join(', ')} users only.`}
        />
      );
    }
  }

  // Check permission-based access
  if (requiredPermission) {
    if (!hasPermission(requiredPermission)) {
      if (fallback) {
        return <>{fallback}</>;
      }
      return (
        <UnauthorizedAccess 
          message="You don't have the required permissions to access this feature."
        />
      );
    }
  }

  // User has access, render children
  return <>{children}</>;
}

// Convenience wrapper for admin-only content
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

// Convenience wrapper for restaurant owner content
export function RestaurantOwnerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['restaurant_owner', 'admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

// Convenience wrapper for business partner content
export function BusinessPartnerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['business_partner', 'admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

// Inline permission check component
interface PermissionCheckProps {
  children: ReactNode;
  permission: keyof UserPermissions;
  fallback?: ReactNode;
}

export function PermissionCheck({ children, permission, fallback }: PermissionCheckProps) {
  const { hasPermission } = useUserRole();

  if (!hasPermission(permission)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

// Role badge component
export function RoleBadge({ className = '' }: { className?: string }) {
  const { role } = useUserRole();
  
  if (!role) return null;

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'restaurant_owner': return 'bg-orange-100 text-orange-800';
      case 'business_partner': return 'bg-purple-100 text-purple-800';
      case 'customer': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplay = (role: UserRole) => {
    switch (role) {
      case 'admin': return '🧑‍💼 Admin';
      case 'restaurant_owner': return '🍕 Restaurant Owner';
      case 'business_partner': return '🤝 Business Partner';
      case 'customer': return '👥 Customer';
      default: return '👤 User';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(role)} ${className}`}>
      {getRoleDisplay(role)}
    </span>
  );
}
