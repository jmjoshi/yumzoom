'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AdvancedSearchFiltersComponent } from '@/components/restaurant/AdvancedSearchFilters';
import { SearchResults } from '@/components/restaurant/SearchResults';
import { EnhancedSearchFilters } from '@/components/search/EnhancedSearchFilters';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { AccessibilityPanel } from '@/components/accessibility/AccessibilityPanel';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';
import { AdvancedSearchFilters } from '@/types/search';
import { Search, TrendingUp, Clock, MapPin, Utensils, Globe, Accessibility } from 'lucide-react';
import toast from 'react-hot-toast';

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic';

export default function AdvancedSearchPage() {
  const t = useTranslations();
  const router = useRouter();
  const {
    searchState,
    search,
    loadMore,
    getSuggestions,
    updateFilters,
    clearSearch,
    getCurrentLocation
  } = useAdvancedSearch();

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [useEnhancedFilters, setUseEnhancedFilters] = useState(false);

  const handleFiltersChange = useCallback((newFilters: Partial<AdvancedSearchFilters>) => {
    updateFilters(newFilters);
  }, [updateFilters]);

  const handleSearch = useCallback(async () => {
    try {
      await search({});
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed. Please try again.');
    }
  }, [search]);

  const handleGetSuggestions = useCallback(async (query: string) => {
    try {
      const newSuggestions = await getSuggestions(query);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    }
  }, [getSuggestions]);

  const handleViewRestaurant = useCallback((restaurantId: string) => {
    router.push(`/restaurants/${restaurantId}`);
  }, [router]);

  const handleViewMenuItem = useCallback((restaurantId: string, menuItemId: string) => {
    router.push(`/restaurants/${restaurantId}?item=${menuItemId}`);
  }, [router]);

  const popularSearches = [
    t('search.popular.pizza') || 'Pizza',
    t('search.popular.sushi') || 'Sushi',
    t('search.popular.burgers') || 'Burgers',
    t('search.popular.italian') || 'Italian cuisine',
    t('search.popular.vegetarian') || 'Vegetarian options',
    t('search.popular.glutenfree') || 'Gluten-free'
  ];

  const trendingLocations = [
    t('locations.downtown') || 'Downtown',
    t('locations.midtown') || 'Midtown',
    t('locations.brooklyn') || 'Brooklyn',
    t('locations.uppereast') || 'Upper East Side'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {t('search.title') || 'Advanced Restaurant Search'}
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl">
                {t('search.subtitle') || 'Find the perfect dining experience with our powerful search tools. Search restaurants, menu items, dietary options, and more.'}
              </p>
            </div>
            
            {/* Language and Accessibility Controls */}
            <div className="flex items-center gap-4 justify-center lg:justify-end">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-gray-500" />
                <LanguageSwitcher variant="dropdown" />
              </div>
              <div className="flex items-center gap-2">
                <Accessibility className="h-5 w-5 text-gray-500" />
                <AccessibilityPanel />
              </div>
            </div>
          </div>

          {/* Enhanced Filters Toggle */}
          <div className="mt-6 flex justify-center">
            <div className="bg-gray-100 p-1 rounded-lg flex">
              <button
                onClick={() => setUseEnhancedFilters(false)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  !useEnhancedFilters
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('search.filters.standard') || 'Standard Search'}
              </button>
              <button
                onClick={() => setUseEnhancedFilters(true)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  useEnhancedFilters
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('search.filters.enhanced') || 'Enhanced Filters'}
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  {t('common.new') || 'New'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Filters - Choose between standard and enhanced */}
        {useEnhancedFilters ? (
          <EnhancedSearchFilters
            onSearch={handleSearch}
            loading={searchState.loading}
            resultCount={searchState.totalCount}
            className="mb-8"
          />
        ) : (
          <AdvancedSearchFiltersComponent
            filters={searchState.filters}
            onFiltersChange={handleFiltersChange}
            onSearch={handleSearch}
            suggestions={suggestions}
            onGetSuggestions={handleGetSuggestions}
            loading={searchState.loading}
            resultCount={searchState.totalCount}
            className="mb-8"
          />
        )}

        {/* Quick Help / Popular Searches (show when no search has been performed) */}
        {searchState.results.length === 0 && !searchState.loading && !searchState.filters.searchQuery && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Popular Searches */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('search.popular.title') || 'Popular Searches'}
                </h3>
              </div>
              <div className="space-y-2">
                {popularSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleFiltersChange({ searchQuery: search })}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                    aria-label={`Search for ${search}`}
                  >
                    <Search className="h-4 w-4 inline mr-2 text-gray-400" />
                    {search}
                  </button>
                ))}
              </div>
            </div>

            {/* Trending Locations */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('search.locations.title') || 'Trending Locations'}
                </h3>
              </div>
              <div className="space-y-2">
                {trendingLocations.map((location, index) => (
                  <button
                    key={index}
                    onClick={() => handleFiltersChange({ location })}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                    aria-label={`Search in ${location}`}
                  >
                    <MapPin className="h-4 w-4 inline mr-2 text-gray-400" />
                    {location}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Utensils className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('search.quickfilters.title') || 'Quick Filters'}
                </h3>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => handleFiltersChange({ isVegetarian: true })}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                  aria-label="Filter for vegetarian options"
                >
                  🌱 {t('dietary.vegetarian') || 'Vegetarian Options'}
                </button>
                <button
                  onClick={() => handleFiltersChange({ isVegan: true })}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                  aria-label="Filter for vegan options"
                >
                  💚 {t('dietary.vegan') || 'Vegan Options'}
                </button>
                <button
                  onClick={() => handleFiltersChange({ isGlutenfree: true })}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                  aria-label="Filter for gluten-free options"
                >
                  🛡️ {t('dietary.glutenfree') || 'Gluten-Free Options'}
                </button>
                <button
                  onClick={() => handleFiltersChange({ minRating: 4 })}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                  aria-label="Filter for highly rated restaurants"
                >
                  ⭐ {t('search.highrated') || 'Highly Rated (4+ stars)'}
                </button>
                <button
                  onClick={() => handleFiltersChange({ priceRange: '$' })}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                  aria-label="Filter for budget friendly options"
                >
                  💰 {t('search.budget') || 'Budget Friendly'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Statistics */}
        {(searchState.results.length > 0 || searchState.loading) && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  {searchState.totalCount} result{searchState.totalCount !== 1 ? 's' : ''}
                </span>
                {searchState.searchTime > 0 && (
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {searchState.searchTime}ms
                  </span>
                )}
                {searchState.filters.searchQuery && (
                  <span className="flex items-center gap-2">
                    <span className="font-medium">for "{searchState.filters.searchQuery}"</span>
                  </span>
                )}
              </div>

              {/* Search Type Indicator */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Searching:</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {searchState.filters.searchType === 'both' ? 'Restaurants & Menu Items' :
                   searchState.filters.searchType === 'restaurants' ? 'Restaurants Only' :
                   'Menu Items Only'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        <SearchResults
          results={searchState.results}
          searchQuery={searchState.filters.searchQuery}
          loading={searchState.loading}
          hasMore={searchState.hasMore}
          onLoadMore={loadMore}
          onViewRestaurant={handleViewRestaurant}
          onViewMenuItem={handleViewMenuItem}
        />

        {/* Error State */}
        {searchState.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-800">
              <h3 className="text-lg font-semibold mb-2">Search Error</h3>
              <p className="text-sm">{searchState.error}</p>
              <button
                onClick={() => handleSearch()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Search Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">🔍 General Search</h4>
              <ul className="space-y-1 ml-4">
                <li>• Search restaurant names, cuisines, or dishes</li>
                <li>• Use quotes for exact phrases</li>
                <li>• Try different spellings or synonyms</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">🏃‍♂️ Quick Filters</h4>
              <ul className="space-y-1 ml-4">
                <li>• Use dietary restriction filters for special needs</li>
                <li>• Set location to find nearby restaurants</li>
                <li>• Sort by rating, price, or distance</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">📍 Location Search</h4>
              <ul className="space-y-1 ml-4">
                <li>• Allow location access for "near me" results</li>
                <li>• Search by neighborhood or address</li>
                <li>• Use distance filters to narrow results</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">🍽️ Menu Items</h4>
              <ul className="space-y-1 ml-4">
                <li>• Search for specific dishes across all restaurants</li>
                <li>• Filter by menu categories</li>
                <li>• Check dietary restrictions and allergens</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
