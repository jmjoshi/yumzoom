// Role-based access control utilities and types

export type UserRole = 'customer' | 'restaurant_owner' | 'business_partner' | 'admin';

export interface UserPermissions {
  // Navigation permissions
  canAccessAdmin: boolean;
  canAccessRestaurantManagement: boolean;
  canAccessBusinessDashboard: boolean;
  canAccessSystemAnalytics: boolean;
  canAccessUserManagement: boolean;
  
  // Content permissions
  canModerateContent: boolean;
  canManageRestaurants: boolean;
  canManageUsers: boolean;
  canViewAllAnalytics: boolean;
  canAccessAPIManagement: boolean;
  
  // Feature permissions
  canRateRestaurants: boolean;
  canWriteReviews: boolean;
  canManageFamily: boolean;
  canAccessSocial: boolean;
  canAccessGamification: boolean;
}

// Role hierarchy and permissions matrix
export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  customer: {
    // Navigation permissions
    canAccessAdmin: false,
    canAccessRestaurantManagement: false,
    canAccessBusinessDashboard: false,
    canAccessSystemAnalytics: false,
    canAccessUserManagement: false,
    
    // Content permissions
    canModerateContent: false,
    canManageRestaurants: false,
    canManageUsers: false,
    canViewAllAnalytics: false,
    canAccessAPIManagement: false,
    
    // Feature permissions
    canRateRestaurants: true,
    canWriteReviews: true,
    canManageFamily: true,
    canAccessSocial: true,
    canAccessGamification: true,
  },
  
  restaurant_owner: {
    // Navigation permissions
    canAccessAdmin: false,
    canAccessRestaurantManagement: true, // Own restaurants only
    canAccessBusinessDashboard: false,
    canAccessSystemAnalytics: false,
    canAccessUserManagement: false,
    
    // Content permissions
    canModerateContent: false,
    canManageRestaurants: true, // Own restaurants only
    canManageUsers: false,
    canViewAllAnalytics: false,
    canAccessAPIManagement: false,
    
    // Feature permissions (inherits customer permissions)
    canRateRestaurants: true,
    canWriteReviews: true,
    canManageFamily: true,
    canAccessSocial: true,
    canAccessGamification: true,
  },
  
  business_partner: {
    // Navigation permissions
    canAccessAdmin: false,
    canAccessRestaurantManagement: false,
    canAccessBusinessDashboard: true,
    canAccessSystemAnalytics: true, // Aggregated data only
    canAccessUserManagement: false,
    
    // Content permissions
    canModerateContent: false,
    canManageRestaurants: false,
    canManageUsers: false,
    canViewAllAnalytics: true, // Aggregated/anonymized data
    canAccessAPIManagement: true,
    
    // Feature permissions (inherits customer permissions)
    canRateRestaurants: true,
    canWriteReviews: true,
    canManageFamily: true,
    canAccessSocial: true,
    canAccessGamification: true,
  },
  
  admin: {
    // Navigation permissions (full access)
    canAccessAdmin: true,
    canAccessRestaurantManagement: true,
    canAccessBusinessDashboard: true,
    canAccessSystemAnalytics: true,
    canAccessUserManagement: true,
    
    // Content permissions (full access)
    canModerateContent: true,
    canManageRestaurants: true,
    canManageUsers: true,
    canViewAllAnalytics: true,
    canAccessAPIManagement: true,
    
    // Feature permissions (full access)
    canRateRestaurants: true,
    canWriteReviews: true,
    canManageFamily: true,
    canAccessSocial: true,
    canAccessGamification: true,
  },
};

// Navigation items based on roles
export interface NavItem {
  name: string;
  href: string;
  requiredPermission?: keyof UserPermissions;
  roles?: UserRole[];
}

export const NAVIGATION_ITEMS: NavItem[] = [
  { name: 'Home', href: '/' },
  { name: 'Restaurants', href: '/restaurants' },
  { name: 'Advanced Search', href: '/search' },
  { name: 'Dashboard', href: '/dashboard' }, // Personal dashboard for all authenticated users
  { name: 'Family', href: '/family' },
  { name: 'Social', href: '/social' },
  { name: 'Analytics', href: '/analytics' }, // Personal analytics for customers, own restaurant analytics for owners
  { 
    name: 'Restaurant Owner', 
    href: '/restaurant-owner', 
    requiredPermission: 'canAccessRestaurantManagement',
    roles: ['restaurant_owner', 'admin']
  },
  { 
    name: 'Restaurant Analytics', 
    href: '/restaurant-analytics', 
    requiredPermission: 'canAccessRestaurantManagement',
    roles: ['restaurant_owner', 'admin']
  },
  { 
    name: 'Business Dashboard', 
    href: '/business-dashboard', 
    requiredPermission: 'canAccessBusinessDashboard',
    roles: ['business_partner', 'admin']
  },
  { 
    name: 'Admin', 
    href: '/admin', 
    requiredPermission: 'canAccessAdmin',
    roles: ['admin']
  },
];

export const USER_MENU_ITEMS: NavItem[] = [
  { name: 'Profile', href: '/profile' },
  { name: 'Gamification', href: '/gamification' },
  { name: 'Favorites', href: '/favorites' },
  { name: 'Wishlist', href: '/wishlist' },
  { 
    name: 'Restaurant Owner', 
    href: '/restaurant-owner', 
    requiredPermission: 'canAccessRestaurantManagement',
    roles: ['restaurant_owner', 'admin']
  },
  { 
    name: 'Restaurant Analytics', 
    href: '/restaurant-analytics', 
    requiredPermission: 'canAccessRestaurantManagement',
    roles: ['restaurant_owner', 'admin']
  },
  { 
    name: 'Business Dashboard', 
    href: '/business-dashboard', 
    requiredPermission: 'canAccessBusinessDashboard',
    roles: ['business_partner', 'admin']
  },
  { name: 'Privacy', href: '/privacy' },
  { name: 'Settings', href: '/settings' },
];

// Utility functions
export function getUserPermissions(role: UserRole | undefined): UserPermissions {
  if (!role) {
    // Default permissions for unauthenticated users
    return ROLE_PERMISSIONS.customer;
  }
  
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.customer;
}

export function hasPermission(
  userRole: UserRole | undefined, 
  permission: keyof UserPermissions
): boolean {
  const permissions = getUserPermissions(userRole);
  return permissions[permission];
}

export function canAccessRoute(
  userRole: UserRole | undefined, 
  route: string
): boolean {
  const navItem = [...NAVIGATION_ITEMS, ...USER_MENU_ITEMS].find(item => item.href === route);
  
  if (!navItem) {
    // Route not in navigation, default to accessible
    return true;
  }
  
  if (!navItem.requiredPermission && !navItem.roles) {
    // No restrictions
    return true;
  }
  
  if (navItem.roles && userRole) {
    return navItem.roles.includes(userRole);
  }
  
  if (navItem.requiredPermission) {
    return hasPermission(userRole, navItem.requiredPermission);
  }
  
  return false;
}

export function getFilteredNavigation(userRole: UserRole | undefined): NavItem[] {
  return NAVIGATION_ITEMS.filter(item => {
    if (!item.requiredPermission && !item.roles) {
      return true;
    }
    
    if (item.roles && userRole) {
      return item.roles.includes(userRole);
    }
    
    if (item.requiredPermission) {
      return hasPermission(userRole, item.requiredPermission);
    }
    
    return false;
  });
}

export function getFilteredUserMenu(userRole: UserRole | undefined): NavItem[] {
  return USER_MENU_ITEMS.filter(item => {
    if (!item.requiredPermission && !item.roles) {
      return true;
    }
    
    if (item.roles && userRole) {
      return item.roles.includes(userRole);
    }
    
    if (item.requiredPermission) {
      return hasPermission(userRole, item.requiredPermission);
    }
    
    return false;
  });
}

// Role display names and colors
export const ROLE_DISPLAY = {
  customer: { name: 'Customer', color: 'blue', emoji: '👥' },
  restaurant_owner: { name: 'Restaurant Owner', color: 'orange', emoji: '🍕' },
  business_partner: { name: 'Business Partner', color: 'purple', emoji: '🤝' },
  admin: { name: 'Administrator', color: 'red', emoji: '🧑‍💼' },
} as const;

export function getRoleDisplay(role: UserRole | undefined) {
  return role ? ROLE_DISPLAY[role] : { name: 'Guest', color: 'gray', emoji: '👤' };
}
