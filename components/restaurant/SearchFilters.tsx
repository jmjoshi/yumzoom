'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { Search, Filter, X, MapPin, Star, DollarSign } from 'lucide-react';

interface SearchFiltersProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: RestaurantFilters) => void;
  filters: RestaurantFilters;
  className?: string;
}

export interface RestaurantFilters {
  searchQuery: string;
  cuisineType: string;
  priceRange: string;
  minRating: number;
  location: string;
}

const CUISINE_TYPES = [
  'All Cuisines',
  'Italian',
  'Chinese',
  'Japanese',
  'Mexican',
  'American',
  'Indian',
  'Thai',
  'French',
  'Mediterranean',
  'Korean',
  'Vietnamese',
  'Turkish',
  'Greek',
  'Spanish',
  'Other'
];

const PRICE_RANGES = [
  { label: 'All Prices', value: '' },
  { label: '$ (Under $15)', value: '$' },
  { label: '$$ ($15-30)', value: '$$' },
  { label: '$$$ ($30-50)', value: '$$$' },
  { label: '$$$$ (Over $50)', value: '$$$$' }
];

const RATING_OPTIONS = [
  { label: 'All Ratings', value: 0 },
  { label: '4+ Stars', value: 4 },
  { label: '4.5+ Stars', value: 4.5 },
  { label: '5 Stars', value: 5 }
];

export function SearchFilters({ onSearch, onFilterChange, filters, className }: SearchFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [localQuery, setLocalQuery] = useState(filters.searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localQuery);
    updateFilters({ searchQuery: localQuery });
  };

  const updateFilters = (newFilters: Partial<RestaurantFilters>) => {
    const updated = { ...filters, ...newFilters };
    onFilterChange(updated);
  };

  const clearAllFilters = () => {
    const defaultFilters: RestaurantFilters = {
      searchQuery: '',
      cuisineType: 'All Cuisines',
      priceRange: '',
      minRating: 0,
      location: ''
    };
    setLocalQuery('');
    onFilterChange(defaultFilters);
    setShowFilters(false);
  };

  const hasActiveFilters = 
    filters.cuisineType !== 'All Cuisines' ||
    filters.priceRange !== '' ||
    filters.minRating > 0 ||
    filters.location !== '' ||
    filters.searchQuery !== '';

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search restaurants, cuisine, or dishes..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>
        <Button type="submit" className="px-6">
          Search
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "px-4",
            hasActiveFilters && "border-blue-500 text-blue-600"
          )}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 bg-blue-500 text-white rounded-full text-xs px-2 py-1">
              Active
            </span>
          )}
        </Button>
      </form>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">Active filters:</span>
          {filters.searchQuery && (
            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              "{filters.searchQuery}"
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilters({ searchQuery: '' })} />
            </span>
          )}
          {filters.cuisineType !== 'All Cuisines' && (
            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              {filters.cuisineType}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilters({ cuisineType: 'All Cuisines' })} />
            </span>
          )}
          {filters.priceRange && (
            <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
              {filters.priceRange}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilters({ priceRange: '' })} />
            </span>
          )}
          {filters.minRating > 0 && (
            <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
              {filters.minRating}+ stars
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilters({ minRating: 0 })} />
            </span>
          )}
          {filters.location && (
            <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              {filters.location}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilters({ location: '' })} />
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border-t border-gray-200">
          {/* Cuisine Type Filter */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <MapPin className="h-4 w-4 mr-1" />
              Cuisine Type
            </label>
            <select
              value={filters.cuisineType}
              onChange={(e) => updateFilters({ cuisineType: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {CUISINE_TYPES.map((cuisine) => (
                <option key={cuisine} value={cuisine}>
                  {cuisine}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <DollarSign className="h-4 w-4 mr-1" />
              Price Range
            </label>
            <select
              value={filters.priceRange}
              onChange={(e) => updateFilters({ priceRange: e.target.value })}
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
              onChange={(e) => updateFilters({ minRating: parseFloat(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {RATING_OPTIONS.map((rating) => (
                <option key={rating.value} value={rating.value}>
                  {rating.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <MapPin className="h-4 w-4 mr-1" />
              Location
            </label>
            <Input
              type="text"
              placeholder="Enter location..."
              value={filters.location}
              onChange={(e) => updateFilters({ location: e.target.value })}
              className="w-full"
            />
          </div>
        </div>
      )}
    </Card>
  );
}
