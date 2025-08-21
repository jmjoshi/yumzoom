'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { SearchFilters, type RestaurantFilters } from '@/components/restaurant/SearchFilters';
import { useRestaurantSearch } from '@/hooks/useRestaurantSearch';
import { Search, MapPin, Users, Clock, Sparkles } from 'lucide-react';

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic';

export default function RestaurantsPage() {
  const { restaurants, loading, error, searchRestaurants, totalCount } = useRestaurantSearch();
  const [filters, setFilters] = useState<RestaurantFilters>({
    searchQuery: '',
    cuisineType: 'All Cuisines',
    priceRange: '',
    minRating: 0,
    location: ''
  });

  const handleSearch = (query: string) => {
    const newFilters = { ...filters, searchQuery: query };
    setFilters(newFilters);
    searchRestaurants(newFilters);
  };

  const handleFilterChange = (newFilters: RestaurantFilters) => {
    setFilters(newFilters);
    searchRestaurants(newFilters);
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
          <div className="bg-gray-300 h-4 rounded mb-2"></div>
          <div className="bg-gray-300 h-4 rounded w-2/3 mb-2"></div>
          <div className="bg-gray-300 h-4 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => {
    const hasActiveFilters = 
      filters.searchQuery || 
      filters.cuisineType !== 'All Cuisines' || 
      filters.priceRange || 
      filters.minRating > 0 || 
      filters.location;

    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {hasActiveFilters ? 'No restaurants match your search' : 'No restaurants found'}
          </h2>
          <p className="text-gray-600 mb-6">
            {hasActiveFilters 
              ? 'Try adjusting your search criteria or filters to find more restaurants.'
              : 'Check back later for new restaurant additions.'
            }
          </p>
          {hasActiveFilters && (
            <button
              onClick={() => {
                const defaultFilters: RestaurantFilters = {
                  searchQuery: '',
                  cuisineType: 'All Cuisines',
                  priceRange: '',
                  minRating: 0,
                  location: ''
                };
                setFilters(defaultFilters);
                searchRestaurants(defaultFilters);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Error Loading Restaurants</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => searchRestaurants(filters)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Amazing Restaurants
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Explore our curated collection of restaurants and find your next favorite dining experience.
          </p>
          
          {/* Advanced Search Link */}
          <div className="mb-6">
            <Link href="/search">
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                <Sparkles className="h-5 w-5" />
                Try Advanced Search
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">NEW</span>
              </button>
            </Link>
            <p className="text-sm text-gray-500 mt-2">
              Search menu items, dietary restrictions, location, and more!
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <SearchFilters
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          filters={filters}
          className="mb-8"
        />

        {/* Results Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {totalCount} restaurant{totalCount !== 1 ? 's' : ''} found
            </span>
            {filters.searchQuery && (
              <span className="flex items-center gap-1">
                <Search className="h-4 w-4" />
                Results for "{filters.searchQuery}"
              </span>
            )}
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Family-friendly ratings
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Real-time search
            </span>
          </div>
        </div>

        {/* Loading State */}
        {loading && <LoadingSkeleton />}

        {/* Results */}
        {!loading && (
          <>
            {restaurants.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {restaurants.map((restaurant) => (
                  <RestaurantCard 
                    key={restaurant.id} 
                    restaurant={restaurant}
                    showSearchHighlight={!!filters.searchQuery}
                    searchQuery={filters.searchQuery}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Load More Button (for future pagination) */}
        {!loading && restaurants.length > 0 && restaurants.length >= 50 && (
          <div className="text-center mt-12">
            <button className="bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-md hover:bg-gray-50 transition-colors">
              Load More Restaurants
            </button>
          </div>
        )}
      </div>
    </div>
  );
}