'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import StarRating from '@/components/ui/StarRating';
import { Restaurant, RestaurantWithCharacteristics, Rating, MenuItem } from '@/types/restaurant';
import { MapPin, Phone, Globe, Star, DollarSign, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface RestaurantCardProps {
  restaurant: Restaurant | RestaurantWithCharacteristics;
  averageRating?: number;
  showSearchHighlight?: boolean;
  searchQuery?: string;
  showCharacteristics?: boolean;
}

export function RestaurantCard({ 
  restaurant, 
  averageRating,
  showSearchHighlight = false,
  searchQuery = '',
  showCharacteristics = true
}: RestaurantCardProps) {
  const [calculatedRating, setCalculatedRating] = useState(averageRating || 0);
  const [ratingCount, setRatingCount] = useState(0);
  const [averagePrice, setAveragePrice] = useState<number | null>(null);
  const [imageError, setImageError] = useState(false);
  const [characteristics, setCharacteristics] = useState<any>(null);

  useEffect(() => {
    if (!averageRating) {
      fetchRestaurantData();
    }
    if (showCharacteristics) {
      fetchCharacteristics();
    }
  }, [restaurant.id, averageRating, showCharacteristics]);

  const fetchRestaurantData = async () => {
    try {
      // Fetch ratings for this restaurant
      const { data: ratings } = await supabase
        .from('ratings')
        .select(`
          rating,
          menu_items!inner (
            restaurant_id
          )
        `)
        .eq('menu_items.restaurant_id', restaurant.id);

      if (ratings && ratings.length > 0) {
        const totalRating = ratings.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
        const avgRating = totalRating / ratings.length;
        setCalculatedRating(avgRating);
        setRatingCount(ratings.length);
      }

      // Fetch average price for menu items
      const { data: menuItems } = await supabase
        .from('menu_items')
        .select('price')
        .eq('restaurant_id', restaurant.id)
        .not('price', 'is', null);

      if (menuItems && menuItems.length > 0) {
        const totalPrice = menuItems.reduce((sum: number, item: any) => sum + (Number(item.price) || 0), 0);
        const avgPrice = totalPrice / menuItems.length;
        setAveragePrice(avgPrice);
      }
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
    }
  };

  const fetchCharacteristics = async () => {
    try {
      const response = await fetch(`/api/restaurants/${restaurant.id}/characteristics`);
      if (response.ok) {
        const data = await response.json();
        setCharacteristics(data.characteristics);
      }
    } catch (error) {
      console.error('Error fetching restaurant characteristics:', error);
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query || !showSearchHighlight) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 rounded px-1">
          {part}
        </mark>
      ) : part
    );
  };

  const getPriceDisplay = (price: number) => {
    if (price < 15) return '$';
    if (price < 30) return '$$';
    if (price < 50) return '$$$';
    return '$$$$';
  };

  const displayRating = averageRating || calculatedRating || (characteristics?.overall_rating?.average || 0);
  const displayRatingCount = ratingCount || (characteristics?.overall_rating?.count || 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 group hover:-translate-y-1 overflow-hidden flex flex-col h-full">
      <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-gray-200">
        <Image
          src={imageError ? '/placeholder-restaurant.jpg' : (restaurant.image_url || '/placeholder-restaurant.jpg')}
          alt={restaurant.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-200"
          onError={() => setImageError(true)}
          unoptimized
        />
        {/* Cuisine Type Badge */}
        {restaurant.cuisine_type && (
          <div className="absolute top-6 left-3 z-10">
            <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-2 py-1 rounded-full font-medium shadow-sm">
              {restaurant.cuisine_type}
            </span>
          </div>
        )}
        {/* Rating Badge */}
        {displayRating > 0 && (
          <div className="absolute top-6 right-3 z-10">
            <div className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 shadow-sm">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {displayRating.toFixed(1)}
            </div>
          </div>
        )}
      </div>
      
      {/* Content Area - Flexible */}
      <div className="flex-1 flex flex-col">
        <div className="flex flex-col space-y-1.5 pb-4 px-6 pt-6 relative z-20">
          <h3 className="text-lg font-semibold leading-none tracking-tight text-gray-900">
            {highlightText(restaurant.name, searchQuery)}
          </h3>
          
          {/* Rating and Price Row */}
          <div className="flex items-center justify-between">
            {displayRating > 0 && (
              <div className="flex items-center space-x-2">
                <StarRating rating={displayRating} size="sm" />
                <span className="text-sm text-gray-500">
                  ({displayRatingCount} rating{displayRatingCount !== 1 ? 's' : ''})
                </span>
              </div>
            )}
            
            {averagePrice && (
              <div className="flex items-center text-sm text-gray-600">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">{getPriceDisplay(averagePrice)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 px-6 relative z-20">
          <div className="space-y-3">
            {restaurant.description && (
              <p className="text-gray-600 text-sm line-clamp-2">
                {highlightText(restaurant.description, searchQuery)}
              </p>
            )}
            
            <div className="space-y-2">
              {restaurant.address && (
                <div className="flex items-start space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">
                    {highlightText(restaurant.address, searchQuery)}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                {restaurant.phone && (
                  <div className="flex items-center space-x-1">
                    <Phone className="h-3 w-3" />
                    <span>{restaurant.phone}</span>
                  </div>
                )}
                
                {restaurant.website && (
                  <a
                    href={restaurant.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Globe className="h-3 w-3" />
                    <span>Website</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Restaurant Characteristics Section */}
        {showCharacteristics && characteristics && Object.keys(characteristics).length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {characteristics.food_quality && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Food Quality</span>
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-2.5 h-2.5 ${
                            i < Math.round(characteristics.food_quality.average / 2)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-gray-200 text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-gray-500 ml-1">
                      {characteristics.food_quality.average.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
              
              {characteristics.service && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Service</span>
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-2.5 h-2.5 ${
                            i < Math.round(characteristics.service.average / 2)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-gray-200 text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-gray-500 ml-1">
                      {characteristics.service.average.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
              
              {characteristics.ambience && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ambience</span>
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-2.5 h-2.5 ${
                            i < Math.round(characteristics.ambience.average / 2)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-gray-200 text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-gray-500 ml-1">
                      {characteristics.ambience.average.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
              
              {characteristics.value_for_money && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Value</span>
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-2.5 h-2.5 ${
                            i < Math.round(characteristics.value_for_money.average / 2)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-gray-200 text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-gray-500 ml-1">
                      {characteristics.value_for_money.average.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Button Section - Always at bottom */}
        <div className="mt-4 px-6 pb-6">
          <div className="flex gap-2">
            <Link
              href={`/restaurants/${restaurant.id}`}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200 text-center"
            >
              View & Rate
            </Link>
            {displayRatingCount > 0 && (
              <div className="flex items-center text-xs text-gray-500 px-2">
                <Users className="h-3 w-3 mr-1" />
                {displayRatingCount}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}