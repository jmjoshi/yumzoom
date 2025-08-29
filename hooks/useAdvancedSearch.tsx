'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  AdvancedSearchFilters,
  SearchState,
  RestaurantSearchResult,
  MenuItemSearchResult,
  EnhancedRestaurant,
  EnhancedMenuItem,
  SearchSuggestion,
  FilterCounts,
  SearchAnalytics,
  DEFAULT_SEARCH_FILTERS,
  SearchError
} from '@/types/search';

interface UseAdvancedSearchResult {
  searchState: SearchState;
  search: (filters: Partial<AdvancedSearchFilters>) => Promise<void>;
  loadMore: () => Promise<void>;
  getSuggestions: (query: string) => Promise<SearchSuggestion[]>;
  getFilterCounts: (baseFilters: Partial<AdvancedSearchFilters>) => Promise<FilterCounts>;
  clearSearch: () => void;
  updateFilters: (filters: Partial<AdvancedSearchFilters>) => void;
  getCurrentLocation: () => Promise<{ latitude: number; longitude: number } | null>;
}

export function useAdvancedSearch(): UseAdvancedSearchResult {
  const [searchState, setSearchState] = useState<SearchState>({
    filters: DEFAULT_SEARCH_FILTERS,
    results: [],
    loading: false,
    error: null,
    totalCount: 0,
    suggestions: [],
    filterCounts: {
      cuisineTypes: {},
      priceRanges: {},
      dietaryRestrictions: {},
      features: {},
      tags: {},
      menuCategories: {}
    },
    searchTime: 0,
    hasMore: false,
  });

  const abortController = useRef<AbortController | null>(null);
  const searchCache = useRef<Map<string, any>>(new Map());

  const logSearchAnalytics = useCallback(async (analytics: SearchAnalytics) => {
    try {
      await supabase.from('search_analytics').insert({
        search_query: analytics.searchQuery,
        filters: analytics.filters,
        results_count: analytics.resultsCount,
        user_id: (await supabase.auth.getUser()).data.user?.id || null,
      });
    } catch (error) {
      console.warn('Failed to log search analytics:', error);
    }
  }, []);

  const buildSearchQuery = useCallback((filters: AdvancedSearchFilters) => {
    let query = supabase.from('restaurant_search_view').select(`
      id,
      name,
      description,
      address,
      city,
      state,
      cuisine_type,
      image_url,
      latitude,
      longitude,
      tags,
      features,
      price_range_category,
      average_rating,
      review_count,
      average_price,
      menu_item_count,
      has_vegetarian_options,
      has_vegan_options,
      has_gluten_free_options,
      created_at,
      updated_at
    `);

    // Text search
    if (filters.searchQuery.trim()) {
      const searchTerm = filters.searchQuery.trim();
      query = query.textSearch('search_vector', searchTerm);
    }

    // Cuisine filter
    if (filters.cuisineType && filters.cuisineType !== 'All Cuisines') {
      query = query.eq('cuisine_type', filters.cuisineType);
    }

    // Rating filter
    if (filters.minRating > 0) {
      query = query.gte('average_rating', filters.minRating);
    }

    // Price range filter
    if (filters.priceRange) {
      query = query.eq('price_range_category', filters.priceRange);
    }

    // Location filters
    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    if (filters.state) {
      query = query.ilike('state', `%${filters.state}%`);
    }
    if (filters.location && !filters.city && !filters.state) {
      query = query.or(`address.ilike.%${filters.location}%,city.ilike.%${filters.location}%`);
    }

    // Dietary restrictions
    if (filters.isVegetarian) {
      query = query.eq('has_vegetarian_options', true);
    }
    if (filters.isVegan) {
      query = query.eq('has_vegan_options', true);
    }
    if (filters.isGlutenfree) {
      query = query.eq('has_gluten_free_options', true);
    }

    // Features and tags
    if (filters.features && filters.features.length > 0) {
      query = query.contains('features', filters.features);
    }
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    return query;
  }, []);

  const searchMenuItems = useCallback(async (filters: AdvancedSearchFilters) => {
    let query = supabase.from('menu_items').select(`
      id,
      restaurant_id,
      name,
      description,
      price,
      category,
      image_url,
      dietary_restrictions,
      is_vegetarian,
      is_vegan,
      is_gluten_free,
      allergens,
      created_at,
      updated_at,
      restaurants!inner (
        id,
        name,
        cuisine_type,
        city,
        state,
        latitude,
        longitude,
        image_url
      )
    `);

    // Text search in menu items
    if (filters.searchQuery.trim()) {
      const searchTerm = filters.searchQuery.trim();
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    // Category filter
    if (filters.menuCategory) {
      query = query.eq('category', filters.menuCategory);
    }

    // Price range for menu items
    if (filters.menuPriceMin !== undefined) {
      query = query.gte('price', filters.menuPriceMin);
    }
    if (filters.menuPriceMax !== undefined) {
      query = query.lte('price', filters.menuPriceMax);
    }

    // Dietary restrictions
    if (filters.isVegetarian) {
      query = query.eq('is_vegetarian', true);
    }
    if (filters.isVegan) {
      query = query.eq('is_vegan', true);
    }
    if (filters.isGlutenfree) {
      query = query.eq('is_gluten_free', true);
    }
    if (filters.dietaryRestrictions && filters.dietaryRestrictions.length > 0) {
      query = query.contains('dietary_restrictions', filters.dietaryRestrictions);
    }

    return query;
  }, []);

  const search = useCallback(async (newFilters: Partial<AdvancedSearchFilters>) => {
    // Cancel previous search
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    const filters = { ...searchState.filters, ...newFilters };
    const startTime = Date.now();

    setSearchState(prev => ({
      ...prev,
      filters,
      loading: true,
      error: null,
      results: newFilters.page === 1 ? [] : prev.results,
    }));

    try {
      const results: (RestaurantSearchResult | MenuItemSearchResult)[] = [];

      // Search restaurants if needed
      if (filters.searchType === 'restaurants' || filters.searchType === 'both') {
        const restaurantQuery = buildSearchQuery(filters);
        
        // Apply sorting
        if (filters.sortBy === 'rating') {
          restaurantQuery.order('average_rating', { ascending: filters.sortOrder === 'asc' });
        } else if (filters.sortBy === 'price') {
          restaurantQuery.order('average_price', { ascending: filters.sortOrder === 'asc' });
        } else if (filters.sortBy === 'name') {
          restaurantQuery.order('name', { ascending: filters.sortOrder === 'asc' });
        } else if (filters.sortBy === 'newest') {
          restaurantQuery.order('created_at', { ascending: filters.sortOrder === 'asc' });
        }

        // Apply pagination for restaurants
        const offset = (filters.page - 1) * filters.limit;
        restaurantQuery.range(offset, offset + filters.limit - 1);

        const { data: restaurantData, error: restaurantError, count: restaurantCount } = 
          await restaurantQuery;

        if (restaurantError) throw restaurantError;

        // Convert to search results
        restaurantData?.forEach(restaurant => {
          results.push({
            type: 'restaurant',
            id: restaurant.id,
            restaurant: {
              id: restaurant.id,
              name: restaurant.name,
              description: restaurant.description,
              address: restaurant.address,
              city: restaurant.city,
              state: restaurant.state,
              cuisineType: restaurant.cuisine_type,
              imageUrl: restaurant.image_url,
              latitude: restaurant.latitude,
              longitude: restaurant.longitude,
              averageRating: restaurant.average_rating || 0,
              reviewCount: restaurant.review_count || 0,
              averagePrice: restaurant.average_price || 0,
              menuItemCount: restaurant.menu_item_count || 0,
              priceRangeCategory: restaurant.price_range_category,
              tags: restaurant.tags || [],
              features: restaurant.features || [],
              hasVegetarianOptions: restaurant.has_vegetarian_options || false,
              hasVeganOptions: restaurant.has_vegan_options || false,
              hasGlutenFreeOptions: restaurant.has_gluten_free_options || false,
              createdAt: restaurant.created_at,
              updatedAt: restaurant.updated_at,
            } as EnhancedRestaurant
          } as RestaurantSearchResult);
        });
      }

      // Search menu items if needed
      if (filters.searchType === 'menu_items' || filters.searchType === 'both') {
        let menuQuery = supabase.from('menu_items').select(`
          id,
          restaurant_id,
          name,
          description,
          price,
          category,
          image_url,
          dietary_restrictions,
          is_vegetarian,
          is_vegan,
          is_gluten_free,
          allergens,
          created_at,
          updated_at,
          restaurants!inner (
            id,
            name,
            cuisine_type,
            city,
            state,
            latitude,
            longitude,
            image_url
          )
        `);

        // Apply filters for menu items
        if (filters.searchQuery.trim()) {
          const searchTerm = filters.searchQuery.trim();
          menuQuery = menuQuery.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }

        if (filters.menuCategory) {
          menuQuery = menuQuery.eq('category', filters.menuCategory);
        }

        if (filters.menuPriceMin !== undefined) {
          menuQuery = menuQuery.gte('price', filters.menuPriceMin);
        }
        if (filters.menuPriceMax !== undefined) {
          menuQuery = menuQuery.lte('price', filters.menuPriceMax);
        }

        if (filters.isVegetarian) {
          menuQuery = menuQuery.eq('is_vegetarian', true);
        }
        if (filters.isVegan) {
          menuQuery = menuQuery.eq('is_vegan', true);
        }
        if (filters.isGlutenfree) {
          menuQuery = menuQuery.eq('is_gluten_free', true);
        }
        if (filters.dietaryRestrictions && filters.dietaryRestrictions.length > 0) {
          menuQuery = menuQuery.contains('dietary_restrictions', filters.dietaryRestrictions);
        }
        
        // Apply sorting for menu items
        if (filters.sortBy === 'price') {
          menuQuery = menuQuery.order('price', { ascending: filters.sortOrder === 'asc' });
        } else if (filters.sortBy === 'name') {
          menuQuery = menuQuery.order('name', { ascending: filters.sortOrder === 'asc' });
        } else {
          menuQuery = menuQuery.order('created_at', { ascending: filters.sortOrder === 'asc' });
        }

        // Apply pagination for menu items
        const offset = (filters.page - 1) * filters.limit;
        menuQuery = menuQuery.range(offset, offset + filters.limit - 1);

        const { data: menuData, error: menuError } = await menuQuery;

        if (menuError) throw menuError;

        // Convert to search results
        menuData?.forEach(item => {
          const restaurant = item.restaurants as any;
          results.push({
            type: 'menu_item',
            id: item.id,
            menuItem: {
              id: item.id,
              restaurantId: item.restaurant_id,
              name: item.name,
              description: item.description,
              price: item.price,
              category: item.category,
              imageUrl: item.image_url,
              dietaryRestrictions: item.dietary_restrictions || [],
              isVegetarian: item.is_vegetarian || false,
              isVegan: item.is_vegan || false,
              isGlutenFree: item.is_gluten_free || false,
              allergens: item.allergens || [],
              createdAt: item.created_at,
              updatedAt: item.updated_at,
            } as EnhancedMenuItem,
            restaurant: {
              id: restaurant.id,
              name: restaurant.name,
              cuisineType: restaurant.cuisine_type,
              city: restaurant.city,
              state: restaurant.state,
              latitude: restaurant.latitude,
              longitude: restaurant.longitude,
              imageUrl: restaurant.image_url,
              averageRating: 0,
              reviewCount: 0,
              averagePrice: 0,
              menuItemCount: 0,
              tags: [],
              features: [],
              hasVegetarianOptions: false,
              hasVeganOptions: false,
              hasGlutenFreeOptions: false,
              createdAt: restaurant.created_at || '',
              updatedAt: restaurant.updated_at || '',
            } as EnhancedRestaurant
          } as MenuItemSearchResult);
        });
      }

      const searchTime = Date.now() - startTime;

      // Log analytics
      if (filters.searchQuery.trim()) {
        await logSearchAnalytics({
          searchQuery: filters.searchQuery,
          filters,
          resultsCount: results.length,
          searchTime,
        });
      }

      setSearchState(prev => ({
        ...prev,
        results: newFilters.page === 1 ? results : [...prev.results, ...results],
        loading: false,
        totalCount: results.length,
        searchTime,
        hasMore: results.length === filters.limit,
      }));

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Search error:', error);
        setSearchState(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Search failed',
        }));
      }
    }
  }, [searchState.filters, buildSearchQuery, searchMenuItems, logSearchAnalytics]);

  const loadMore = useCallback(async () => {
    if (searchState.hasMore && !searchState.loading) {
      await search({ page: searchState.filters.page + 1 });
    }
  }, [search, searchState.hasMore, searchState.loading, searchState.filters.page]);

  const getSuggestions = useCallback(async (query: string): Promise<SearchSuggestion[]> => {
    if (!query.trim()) return [];

    try {
      const suggestions: SearchSuggestion[] = [];

      // Get restaurant name suggestions
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('name, cuisine_type')
        .ilike('name', `%${query}%`)
        .limit(3);

      restaurants?.forEach(r => {
        suggestions.push({
          type: 'restaurant',
          text: r.name,
          category: r.cuisine_type
        });
      });

      // Get menu item suggestions
      const { data: menuItems } = await supabase
        .from('menu_items')
        .select('name, category')
        .ilike('name', `%${query}%`)
        .limit(3);

      menuItems?.forEach(m => {
        suggestions.push({
          type: 'menu_item',
          text: m.name,
          category: m.category
        });
      });

      // Get cuisine suggestions
      const { data: cuisines } = await supabase
        .from('restaurants')
        .select('cuisine_type')
        .ilike('cuisine_type', `%${query}%`)
        .limit(2);

      cuisines?.forEach(c => {
        if (c.cuisine_type) {
          suggestions.push({
            type: 'cuisine',
            text: c.cuisine_type
          });
        }
      });

      return suggestions;
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }, []);

  const getFilterCounts = useCallback(async (baseFilters: Partial<AdvancedSearchFilters>): Promise<FilterCounts> => {
    try {
      // This would typically be implemented with aggregation queries
      // For now, return empty counts
      return {
        cuisineTypes: {},
        priceRanges: {},
        dietaryRestrictions: {},
        features: {},
        tags: {},
        menuCategories: {}
      };
    } catch (error) {
      console.error('Failed to get filter counts:', error);
      return {
        cuisineTypes: {},
        priceRanges: {},
        dietaryRestrictions: {},
        features: {},
        tags: {},
        menuCategories: {}
      };
    }
  }, []);

  const getCurrentLocation = useCallback((): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Failed to get location:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }, []);

  const clearSearch = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      filters: DEFAULT_SEARCH_FILTERS,
      results: [],
      error: null,
      totalCount: 0,
      searchTime: 0,
      hasMore: false,
    }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<AdvancedSearchFilters>) => {
    setSearchState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters, page: 1 },
    }));
  }, []);

  // Auto-search when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchState.filters.searchQuery.trim() || 
          searchState.filters.cuisineType !== 'All Cuisines' ||
          searchState.filters.priceRange ||
          searchState.filters.minRating > 0 ||
          searchState.filters.location.trim()) {
        search({});
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchState.filters, search]);

  return {
    searchState,
    search,
    loadMore,
    getSuggestions,
    getFilterCounts,
    clearSearch,
    updateFilters,
    getCurrentLocation,
  };
}
