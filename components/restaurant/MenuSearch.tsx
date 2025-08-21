'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, X, Filter, SortAsc, SortDesc } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuSearchProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: MenuFilters) => void;
  filters: MenuFilters;
  className?: string;
}

export interface MenuFilters {
  searchQuery: string;
  category: string;
  sortBy: 'name' | 'price' | 'rating';
  sortOrder: 'asc' | 'desc';
  priceRange: { min: number; max: number } | null;
}

const MENU_CATEGORIES = [
  'All Categories',
  'Appetizers',
  'Soups',
  'Salads',
  'Main Courses',
  'Desserts',
  'Beverages',
  'Specials'
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'price', label: 'Price' },
  { value: 'rating', label: 'Rating' }
];

export function MenuSearch({ onSearch, onFilterChange, filters, className }: MenuSearchProps) {
  const [localQuery, setLocalQuery] = useState(filters.searchQuery);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localQuery);
    updateFilters({ searchQuery: localQuery });
  };

  const updateFilters = (newFilters: Partial<MenuFilters>) => {
    const updated = { ...filters, ...newFilters };
    onFilterChange(updated);
  };

  const clearAllFilters = () => {
    const defaultFilters: MenuFilters = {
      searchQuery: '',
      category: 'All Categories',
      sortBy: 'name',
      sortOrder: 'asc',
      priceRange: null
    };
    setLocalQuery('');
    onFilterChange(defaultFilters);
    setShowFilters(false);
  };

  const hasActiveFilters = 
    filters.category !== 'All Categories' ||
    filters.sortBy !== 'name' ||
    filters.sortOrder !== 'asc' ||
    filters.priceRange !== null ||
    filters.searchQuery !== '';

  const toggleSortOrder = () => {
    updateFilters({ 
      sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search menu items, ingredients, or descriptions..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>
        <Button type="submit" size="sm" className="px-4">
          Search
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
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
          {filters.category !== 'All Categories' && (
            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              {filters.category}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilters({ category: 'All Categories' })} />
            </span>
          )}
          {(filters.sortBy !== 'name' || filters.sortOrder !== 'asc') && (
            <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
              Sort: {filters.sortBy} ({filters.sortOrder})
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilters({ sortBy: 'name', sortOrder: 'asc' })} />
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-md bg-gray-50">
          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => updateFilters({ category: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {MENU_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Sort By
            </label>
            <div className="flex gap-2">
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilters({ sortBy: e.target.value as 'name' | 'price' | 'rating' })}
                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleSortOrder}
                className="px-2"
              >
                {filters.sortOrder === 'asc' ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Price Range
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.priceRange?.min || ''}
                onChange={(e) => {
                  const min = parseFloat(e.target.value) || 0;
                  const max = filters.priceRange?.max || 100;
                  updateFilters({ 
                    priceRange: min || max ? { min, max } : null 
                  });
                }}
                className="w-20"
                min="0"
                step="0.01"
              />
              <span className="self-center text-gray-500">-</span>
              <Input
                type="number"
                placeholder="Max"
                value={filters.priceRange?.max || ''}
                onChange={(e) => {
                  const max = parseFloat(e.target.value) || 100;
                  const min = filters.priceRange?.min || 0;
                  updateFilters({ 
                    priceRange: min || max ? { min, max } : null 
                  });
                }}
                className="w-20"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
