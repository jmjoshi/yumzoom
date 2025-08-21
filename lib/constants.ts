export const APP_NAME = 'YumZoom';
export const APP_DESCRIPTION = 'Rate your dining experiences and discover great food with your family';

export const ROUTES = {
  HOME: '/',
  SIGN_IN: '/signin',
  SIGN_UP: '/signup',
  DASHBOARD: '/dashboard',
  RESTAURANTS: '/restaurants',
  FAMILY: '/family',
  ANALYTICS: '/analytics',
  SOCIAL: '/social',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  FAVORITES: '/favorites',
  WISHLIST: '/wishlist',
  PRIVACY: '/privacy',
  RESTAURANT_OWNER: '/restaurant-owner',
  ADMIN_RESTAURANTS: '/admin/restaurants',
  ADMIN_SECURITY: '/admin/security',
} as const;

export const RATING_SCALE = {
  MIN: 1,
  MAX: 10,
} as const;

export const PHONE_TYPES = {
  MOBILE: 'mobile',
  HOME: 'home',
  WORK: 'work',
} as const;

export const FAMILY_RELATIONSHIPS = [
  'Spouse',
  'Partner',
  'Child',
  'Parent',
  'Sibling',
  'Grandparent',
  'Grandchild',
  'Other',
] as const;

export const AGE_RANGES = [
  'child',
  'teen', 
  'adult',
] as const;

export const DIETARY_RESTRICTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Nut Allergy',
  'Peanut Allergy',
  'Shellfish Allergy',
  'Egg Allergy',
  'Soy Allergy',
  'Lactose Intolerant',
  'Kosher',
  'Halal',
  'Low Sodium',
  'Diabetic Friendly',
  'Keto',
  'Paleo',
  'Low Carb',
  'Heart Healthy',
] as const;

export const PRIVACY_LEVELS = [
  'public',
  'friends',
  'family',
  'private',
] as const;

export const SEVERITY_LEVELS = [
  'preference',
  'intolerance', 
  'allergy',
  'medical',
] as const;

export const DINING_OCCASIONS = [
  'Date Night',
  'Family Dinner',
  'Quick Meal',
  'Celebration',
  'Business Meeting',
  'Birthday Party',
  'Anniversary',
  'Casual Hangout',
  'Special Occasion',
  'Weekend Brunch',
] as const;

export const PRIORITY_LEVELS = [
  { value: 1, label: 'Very Low' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'High' },
  { value: 5, label: 'Very High' },
] as const;

export const RESTAURANT_TAGS = [
  'Kid-Friendly',
  'Romantic',
  'Business Casual',
  'Fine Dining',
  'Casual',
  'Outdoor Seating',
  'Good for Groups',
  'Quick Service',
  'Healthy Options',
  'Comfort Food',
  'Local Favorite',
  'Hidden Gem',
  'Date Night',
  'Family Style',
  'Takeout Friendly',
] as const;

export const CUISINE_TYPES = [
  'American',
  'Asian',
  'Chinese',
  'French',
  'Indian',
  'Italian',
  'Japanese',
  'Mediterranean',
  'Mexican',
  'Thai',
  'Other',
] as const;

export const MENU_CATEGORIES = [
  'Appetizers',
  'Salads',
  'Soups',
  'Main Courses',
  'Desserts',
  'Beverages',
  'Sides',
  'Specials',
] as const;

export const ERROR_MESSAGES = {
  INVALID_EMAIL: 'Please enter a valid email address',
  WEAK_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, and number',
  REQUIRED_FIELD: 'This field is required',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You must be logged in to access this page',
} as const;