'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import {
  Search,
  Filter,
  MapPin,
  Star,
  DollarSign,
  Accessibility,
  Languages,
  ChevronDown,
  X,
  Check
} from 'lucide-react';

interface EnhancedSearchFiltersProps {
  onFiltersChange?: (filters: SearchFilters) => void;
  onSearch?: () => void;
  loading?: boolean;
  resultCount?: number;
  className?: string;
}

export interface SearchFilters {
  query: string;
  location: string;
  cuisine: string[];
  priceRange: string[];
  rating: number;
  openNow: boolean;
  distance: number;
  accessibility: string[];
  language: string;
  sortBy: 'relevance' | 'distance' | 'rating' | 'price' | 'accessibility';
  viewMode: 'list' | 'grid' | 'map';
}

const defaultFilters: SearchFilters = {
  query: '',
  location: '',
  cuisine: [],
  priceRange: [],
  rating: 0,
  openNow: false,
  distance: 25,
  accessibility: [],
  language: 'any',
  sortBy: 'relevance',
  viewMode: 'list'
};

export function EnhancedSearchFilters({ 
  onFiltersChange, 
  onSearch,
  loading = false,
  resultCount = 0,
  className = '' 
}: EnhancedSearchFiltersProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    // Calculate active filter count
    const count = 
      (filters.query ? 1 : 0) +
      (filters.location ? 1 : 0) +
      (filters.cuisine.length > 0 ? 1 : 0) +
      (filters.priceRange.length > 0 ? 1 : 0) +
      (filters.rating > 0 ? 1 : 0) +
      (filters.openNow ? 1 : 0) +
      (filters.distance < 25 ? 1 : 0) +
      (filters.accessibility.length > 0 ? 1 : 0) +
      (filters.language !== 'any' ? 1 : 0);
    
    setActiveFilterCount(count);
    
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = function<T>(array: T[], value: T): T[] {
    return array.includes(value)
      ? array.filter(item => item !== value)
      : [...array, value];
  };

  const clearAllFilters = () => {
    setFilters(defaultFilters);
  };

  const handleLocationDetect = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // This would typically reverse geocode to get address
          updateFilter('location', `${position.coords.latitude}, ${position.coords.longitude}`);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Main Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder={t('search.placeholder') || 'Search restaurants, dishes, or cuisines...'}
              value={filters.query}
              onChange={(e) => updateFilter('query', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Search restaurants"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAdvanced(!showAdvanced)}
              variant="outline"
              className="relative"
            >
              <Filter className="h-4 w-4 mr-2" />
              {t('search.filters.advanced') || 'Filters'}
              {activeFilterCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            
            <Button onClick={onSearch} disabled={loading}>
              {loading ? 'Searching...' : (t('search.button') || 'Search')}
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-6 pt-6 border-t border-gray-200">
            {/* Location and Quick Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('search.location') || 'Location'}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder={t('search.location.placeholder') || 'Enter address or neighborhood'}
                    value={filters.location}
                    onChange={(e) => updateFilter('location', e.target.value)}
                    className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleLocationDetect}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800"
                    title="Use current location"
                  >
                    📍
                  </button>
                </div>
              </div>

              {/* Open Now */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('search.availability') || 'Availability'}
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.openNow}
                    onChange={(e) => updateFilter('openNow', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    {t('search.open_now') || 'Open now'}
                  </span>
                </label>
              </div>

              {/* Distance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('search.distance') || 'Distance'} ({filters.distance} km)
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={filters.distance}
                  onChange={(e) => updateFilter('distance', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('search.min_rating') || 'Minimum Rating'}
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => updateFilter('rating', star === filters.rating ? 0 : star)}
                      className={`p-1 ${star <= filters.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      <Star className="h-5 w-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('search.price_range') || 'Price Range'}
              </label>
              <div className="flex gap-2">
                {['$', '$$', '$$$', '$$$$'].map((price) => (
                  <button
                    key={price}
                    onClick={() => updateFilter('priceRange', toggleArrayFilter(filters.priceRange, price))}
                    className={`px-3 py-2 rounded-md border text-sm font-medium ${
                      filters.priceRange.includes(price)
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {price}
                  </button>
                ))}
              </div>
            </div>

            {/* Cuisine Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('search.cuisine_types') || 'Cuisine Types'}
              </label>
              <div className="flex flex-wrap gap-2">
                {['Italian', 'Japanese', 'Mexican', 'Chinese', 'Indian', 'Thai', 'French', 'American', 'Mediterranean', 'Korean'].map((cuisine) => (
                  <button
                    key={cuisine}
                    onClick={() => updateFilter('cuisine', toggleArrayFilter(filters.cuisine, cuisine))}
                    className={`px-3 py-2 rounded-md border text-sm ${
                      filters.cuisine.includes(cuisine)
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {t(`cuisine.${cuisine.toLowerCase()}`) || cuisine}
                  </button>
                ))}
              </div>
            </div>

            {/* Accessibility Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Accessibility className="h-4 w-4 inline mr-1" />
                {t('accessibility.features') || 'Accessibility Features'}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {[
                  'wheelchair_accessible',
                  'braille_menu',
                  'hearing_loop',
                  'large_print_menu',
                  'tactile_guidance',
                  'sign_language'
                ].map((feature) => (
                  <label key={feature} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.accessibility.includes(feature)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateFilter('accessibility', [...filters.accessibility, feature]);
                        } else {
                          updateFilter('accessibility', filters.accessibility.filter(f => f !== feature));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-900">
                      {t(`accessibility.${feature}`) || feature.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Language Content Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Languages className="h-4 w-4 inline mr-1" />
                {t('search.content_language') || 'Content Language'}
              </label>
              <select
                value={filters.language}
                onChange={(e) => updateFilter('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="any">{t('search.any_language') || 'Any Language'}</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="it">Italiano</option>
                <option value="pt">Português</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
                <option value="zh">中文</option>
                <option value="ar">العربية</option>
                <option value="hi">हिन्दी</option>
                <option value="ru">Русский</option>
              </select>
            </div>

            {/* Sort and View Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('search.sort_by') || 'Sort By'}
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter('sortBy', e.target.value as SearchFilters['sortBy'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="relevance">{t('search.sort.relevance') || 'Relevance'}</option>
                  <option value="distance">{t('search.sort.distance') || 'Distance'}</option>
                  <option value="rating">{t('search.sort.rating') || 'Rating'}</option>
                  <option value="price">{t('search.sort.price') || 'Price'}</option>
                  <option value="accessibility">{t('search.sort.accessibility') || 'Accessibility'}</option>
                </select>
              </div>

              {/* View Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('search.view_mode') || 'View Mode'}
                </label>
                <div className="flex gap-2">
                  {(['list', 'grid', 'map'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => updateFilter('viewMode', mode)}
                      className={`px-3 py-2 rounded-md border text-sm ${
                        filters.viewMode === mode
                          ? 'bg-blue-100 border-blue-300 text-blue-800'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {t(`search.view.${mode}`) || mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                {t('search.clear_filters') || 'Clear all filters'}
              </button>
              
              {resultCount > 0 && (
                <p className="text-sm text-gray-600">
                  {t('search.results_count', { count: resultCount }) || `${resultCount} results found`}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
