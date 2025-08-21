'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Restaurant } from '@/types/restaurant';
import type { RestaurantFilters } from '@/components/restaurant/SearchFilters';

interface UseRestaurantSearchResult {
  restaurants: Restaurant[];
  loading: boolean;
  error: string | null;
  searchRestaurants: (filters: RestaurantFilters) => Promise<void>;
  totalCount: number;
}

export function useRestaurantSearch(): UseRestaurantSearchResult {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const searchRestaurants = useCallback(async (filters: RestaurantFilters) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('restaurants')
        .select(`
          *,
          menu_items (
            id,
            name,
            description,
            price,
            category,
            image_url
          )
        `);

      // Apply search query filter
      if (filters.searchQuery.trim()) {
        const searchTerm = filters.searchQuery.trim();
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,cuisine_type.ilike.%${searchTerm}%`);
      }

      // Apply cuisine type filter
      if (filters.cuisineType && filters.cuisineType !== 'All Cuisines') {
        query = query.eq('cuisine_type', filters.cuisineType);
      }

      // Apply location filter
      if (filters.location.trim()) {
        query = query.ilike('address', `%${filters.location.trim()}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      let filteredRestaurants = data || [];

      // Apply client-side filters that require calculation
      if (filters.minRating > 0 || filters.priceRange) {
        filteredRestaurants = await applyClientSideFilters(filteredRestaurants, filters);
      }

      setRestaurants(filteredRestaurants);
      setTotalCount(count || filteredRestaurants.length);
    } catch (err) {
      console.error('Error searching restaurants:', err);
      setError(err instanceof Error ? err.message : 'Failed to search restaurants');
      setRestaurants([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyClientSideFilters = async (restaurants: Restaurant[], filters: RestaurantFilters): Promise<Restaurant[]> => {
    let filtered = [...restaurants];

    // Apply rating filter
    if (filters.minRating > 0) {
      const restaurantsWithRatings = await Promise.all(
        filtered.map(async (restaurant) => {
          const { data: ratings } = await supabase
            .from('ratings')
            .select('rating')
            .eq('restaurant_id', restaurant.id);

          const avgRating = ratings && ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

          return {
            ...restaurant,
            averageRating: avgRating
          };
        })
      );

      filtered = restaurantsWithRatings.filter(restaurant => 
        restaurant.averageRating >= filters.minRating
      );
    }

    // Apply price range filter
    if (filters.priceRange) {
      const priceRanges = {
        '$': { min: 0, max: 15 },
        '$$': { min: 15, max: 30 },
        '$$$': { min: 30, max: 50 },
        '$$$$': { min: 50, max: Infinity }
      };

      const range = priceRanges[filters.priceRange as keyof typeof priceRanges];
      if (range) {
        const restaurantsWithPrices = await Promise.all(
          filtered.map(async (restaurant) => {
            const { data: menuItems } = await supabase
              .from('menu_items')
              .select('price')
              .eq('restaurant_id', restaurant.id)
              .not('price', 'is', null);

            const avgPrice = menuItems && menuItems.length > 0
              ? menuItems.reduce((sum, item) => sum + (item.price || 0), 0) / menuItems.length
              : 0;

            return {
              ...restaurant,
              averagePrice: avgPrice
            };
          })
        );

        filtered = restaurantsWithPrices.filter(restaurant => 
          restaurant.averagePrice >= range.min && restaurant.averagePrice < range.max
        );
      }
    }

    return filtered;
  };

  // Load all restaurants initially
  useEffect(() => {
    const defaultFilters: RestaurantFilters = {
      searchQuery: '',
      cuisineType: 'All Cuisines',
      priceRange: '',
      minRating: 0,
      location: ''
    };
    searchRestaurants(defaultFilters);
  }, [searchRestaurants]);

  return {
    restaurants,
    loading,
    error,
    searchRestaurants,
    totalCount
  };
}
