import { DIETARY_RESTRICTIONS, CUISINE_TYPES, MENU_CATEGORIES } from '@/lib/constants';

export interface AdvancedSearchFilters {
  // Basic search
  searchQuery: string;
  searchType: 'restaurants' | 'menu_items' | 'both';
  
  // Restaurant filters
  cuisineType: string;
  priceRange: string;
  minRating: number;
  
  // Location filters
  location: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // in miles
  city?: string;
  state?: string;
  
  // Dietary restrictions
  dietaryRestrictions: string[];
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenfree?: boolean;
  allergens?: string[];
  
  // Menu item specific filters
  menuCategory?: string;
  menuPriceMin?: number;
  menuPriceMax?: number;
  
  // Restaurant features
  features?: string[];
  tags?: string[];
  
  // Sorting and pagination
  sortBy: 'relevance' | 'rating' | 'price' | 'distance' | 'name' | 'newest';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface SearchResult {
  type: 'restaurant' | 'menu_item';
  id: string;
  relevanceScore?: number;
  distance?: number;
}

export interface RestaurantSearchResult extends SearchResult {
  type: 'restaurant';
  restaurant: EnhancedRestaurant;
  matchedMenuItems?: MenuItemSearchResult[];
  highlightedText?: string[];
}

export interface MenuItemSearchResult extends SearchResult {
  type: 'menu_item';
  menuItem: EnhancedMenuItem;
  restaurant: EnhancedRestaurant;
  highlightedText?: string[];
}

export interface EnhancedRestaurant {
  id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  website?: string;
  cuisineType?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  
  // Aggregated data
  averageRating: number;
  reviewCount: number;
  averagePrice: number;
  menuItemCount: number;
  priceRangeCategory?: '$' | '$$' | '$$$' | '$$$$';
  
  // Advanced features
  tags: string[];
  features: string[];
  hasVegetarianOptions: boolean;
  hasVeganOptions: boolean;
  hasGlutenFreeOptions: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface EnhancedMenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  imageUrl?: string;
  
  // Dietary information
  dietaryRestrictions: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  allergens: string[];
  
  // Aggregated data
  averageRating?: number;
  ratingCount?: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface SearchSuggestion {
  type: 'restaurant' | 'menu_item' | 'cuisine' | 'location';
  text: string;
  count?: number;
  category?: string;
}

export interface SearchAnalytics {
  searchQuery: string;
  filters: Partial<AdvancedSearchFilters>;
  resultsCount: number;
  searchTime: number; // in milliseconds
  userId?: string;
}

export interface LocationSuggestion {
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  type: 'city' | 'neighborhood' | 'landmark';
}

export interface FilterCounts {
  cuisineTypes: Record<string, number>;
  priceRanges: Record<string, number>;
  dietaryRestrictions: Record<string, number>;
  features: Record<string, number>;
  tags: Record<string, number>;
  menuCategories: Record<string, number>;
}

export interface SearchState {
  filters: AdvancedSearchFilters;
  results: (RestaurantSearchResult | MenuItemSearchResult)[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  suggestions: SearchSuggestion[];
  filterCounts: FilterCounts;
  searchTime: number;
  hasMore: boolean;
}

// Constants for search functionality
export const DEFAULT_SEARCH_FILTERS: AdvancedSearchFilters = {
  searchQuery: '',
  searchType: 'both',
  cuisineType: 'All Cuisines',
  priceRange: '',
  minRating: 0,
  location: '',
  dietaryRestrictions: [],
  sortBy: 'relevance',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
};

export const SEARCH_TYPES = [
  { value: 'restaurants', label: 'Restaurants Only' },
  { value: 'menu_items', label: 'Menu Items Only' },
  { value: 'both', label: 'Restaurants & Menu Items' },
] as const;

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price', label: 'Price' },
  { value: 'distance', label: 'Distance' },
  { value: 'name', label: 'Name' },
  { value: 'newest', label: 'Newest' },
] as const;

export const PRICE_RANGES = [
  { value: '', label: 'All Prices' },
  { value: '$', label: '$ (Under $15)', min: 0, max: 15 },
  { value: '$$', label: '$$ ($15-30)', min: 15, max: 30 },
  { value: '$$$', label: '$$$ ($30-50)', min: 30, max: 50 },
  { value: '$$$$', label: '$$$$ (Over $50)', min: 50, max: 999 },
] as const;

export const DISTANCE_OPTIONS = [
  { value: 1, label: 'Within 1 mile' },
  { value: 5, label: 'Within 5 miles' },
  { value: 10, label: 'Within 10 miles' },
  { value: 25, label: 'Within 25 miles' },
  { value: 50, label: 'Within 50 miles' },
] as const;

export const RATING_FILTERS = [
  { value: 0, label: 'All Ratings' },
  { value: 3, label: '3+ Stars' },
  { value: 4, label: '4+ Stars' },
  { value: 4.5, label: '4.5+ Stars' },
  { value: 5, label: '5 Stars Only' },
] as const;

// Utility type for search result highlighting
export interface HighlightedText {
  text: string;
  highlighted: boolean;
}

// Error types for search
export interface SearchError {
  code: 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'LOCATION_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  details?: any;
}

// Search performance tracking
export interface SearchPerformance {
  searchId: string;
  query: string;
  filters: Partial<AdvancedSearchFilters>;
  resultsCount: number;
  searchTimeMs: number;
  cacheHit: boolean;
  userId?: string;
  timestamp: Date;
}

export type SearchFilterKey = keyof AdvancedSearchFilters;
export type SearchResultType = RestaurantSearchResult | MenuItemSearchResult;
