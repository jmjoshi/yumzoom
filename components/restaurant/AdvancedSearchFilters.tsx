'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import {
  Search,
  Filter,
  X,
  MapPin,
  Star,
  DollarSign,
  Utensils,
  Heart,
  Leaf,
  Shield,
  Navigation,
  Settings,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import {
  AdvancedSearchFilters,
  SearchSuggestion,
  SEARCH_TYPES,
  SORT_OPTIONS,
  PRICE_RANGES,
  DISTANCE_OPTIONS,
  RATING_FILTERS
} from '@/types/search';
import { DIETARY_RESTRICTIONS, CUISINE_TYPES, MENU_CATEGORIES } from '@/lib/constants';

interface AdvancedSearchFiltersProps {
  filters: AdvancedSearchFilters;
  onFiltersChange: (filters: Partial<AdvancedSearchFilters>) => void;
  onSearch: () => void;
  suggestions: SearchSuggestion[];
  onGetSuggestions: (query: string) => Promise<void>;
  loading?: boolean;
  resultCount?: number;
  className?: string;
}

export function AdvancedSearchFiltersComponent({
  filters,
  onFiltersChange,
  onSearch,
  suggestions,
  onGetSuggestions,
  loading = false,
  resultCount = 0,
  className
}: AdvancedSearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [localQuery, setLocalQuery] = useState(filters.searchQuery);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Handle search input with suggestions
  const handleSearchInput = async (value: string) => {
    setLocalQuery(value);
    onFiltersChange({ searchQuery: value });
    
    if (value.length > 2) {
      await onGetSuggestions(value);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setLocalQuery(suggestion.text);
    onFiltersChange({ searchQuery: suggestion.text });
    setShowSuggestions(false);
    onSearch();
  };

  const handleLocationDetection = async () => {
    setGettingLocation(true);
    try {
      const position = await getCurrentLocation();
      if (position) {
        onFiltersChange({
          latitude: position.latitude,
          longitude: position.longitude,
          location: 'Current Location'
        });
      }
    } catch (error) {
      console.error('Failed to get location:', error);
    } finally {
      setGettingLocation(false);
    }
  };

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }),
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const clearFilters = () => {
    setLocalQuery('');
    onFiltersChange({
      searchQuery: '',
      searchType: 'both',
      cuisineType: 'All Cuisines',
      priceRange: '',
      minRating: 0,
      location: '',
      latitude: undefined,
      longitude: undefined,
      dietaryRestrictions: [],
      isVegetarian: false,
      isVegan: false,
      isGlutenfree: false,
      menuCategory: undefined,
      features: [],
      tags: [],
      sortBy: 'relevance',
      page: 1
    });
    setShowAdvanced(false);
  };

  const hasActiveFilters = () => {
    return filters.searchQuery ||
           filters.cuisineType !== 'All Cuisines' ||
           filters.priceRange ||
           filters.minRating > 0 ||
           filters.location ||
           filters.dietaryRestrictions.length > 0 ||
           filters.isVegetarian ||
           filters.isVegan ||
           filters.isGlutenfree ||
           filters.menuCategory ||
           (filters.features && filters.features.length > 0) ||
           (filters.tags && filters.tags.length > 0);
  };

  const activeFilterCount = () => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.cuisineType !== 'All Cuisines') count++;
    if (filters.priceRange) count++;
    if (filters.minRating > 0) count++;
    if (filters.location) count++;
    if (filters.dietaryRestrictions.length > 0) count++;
    if (filters.isVegetarian || filters.isVegan || filters.isGlutenfree) count++;
    if (filters.menuCategory) count++;
    if (filters.features && filters.features.length > 0) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    return count;
  };

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      {/* Main Search Bar */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search restaurants, dishes, or cuisines..."
              value={localQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="pl-10 pr-4"
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onBlur={() => {
                // Delay hiding to allow clicks on suggestions
                setTimeout(() => setShowSuggestions(false), 200);
              }}
            />
            
            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion.type === 'restaurant' && <Utensils className="h-4 w-4 text-blue-500" />}
                    {suggestion.type === 'menu_item' && <Heart className="h-4 w-4 text-green-500" />}
                    {suggestion.type === 'cuisine' && <Leaf className="h-4 w-4 text-orange-500" />}
                    {suggestion.type === 'location' && <MapPin className="h-4 w-4 text-red-500" />}
                    
                    <div className="flex-1">
                      <div className="font-medium">{suggestion.text}</div>
                      {suggestion.category && (
                        <div className="text-xs text-gray-500">{suggestion.category}</div>
                      )}
                    </div>
                    
                    {suggestion.count && (
                      <span className="text-xs text-gray-400">({suggestion.count})</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button 
            onClick={onSearch} 
            disabled={loading}
            className="px-6"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Search'
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              "px-4",
              hasActiveFilters() && "border-blue-500 text-blue-600"
            )}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount() > 0 && (
              <span className="ml-2 bg-blue-500 text-white rounded-full text-xs px-2 py-1">
                {activeFilterCount()}
              </span>
            )}
            {showAdvanced ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
          </Button>
        </div>

        {/* Search Type Selector */}
        <div className="flex gap-2">
          {SEARCH_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => onFiltersChange({ searchType: type.value })}
              className={cn(
                "px-3 py-1 rounded-full text-sm transition-colors",
                filters.searchType === type.value
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Results Summary */}
        {resultCount > 0 && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{resultCount} result{resultCount !== 1 ? 's' : ''} found</span>
            {filters.searchQuery && (
              <span>for "{filters.searchQuery}"</span>
            )}
          </div>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="border-t border-gray-200 pt-4 space-y-6">
          {/* Basic Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cuisine Type */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <Utensils className="h-4 w-4 mr-1" />
                Cuisine Type
              </label>
              <select
                value={filters.cuisineType}
                onChange={(e) => onFiltersChange({ cuisineType: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="All Cuisines">All Cuisines</option>
                {CUISINE_TYPES.map((cuisine) => (
                  <option key={cuisine} value={cuisine}>
                    {cuisine}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <DollarSign className="h-4 w-4 mr-1" />
                Price Range
              </label>
              <select
                value={filters.priceRange}
                onChange={(e) => onFiltersChange({ priceRange: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {PRICE_RANGES.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <Star className="h-4 w-4 mr-1" />
                Minimum Rating
              </label>
              <select
                value={filters.minRating}
                onChange={(e) => onFiltersChange({ minRating: parseFloat(e.target.value) })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {RATING_FILTERS.map((rating) => (
                  <option key={rating.value} value={rating.value}>
                    {rating.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <Settings className="h-4 w-4 mr-1" />
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => onFiltersChange({ sortBy: e.target.value as any })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location Filter */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <MapPin className="h-4 w-4 mr-1" />
              Location
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter city, address, or landmark..."
                value={filters.location}
                onChange={(e) => onFiltersChange({ location: e.target.value })}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleLocationDetection}
                disabled={gettingLocation}
                className="px-4"
              >
                {gettingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
              </Button>
            </div>
            {filters.latitude && filters.longitude && (
              <p className="text-xs text-green-600">Using your current location</p>
            )}
          </div>

          {/* Dietary Restrictions */}
          <div className="space-y-3">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Shield className="h-4 w-4 mr-1" />
              Dietary Preferences
            </label>
            
            {/* Quick Toggles */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onFiltersChange({ isVegetarian: !filters.isVegetarian })}
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
                onClick={() => onFiltersChange({ isVegan: !filters.isVegan })}
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
                onClick={() => onFiltersChange({ isGlutenfree: !filters.isGlutenfree })}
                className={cn(
                  "px-3 py-1 rounded-full text-sm transition-colors flex items-center gap-1",
                  filters.isGlutenfree
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                <Shield className="h-3 w-3" />
                Gluten-Free
              </button>
            </div>

            {/* Advanced Dietary Restrictions */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {DIETARY_RESTRICTIONS.slice(3).map((restriction) => (
                <label key={restriction} className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={filters.dietaryRestrictions.includes(restriction)}
                    onChange={(e) => {
                      const current = filters.dietaryRestrictions || [];
                      if (e.target.checked) {
                        onFiltersChange({ 
                          dietaryRestrictions: [...current, restriction] 
                        });
                      } else {
                        onFiltersChange({ 
                          dietaryRestrictions: current.filter(r => r !== restriction) 
                        });
                      }
                    }}
                    className="mr-2 rounded"
                  />
                  {restriction}
                </label>
              ))}
            </div>
          </div>

          {/* Menu Category Filter (for menu item searches) */}
          {(filters.searchType === 'menu_items' || filters.searchType === 'both') && (
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <Utensils className="h-4 w-4 mr-1" />
                Menu Category
              </label>
              <select
                value={filters.menuCategory || ''}
                onChange={(e) => onFiltersChange({ menuCategory: e.target.value || undefined })}
                className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {MENU_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Clear Filters */}
          {hasActiveFilters() && (
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters() && !showAdvanced && (
        <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-gray-200">
          <span className="text-sm text-gray-600">Active filters:</span>
          {filters.searchQuery && (
            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              "{filters.searchQuery}"
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => {
                  setLocalQuery('');
                  onFiltersChange({ searchQuery: '' });
                }}
              />
            </span>
          )}
          {filters.cuisineType !== 'All Cuisines' && (
            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              {filters.cuisineType}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onFiltersChange({ cuisineType: 'All Cuisines' })}
              />
            </span>
          )}
          {filters.priceRange && (
            <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
              {filters.priceRange}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onFiltersChange({ priceRange: '' })}
              />
            </span>
          )}
          {filters.location && (
            <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              {filters.location}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onFiltersChange({ location: '', latitude: undefined, longitude: undefined })}
              />
            </span>
          )}
          {(filters.isVegetarian || filters.isVegan || filters.isGlutenfree || 
            (filters.dietaryRestrictions && filters.dietaryRestrictions.length > 0)) && (
            <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
              Dietary filters
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onFiltersChange({ 
                  isVegetarian: false, 
                  isVegan: false, 
                  isGlutenfree: false,
                  dietaryRestrictions: [] 
                })}
              />
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
