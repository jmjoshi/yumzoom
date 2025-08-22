'use client';

import React, { useState } from 'react';
import { Restaurant } from '@/types/restaurant';
import { CalendarIntegration } from './CalendarIntegration';
import { ReservationIntegration } from './ReservationIntegration';
import { DeliveryIntegration } from './DeliveryIntegration';
import { SocialSharing } from './SocialSharing';
import { Calendar, Utensils, Truck, Share2, X } from 'lucide-react';

interface IntegrationHubProps {
  restaurant: Restaurant;
  rating?: number;
  review?: string;
  userLocation?: { lat: number; lng: number; address?: string };
  isOpen?: boolean;
  onClose?: () => void;
}

type IntegrationType = 'calendar' | 'reservations' | 'delivery' | 'social';

export function IntegrationHub({ 
  restaurant, 
  rating, 
  review, 
  userLocation, 
  isOpen = false, 
  onClose 
}: IntegrationHubProps) {
  const [activeTab, setActiveTab] = useState<IntegrationType>('reservations');

  const tabs = [
    {
      id: 'reservations' as IntegrationType,
      label: 'Reservations',
      icon: Utensils,
      description: 'Book a table',
    },
    {
      id: 'delivery' as IntegrationType,
      label: 'Delivery',
      icon: Truck,
      description: 'Order food',
    },
    {
      id: 'calendar' as IntegrationType,
      label: 'Calendar',
      icon: Calendar,
      description: 'Plan dining',
    },
    {
      id: 'social' as IntegrationType,
      label: 'Share',
      icon: Share2,
      description: 'Share experience',
    },
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Third-Party Integrations</h2>
            <p className="text-gray-600 mt-1">
              Connect {restaurant.name} with your favorite services
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Restaurant Info */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center gap-4">
            {restaurant.image_url && (
              <img
                src={restaurant.image_url}
                alt={restaurant.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{restaurant.name}</h3>
              <p className="text-gray-600">
                {restaurant.cuisine_type} • {restaurant.address}
              </p>
              {restaurant.rating && (
                <p className="text-sm text-yellow-600">
                  ⭐ {restaurant.rating.toFixed(1)}/10 • {restaurant.review_count || 0} reviews
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 text-sm font-medium border-b-2 transition-colors min-w-0 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <div className="text-left">
                  <div>{tab.label}</div>
                  <div className="text-xs text-gray-400">{tab.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
          {activeTab === 'calendar' && (
            <CalendarIntegration
              restaurant={restaurant}
              onEventCreated={(eventId) => {
                console.log('Calendar event created:', eventId);
              }}
            />
          )}

          {activeTab === 'reservations' && (
            <ReservationIntegration
              restaurant={restaurant}
              onReservationMade={(reservationId) => {
                console.log('Reservation made:', reservationId);
              }}
            />
          )}

          {activeTab === 'delivery' && (
            <DeliveryIntegration
              restaurant={restaurant}
              userLocation={userLocation}
            />
          )}

          {activeTab === 'social' && (
            <SocialSharing
              restaurant={restaurant}
              rating={rating}
              review={review}
              onShare={(platform) => {
                console.log('Shared on:', platform);
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Powered by YumZoom • Third-party services may apply their own terms
            </p>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simplified integration button component for restaurant pages
interface IntegrationButtonProps {
  restaurant: Restaurant;
  rating?: number;
  review?: string;
  userLocation?: { lat: number; lng: number; address?: string };
  variant?: 'full' | 'compact';
  className?: string;
}

export function IntegrationButton({ 
  restaurant, 
  rating, 
  review, 
  userLocation,
  variant = 'full',
  className = ''
}: IntegrationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${className}`}
        >
          <Share2 className="h-4 w-4" />
          More Options
        </button>
        
        <IntegrationHub
          restaurant={restaurant}
          rating={rating}
          review={review}
          userLocation={userLocation}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
  }

  const quickActions = [
    {
      id: 'reservation',
      label: 'Book Table',
      icon: Utensils,
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      id: 'delivery',
      label: 'Order Food',
      icon: Truck,
      color: 'bg-orange-600 hover:bg-orange-700',
    },
    {
      id: 'share',
      label: 'Share',
      icon: Share2,
      color: 'bg-purple-600 hover:bg-purple-700',
    },
  ];

  return (
    <>
      <div className={`space-y-3 ${className}`}>
        <h4 className="font-medium text-gray-900">Quick Actions</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => setIsOpen(true)}
                className={`flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg transition-colors ${action.color}`}
              >
                <Icon className="h-5 w-5" />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
      
      <IntegrationHub
        restaurant={restaurant}
        rating={rating}
        review={review}
        userLocation={userLocation}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
