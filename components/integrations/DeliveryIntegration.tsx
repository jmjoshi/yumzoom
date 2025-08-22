'use client';

import React, { useState, useEffect } from 'react';
import { Restaurant } from '@/types/restaurant';
import { Truck, Clock, DollarSign, ExternalLink, MapPin } from 'lucide-react';

interface DeliveryIntegrationProps {
  restaurant: Restaurant;
  userLocation?: { lat: number; lng: number; address?: string };
}

interface DeliveryOption {
  provider: string;
  providerName: string;
  logo: string;
  deliveryTime: string;
  deliveryFee: number;
  minimumOrder: number;
  isAvailable: boolean;
  deepLink: string;
}

export function DeliveryIntegration({ restaurant, userLocation }: DeliveryIntegrationProps) {
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  useEffect(() => {
    loadDeliveryOptions();
  }, [restaurant.id, userLocation]);

  const loadDeliveryOptions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          providers: [], // Empty array to get all providers
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setDeliveryOptions(data.deliveryOptions);
      }
    } catch (error) {
      console.error('Error loading delivery options:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderDelivery = (option: DeliveryOption) => {
    // Track delivery click for analytics
    trackDeliveryClick(option.provider);
    
    // Open delivery app/website
    window.open(option.deepLink, '_blank', 'noopener,noreferrer');
  };

  const trackDeliveryClick = async (provider: string) => {
    try {
      // In a real implementation, you'd track this for analytics
      console.log(`Delivery click tracked: ${provider} for restaurant ${restaurant.id}`);
    } catch (error) {
      console.error('Error tracking delivery click:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Truck className="h-6 w-6 text-green-600" />
          <h3 className="text-lg font-semibold">Food Delivery</h3>
        </div>
        <p className="text-gray-600">Checking delivery options...</p>
      </div>
    );
  }

  if (deliveryOptions.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Truck className="h-6 w-6 text-gray-400" />
          <h3 className="text-lg font-semibold">Food Delivery</h3>
        </div>
        <div className="text-center py-8">
          <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">Delivery not available</p>
          <p className="text-sm text-gray-500">
            This restaurant may not offer delivery or may be outside the delivery area.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center gap-3 mb-4">
        <Truck className="h-6 w-6 text-green-600" />
        <h3 className="text-lg font-semibold">Food Delivery</h3>
      </div>

      {userLocation?.address && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg">
          <MapPin className="h-4 w-4" />
          <span>Delivering to: {userLocation.address}</span>
        </div>
      )}

      <div className="space-y-4">
        {deliveryOptions.map((option) => (
          <div
            key={option.provider}
            className={`border rounded-lg p-4 transition-all ${
              selectedProvider === option.provider 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-gray-300'
            } ${!option.isAvailable ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-600">
                    {option.providerName.charAt(0)}
                  </span>
                </div>
                
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{option.providerName}</h4>
                  
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{option.deliveryTime}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>${option.deliveryFee.toFixed(2)} delivery</span>
                    </div>
                    
                    <div className="text-gray-500">
                      ${option.minimumOrder.toFixed(2)} min
                    </div>
                  </div>
                  
                  {!option.isAvailable && (
                    <p className="text-sm text-red-600 mt-1">
                      Currently unavailable in your area
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleOrderDelivery(option)}
                disabled={!option.isAvailable}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  option.isAvailable
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Order Now
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>

            {selectedProvider === option.provider && option.isAvailable && (
              <div className="mt-4 pt-4 border-t border-green-200">
                <div className="bg-green-50 p-3 rounded-lg">
                  <h5 className="font-medium text-green-900 mb-2">Ready to order from {restaurant.name}?</h5>
                  <p className="text-sm text-green-800 mb-3">
                    You'll be redirected to {option.providerName} to complete your order. 
                    Your YumZoom ratings and reviews for this restaurant will help you choose what to order!
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOrderDelivery(option)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
                    >
                      Continue to {option.providerName}
                    </button>
                    <button
                      onClick={() => setSelectedProvider(null)}
                      className="bg-white text-green-600 border border-green-600 px-4 py-2 rounded-lg text-sm hover:bg-green-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tip</h4>
        <p className="text-sm text-blue-800">
          Check your YumZoom ratings for menu items before ordering! 
          Your family's favorite dishes from {restaurant.name} are just a tap away.
        </p>
      </div>
    </div>
  );
}
