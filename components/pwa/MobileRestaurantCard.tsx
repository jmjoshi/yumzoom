'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Star, 
  MapPin, 
  Clock, 
  Heart, 
  Share2, 
  Phone, 
  Navigation,
  Camera,
  MoreVertical 
} from 'lucide-react';
import { Restaurant } from '@/types/restaurant';
import { formatDistance } from './LocationServices';

interface MobileRestaurantCardProps {
  restaurant: Restaurant;
  distance?: number;
  onFavoriteToggle?: (restaurantId: string, isFavorite: boolean) => void;
  onShare?: (restaurant: Restaurant) => void;
  onNavigate?: (restaurant: Restaurant) => void;
  onQuickPhoto?: (restaurant: Restaurant) => void;
  isFavorite?: boolean;
  className?: string;
}

export function MobileRestaurantCard({
  restaurant,
  distance,
  onFavoriteToggle,
  onShare,
  onNavigate,
  onQuickPhoto,
  isFavorite = false,
  className = '',
}: MobileRestaurantCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavoriteToggle?.(restaurant.id, !isFavorite);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onShare?.(restaurant);
  };

  const handleNavigateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onNavigate?.(restaurant);
  };

  const handlePhotoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickPhoto?.(restaurant);
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowActions(!showActions);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden touch-manipulation ${className}`}>
      <Link href={`/restaurants/${restaurant.id}`} className="block">
        {/* Restaurant Image */}
        <div className="relative h-48 bg-gray-200">
          <Image
            src={restaurant.image_url || '/placeholder-restaurant.jpg'}
            alt={restaurant.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            priority={false}
          />
          
          {/* Distance badge */}
          {distance && (
            <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
              {formatDistance(distance)}
            </div>
          )}

          {/* Action buttons overlay */}
          <div className="absolute top-3 right-3 flex space-x-2">
            <button
              onClick={handleFavoriteClick}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isFavorite
                  ? 'bg-red-500 text-white'
                  : 'bg-white/90 text-gray-700 hover:bg-white'
              }`}
            >
              <Heart 
                className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} 
              />
            </button>
            
            <div className="relative">
              <button
                onClick={handleMoreClick}
                className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-gray-700 hover:bg-white"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {/* Quick actions dropdown */}
              {showActions && (
                <div className="absolute top-10 right-0 bg-white rounded-lg shadow-lg py-2 min-w-[120px] z-10">
                  <button
                    onClick={handleShareClick}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                  
                  {onNavigate && (
                    <button
                      onClick={handleNavigateClick}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Directions</span>
                    </button>
                  )}
                  
                  {onQuickPhoto && (
                    <button
                      onClick={handlePhotoClick}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Quick Photo</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="p-4">
          {/* Header */}
          <div className="mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {restaurant.name}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-1">
              {restaurant.cuisine_type}
            </p>
          </div>

          {/* Rating and Price */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-gray-900">
                {restaurant.rating?.toFixed(1) || 'New'}
              </span>
              <span className="text-sm text-gray-500">
                ({restaurant.review_count || 0} reviews)
              </span>
            </div>
            
            <div className="text-sm font-medium text-gray-900">
              {'$'.repeat(restaurant.price_range || 2)}
            </div>
          </div>

          {/* Location and Hours */}
          <div className="space-y-1">
            {restaurant.address && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="line-clamp-1">{restaurant.address}</span>
              </div>
            )}
            
            {restaurant.hours && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>{restaurant.hours}</span>
              </div>
            )}
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <div className="flex space-x-4">
              {restaurant.phone && (
                <a
                  href={`tel:${restaurant.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call</span>
                </a>
              )}
              
              <button
                onClick={handleShareClick}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-700"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
            
            {distance && (
              <span className="text-sm text-gray-500">
                {formatDistance(distance)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

// Mobile-optimized restaurant list
interface MobileRestaurantListProps {
  restaurants: Restaurant[];
  userLocation?: { latitude: number; longitude: number };
  onFavoriteToggle?: (restaurantId: string, isFavorite: boolean) => void;
  onShare?: (restaurant: Restaurant) => void;
  favorites?: Set<string>;
  loading?: boolean;
  className?: string;
}

export function MobileRestaurantList({
  restaurants,
  userLocation,
  onFavoriteToggle,
  onShare,
  favorites = new Set(),
  loading = false,
  className = '',
}: MobileRestaurantListProps) {
  const handleShare = (restaurant: Restaurant) => {
    if (navigator.share) {
      navigator.share({
        title: restaurant.name,
        text: `Check out ${restaurant.name} on YumZoom!`,
        url: `${window.location.origin}/restaurants/${restaurant.id}`,
      }).catch((err) => {
        console.log('Error sharing:', err);
        // Fallback to custom share
        onShare?.(restaurant);
      });
    } else {
      onShare?.(restaurant);
    }
  };

  const handleNavigate = (restaurant: Restaurant) => {
    if (restaurant.address) {
      const encodedAddress = encodeURIComponent(restaurant.address);
      window.open(
        `https://maps.google.com/maps?daddr=${encodedAddress}`,
        '_blank'
      );
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {restaurants.map((restaurant) => {
        const distance = userLocation && restaurant.latitude && restaurant.longitude
          ? calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              restaurant.latitude,
              restaurant.longitude
            )
          : undefined;

        return (
          <MobileRestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            distance={distance}
            onFavoriteToggle={onFavoriteToggle}
            onShare={handleShare}
            onNavigate={handleNavigate}
            isFavorite={favorites.has(restaurant.id)}
          />
        );
      })}
    </div>
  );
}

// Helper function for distance calculation (duplicated for standalone use)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
