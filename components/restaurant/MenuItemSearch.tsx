'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import {
  Search,
  Utensils,
  Star,
  DollarSign,
  Leaf,
  Heart,
  Shield,
  MapPin,
  Filter,
  X,
  Clock,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MENU_CATEGORIES, DIETARY_RESTRICTIONS } from '@/lib/constants';

interface MenuItemSearchProps {
  onMenuItemSelect?: (menuItemId: string, restaurantId: string) => void;
  className?: string;
}

interface MenuItemResult {
  id: string;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  image_url?: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  dietary_restrictions: string[];
  allergens: string[];
  restaurant: {
    id: string;
    name: string;
    cuisine_type?: string;
    city?: string;
    state?: string;
    average_rating?: number;
  };
  average_rating?: number;
  rating_count?: number;
}

interface MenuSearchFilters {
  searchQuery: string;
  category: string;
  priceMin?: number;
  priceMax?: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  dietaryRestrictions: string[];
  sortBy: 'relevance' | 'price' | 'rating' | 'name';
}

export function MenuItemSearch({ onMenuItemSelect, className }: MenuItemSearchProps) {
  const [filters, setFilters] = useState<MenuSearchFilters>({
    searchQuery: '',
    category: '',
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    dietaryRestrictions: [],
    sortBy: 'relevance'
  });

  const [results, setResults] = useState<MenuItemResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const searchMenuItems = useCallback(async () => {
    if (!filters.searchQuery.trim()) {
      setResults([]);
      setTotalCount(0);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('menu_items')
        .select(`
          id,
          name,
          description,
          price,
          category,
          image_url,
          is_vegetarian,
          is_vegan,
          is_gluten_free,
          dietary_restrictions,
          allergens,
          restaurants!inner (
            id,
            name,
            cuisine_type,
            city,
            state
          )
        `);

      // Text search
      const searchTerm = filters.searchQuery.trim();
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

      // Category filter
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      // Price filters
      if (filters.priceMin !== undefined) {
        query = query.gte('price', filters.priceMin);
      }
      if (filters.priceMax !== undefined) {
        query = query.lte('price', filters.priceMax);
      }

      // Dietary filters
      if (filters.isVegetarian) {
        query = query.eq('is_vegetarian', true);
      }
      if (filters.isVegan) {
        query = query.eq('is_vegan', true);
      }
      if (filters.isGlutenFree) {
        query = query.eq('is_gluten_free', true);
      }
      if (filters.dietaryRestrictions.length > 0) {
        query = query.contains('dietary_restrictions', filters.dietaryRestrictions);
      }

      // Sorting
      switch (filters.sortBy) {
        case 'price':
          query = query.order('price', { ascending: true });
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error, count } = await query.limit(20);

      if (error) throw error;

      // Get ratings for menu items
      const menuItemIds = data?.map(item => item.id) || [];
      const ratingsData = await Promise.all(
        menuItemIds.map(async (itemId) => {
          const { data: ratings } = await supabase
            .from('ratings')
            .select('rating')
            .eq('menu_item_id', itemId);

          const avgRating = ratings && ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

          return { itemId, avgRating, count: ratings?.length || 0 };
        })
      );

      // Combine data with ratings
      const enhancedResults = data?.map(item => {
        const ratingData = ratingsData.find(r => r.itemId === item.id);
        return {
          ...item,
          restaurant: Array.isArray(item.restaurants) ? item.restaurants[0] : item.restaurants,
          average_rating: ratingData?.avgRating || 0,
          rating_count: ratingData?.count || 0
        };
      }) || [];

      setResults(enhancedResults);
      setTotalCount(count || enhancedResults.length);
    } catch (error) {
      console.error('Error searching menu items:', error);
      setResults([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchMenuItems();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchMenuItems]);

  const updateFilters = (newFilters: Partial<MenuSearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      category: '',
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      dietaryRestrictions: [],
      sortBy: 'relevance'
    });
  };

  const hasActiveFilters = () => {
    return filters.category ||
           filters.priceMin !== undefined ||
           filters.priceMax !== undefined ||
           filters.isVegetarian ||
           filters.isVegan ||
           filters.isGlutenFree ||
           filters.dietaryRestrictions.length > 0;
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Search Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Search Menu Items
        </h2>
        <p className="text-gray-600">
          Find specific dishes across all restaurants
        </p>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search for dishes, ingredients, or menu items..."
              value={filters.searchQuery}
              onChange={(e) => updateFilters({ searchQuery: e.target.value })}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-4",
              hasActiveFilters() && "border-blue-500 text-blue-600"
            )}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {showFilters ? <ChevronDown className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border-t border-gray-200 pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => updateFilters({ category: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {MENU_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.priceMin || ''}
                    onChange={(e) => updateFilters({ 
                      priceMin: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.priceMax || ''}
                    onChange={(e) => updateFilters({ 
                      priceMax: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilters({ sortBy: e.target.value as any })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="price">Price (Low to High)</option>
                  <option value="rating">Highest Rated</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Dietary Restrictions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Dietary Preferences
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateFilters({ isVegetarian: !filters.isVegetarian })}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm transition-colors flex items-center gap-1",
                    filters.isVegetarian
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  <Leaf className="h-3 w-3" />
                  Vegetarian
                </button>
                <button
                  onClick={() => updateFilters({ isVegan: !filters.isVegan })}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm transition-colors flex items-center gap-1",
                    filters.isVegan
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  <Heart className="h-3 w-3" />
                  Vegan
                </button>
                <button
                  onClick={() => updateFilters({ isGlutenFree: !filters.isGlutenFree })}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm transition-colors flex items-center gap-1",
                    filters.isGlutenFree
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  <Shield className="h-3 w-3" />
                  Gluten-Free
                </button>
              </div>
            </div>

            {hasActiveFilters() && (
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <Button variant="ghost" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Results Summary */}
        {(results.length > 0 || loading) && filters.searchQuery && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {loading ? 'Searching...' : `${totalCount} menu item${totalCount !== 1 ? 's' : ''} found`}
              </span>
              {filters.searchQuery && (
                <span>for "{filters.searchQuery}"</span>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Results */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((item) => (
            <Card 
              key={item.id} 
              className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onMenuItemSelect?.(item.id, item.restaurant.id)}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <img
                    src={item.image_url || '/placeholder-food.jpg'}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">
                    {highlightText(item.name, filters.searchQuery)}
                  </h3>
                  
                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                      {highlightText(item.description, filters.searchQuery)}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <Utensils className="h-3 w-3" />
                    <span>{item.restaurant.name}</span>
                    {item.restaurant.cuisine_type && (
                      <span>• {item.restaurant.cuisine_type}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      {item.category && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {item.category}
                        </span>
                      )}
                      
                      {item.is_vegetarian && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                          <Leaf className="h-2 w-2" />
                          Veg
                        </span>
                      )}
                      
                      {item.is_vegan && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                          <Heart className="h-2 w-2" />
                          Vegan
                        </span>
                      )}
                      
                      {item.is_gluten_free && (
                        <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full flex items-center gap-1">
                          <Shield className="h-2 w-2" />
                          GF
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      {item.price && (
                        <div className="font-semibold text-gray-900">
                          ${item.price.toFixed(2)}
                        </div>
                      )}
                      
                      {(item.average_rating ?? 0) > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          {(item.average_rating ?? 0).toFixed(1)}
                          {(item.rating_count ?? 0) > 0 && (
                            <span>({item.rating_count})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && filters.searchQuery && results.length === 0 && (
        <Card className="p-8 text-center">
          <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No menu items found
          </h3>
          <p className="text-gray-600">
            Try different search terms or adjust your filters.
          </p>
        </Card>
      )}

      {!filters.searchQuery && !loading && (
        <Card className="p-8 text-center">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Search Menu Items
          </h3>
          <p className="text-gray-600">
            Start typing to search for specific dishes across all restaurants.
          </p>
        </Card>
      )}
    </div>
  );
}
