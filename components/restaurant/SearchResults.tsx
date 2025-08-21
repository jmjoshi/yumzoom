'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Star,
  DollarSign,
  Clock,
  Heart,
  Leaf,
  Shield,
  Utensils,
  Phone,
  Globe,
  Navigation,
  Eye
} from 'lucide-react';
import {
  RestaurantSearchResult,
  MenuItemSearchResult,
  EnhancedRestaurant,
  EnhancedMenuItem
} from '@/types/search';

interface SearchResultsProps {
  results: (RestaurantSearchResult | MenuItemSearchResult)[];
  searchQuery: string;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onViewRestaurant?: (restaurantId: string) => void;
  onViewMenuItem?: (restaurantId: string, menuItemId: string) => void;
  className?: string;
}

function highlightText(text: string, query: string): React.ReactNode {
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
}

function RestaurantResultCard({ 
  result, 
  searchQuery, 
  onViewRestaurant 
}: { 
  result: RestaurantSearchResult;
  searchQuery: string;
  onViewRestaurant?: (id: string) => void;
}) {
  const restaurant = result.restaurant;

  const formatPriceRange = (priceRange?: string) => {
    switch (priceRange) {
      case '$': return 'Under $15';
      case '$$': return '$15-30';
      case '$$$': return '$30-50';
      case '$$$$': return 'Over $50';
      default: return 'Price varies';
    }
  };

  const getDietaryBadges = (restaurant: EnhancedRestaurant) => {
    const badges = [];
    if (restaurant.hasVegetarianOptions) badges.push({ label: 'Vegetarian', icon: Leaf, color: 'green' });
    if (restaurant.hasVeganOptions) badges.push({ label: 'Vegan', icon: Heart, color: 'green' });
    if (restaurant.hasGlutenFreeOptions) badges.push({ label: 'Gluten-Free', icon: Shield, color: 'orange' });
    return badges;
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
      <div className="flex gap-4">
        {/* Restaurant Image */}
        <div className="flex-shrink-0">
          <img
            src={restaurant.imageUrl || '/placeholder-restaurant.jpg'}
            alt={restaurant.name}
            className="w-24 h-24 rounded-lg object-cover"
          />
        </div>

        {/* Restaurant Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {highlightText(restaurant.name, searchQuery)}
              </h3>
              
              {restaurant.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {highlightText(restaurant.description, searchQuery)}
                </p>
              )}

              {/* Location */}
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <MapPin className="h-4 w-4" />
                <span>
                  {restaurant.city && restaurant.state 
                    ? `${restaurant.city}, ${restaurant.state}`
                    : restaurant.address
                  }
                </span>
                {result.distance && (
                  <span className="text-blue-600">
                    • {result.distance.toFixed(1)} miles away
                  </span>
                )}
              </div>

              {/* Cuisine & Features */}
              <div className="flex items-center gap-4 mt-2">
                {restaurant.cuisineType && (
                  <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                    <Utensils className="h-3 w-3" />
                    {restaurant.cuisineType}
                  </span>
                )}
                
                {restaurant.priceRangeCategory && (
                  <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                    <DollarSign className="h-3 w-3" />
                    {formatPriceRange(restaurant.priceRangeCategory)}
                  </span>
                )}
              </div>

              {/* Dietary Options */}
              <div className="flex flex-wrap gap-2 mt-2">
                {getDietaryBadges(restaurant).map((badge, index) => {
                  const Icon = badge.icon;
                  return (
                    <span
                      key={index}
                      className={cn(
                        "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                        badge.color === 'green' && "bg-green-100 text-green-800",
                        badge.color === 'orange' && "bg-orange-100 text-orange-800"
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {badge.label}
                    </span>
                  );
                })}
              </div>

              {/* Tags */}
              {restaurant.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {restaurant.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {restaurant.tags.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{restaurant.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Rating & Stats */}
            <div className="flex-shrink-0 text-right">
              <div className="flex items-center gap-1 justify-end">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="font-medium text-gray-900">
                  {restaurant.averageRating > 0 ? restaurant.averageRating.toFixed(1) : 'New'}
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {restaurant.reviewCount > 0 ? `${restaurant.reviewCount} reviews` : 'No reviews yet'}
              </div>
              <div className="text-sm text-gray-500">
                {restaurant.menuItemCount} menu items
              </div>
            </div>
          </div>

          {/* Matched Menu Items Preview */}
          {result.matchedMenuItems && result.matchedMenuItems.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Matching Menu Items:
              </h4>
              <div className="space-y-1">
                {result.matchedMenuItems.slice(0, 2).map((menuResult, index) => (
                  <div key={index} className="text-sm text-gray-600 flex justify-between">
                    <span>{highlightText(menuResult.menuItem.name, searchQuery)}</span>
                    {menuResult.menuItem.price && (
                      <span className="font-medium">${menuResult.menuItem.price.toFixed(2)}</span>
                    )}
                  </div>
                ))}
                {result.matchedMenuItems.length > 2 && (
                  <div className="text-xs text-blue-600">
                    +{result.matchedMenuItems.length - 2} more matches
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => onViewRestaurant?.(restaurant.id)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Restaurant
            </Button>
            {restaurant.phone && (
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
            )}
            {restaurant.website && (
              <Button variant="outline" size="sm">
                <Globe className="h-4 w-4" />
              </Button>
            )}
            {restaurant.latitude && restaurant.longitude && (
              <Button variant="outline" size="sm">
                <Navigation className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function MenuItemResultCard({ 
  result, 
  searchQuery, 
  onViewMenuItem 
}: { 
  result: MenuItemSearchResult;
  searchQuery: string;
  onViewMenuItem?: (restaurantId: string, menuItemId: string) => void;
}) {
  const { menuItem, restaurant } = result;

  const getDietaryBadges = (item: EnhancedMenuItem) => {
    const badges = [];
    if (item.isVegetarian) badges.push({ label: 'Vegetarian', icon: Leaf, color: 'green' });
    if (item.isVegan) badges.push({ label: 'Vegan', icon: Heart, color: 'green' });
    if (item.isGlutenFree) badges.push({ label: 'Gluten-Free', icon: Shield, color: 'orange' });
    return badges;
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
      <div className="flex gap-4">
        {/* Menu Item Image */}
        <div className="flex-shrink-0">
          <img
            src={menuItem.imageUrl || '/placeholder-food.jpg'}
            alt={menuItem.name}
            className="w-24 h-24 rounded-lg object-cover"
          />
        </div>

        {/* Menu Item Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {highlightText(menuItem.name, searchQuery)}
              </h3>
              
              {menuItem.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {highlightText(menuItem.description, searchQuery)}
                </p>
              )}

              {/* Restaurant Info */}
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <Utensils className="h-4 w-4" />
                <span className="font-medium">{restaurant.name}</span>
                {restaurant.cuisineType && (
                  <span>• {restaurant.cuisineType}</span>
                )}
                {restaurant.city && restaurant.state && (
                  <span>• {restaurant.city}, {restaurant.state}</span>
                )}
              </div>

              {/* Category & Dietary Info */}
              <div className="flex items-center gap-4 mt-2">
                {menuItem.category && (
                  <span className="text-sm text-gray-600">
                    {menuItem.category}
                  </span>
                )}
              </div>

              {/* Dietary Options */}
              <div className="flex flex-wrap gap-2 mt-2">
                {getDietaryBadges(menuItem).map((badge, index) => {
                  const Icon = badge.icon;
                  return (
                    <span
                      key={index}
                      className={cn(
                        "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                        badge.color === 'green' && "bg-green-100 text-green-800",
                        badge.color === 'orange' && "bg-orange-100 text-orange-800"
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {badge.label}
                    </span>
                  );
                })}
              </div>

              {/* Allergen Info */}
              {menuItem.allergens.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-red-600">
                    Contains: {menuItem.allergens.join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Price & Rating */}
            <div className="flex-shrink-0 text-right">
              {menuItem.price && (
                <div className="text-lg font-bold text-gray-900">
                  ${menuItem.price.toFixed(2)}
                </div>
              )}
              
              {menuItem.averageRating && menuItem.averageRating > 0 && (
                <div className="flex items-center gap-1 justify-end mt-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium text-gray-900">
                    {menuItem.averageRating.toFixed(1)}
                  </span>
                </div>
              )}
              
              {menuItem.ratingCount && menuItem.ratingCount > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {menuItem.ratingCount} ratings
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => onViewMenuItem?.(restaurant.id, menuItem.id)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            <Button variant="outline">
              View Restaurant
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function SearchResults({
  results,
  searchQuery,
  loading = false,
  hasMore = false,
  onLoadMore,
  onViewRestaurant,
  onViewMenuItem,
  className
}: SearchResultsProps) {
  if (loading && results.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="p-6">
            <div className="flex gap-4 animate-pulse">
              <div className="w-24 h-24 bg-gray-300 rounded-lg"></div>
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-gray-300 rounded w-1/3"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-300 rounded w-16"></div>
                  <div className="h-6 bg-gray-300 rounded w-16"></div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (results.length === 0 && !loading) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="max-w-md mx-auto">
          <Utensils className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No results found
          </h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search criteria or filters to find more results.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Results */}
      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={`${result.type}-${result.id}-${index}`}>
            {result.type === 'restaurant' ? (
              <RestaurantResultCard
                result={result}
                searchQuery={searchQuery}
                onViewRestaurant={onViewRestaurant}
              />
            ) : (
              <MenuItemResultCard
                result={result}
                searchQuery={searchQuery}
                onViewMenuItem={onViewMenuItem}
              />
            )}
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center pt-6">
          <Button
            onClick={onLoadMore}
            disabled={loading}
            variant="outline"
            className="px-8"
          >
            {loading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Loading more...
              </>
            ) : (
              'Load More Results'
            )}
          </Button>
        </div>
      )}

      {/* Loading indicator for pagination */}
      {loading && results.length > 0 && (
        <div className="text-center py-4">
          <Clock className="h-6 w-6 text-blue-500 animate-spin mx-auto" />
        </div>
      )}
    </div>
  );
}
