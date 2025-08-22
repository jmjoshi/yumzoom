'use client';

import React, { useState, useEffect } from 'react';
import { Restaurant } from '@/types/restaurant';
import { Calendar, Clock, Users, Phone, Globe, ExternalLink, AlertCircle } from 'lucide-react';

interface ReservationIntegrationProps {
  restaurant: Restaurant;
  onReservationMade?: (reservationId: string) => void;
}

interface ReservationProvider {
  id: string;
  name: string;
  logo: string;
  supportsApi: boolean;
}

interface BookingOption {
  provider: string;
  name: string;
  logo: string;
  bookingUrl: string;
  instructions: string;
}

export function ReservationIntegration({ restaurant, onReservationMade }: ReservationIntegrationProps) {
  const [providers, setProviders] = useState<ReservationProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBookingOptions, setShowBookingOptions] = useState(false);
  const [bookingOptions, setBookingOptions] = useState<BookingOption[]>([]);
  const [reservationForm, setReservationForm] = useState({
    partySize: 2,
    date: '',
    time: '19:00',
    specialRequests: '',
    userName: '',
    userEmail: '',
    userPhone: '',
  });

  // Load available providers
  useEffect(() => {
    loadProviders();
  }, [restaurant.id]);

  const loadProviders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/integrations/reservations?restaurantId=${restaurant.id}`);
      const data = await response.json();
      
      if (data.success) {
        setProviders(data.providers);
      }
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMakeReservation = async () => {
    if (!reservationForm.userName || !reservationForm.userEmail || 
        !reservationForm.date || !reservationForm.time) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/integrations/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          partySize: reservationForm.partySize,
          date: reservationForm.date,
          time: reservationForm.time,
          specialRequests: reservationForm.specialRequests,
          userEmail: reservationForm.userEmail,
          userName: reservationForm.userName,
          userPhone: reservationForm.userPhone,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        if (data.reservationId) {
          // Direct API booking successful
          alert(`Reservation confirmed! Confirmation number: ${data.confirmationNumber}`);
          onReservationMade?.(data.reservationId);
        } else if (data.manualBooking) {
          // Manual booking options provided
          setBookingOptions(data.bookingOptions);
          setShowBookingOptions(true);
        }
      } else {
        alert(data.message || 'Failed to make reservation. Please try again.');
      }
    } catch (error) {
      console.error('Reservation error:', error);
      alert('Error making reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold">Restaurant Reservations</h3>
        </div>
        <p className="text-gray-600">Loading reservation options...</p>
      </div>
    );
  }

  if (showBookingOptions) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold">Complete Your Reservation</h3>
        </div>
        
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Reservation Details</span>
          </div>
          <p className="text-blue-800">
            {reservationForm.partySize} guests on {new Date(reservationForm.date).toLocaleDateString()} at {reservationForm.time}
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Choose a booking method:</h4>
          
          {bookingOptions.map((option) => (
            <div key={option.provider} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium">{option.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">{option.name}</h5>
                    <p className="text-sm text-gray-600">{option.instructions}</p>
                  </div>
                </div>
                <a
                  href={option.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Book Now
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}

          <div className="border-t pt-4">
            <h5 className="font-medium text-gray-900 mb-2">Direct Contact</h5>
            <div className="space-y-2">
              {restaurant.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${restaurant.phone}`} className="hover:text-blue-600">
                    {restaurant.phone}
                  </a>
                </div>
              )}
              {restaurant.website && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Globe className="h-4 w-4" />
                  <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                    Visit Website
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowBookingOptions(false)}
          className="mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Back to Reservation Form
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold">Make a Reservation</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Party Size *
            </label>
            <select
              value={reservationForm.partySize}
              onChange={(e) => setReservationForm(prev => ({ ...prev, partySize: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(size => (
                <option key={size} value={size}>
                  {size} {size === 1 ? 'person' : 'people'}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              value={reservationForm.date}
              onChange={(e) => setReservationForm(prev => ({ ...prev, date: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time *
            </label>
            <select
              value={reservationForm.time}
              onChange={(e) => setReservationForm(prev => ({ ...prev, time: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {generateTimeSlots().map(time => (
                <option key={time} value={time}>{formatTime(time)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name *
            </label>
            <input
              type="text"
              value={reservationForm.userName}
              onChange={(e) => setReservationForm(prev => ({ ...prev, userName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your full name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={reservationForm.userEmail}
              onChange={(e) => setReservationForm(prev => ({ ...prev, userEmail: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="your.email@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number (optional)
          </label>
          <input
            type="tel"
            value={reservationForm.userPhone}
            onChange={(e) => setReservationForm(prev => ({ ...prev, userPhone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Special Requests (optional)
          </label>
          <textarea
            value={reservationForm.specialRequests}
            onChange={(e) => setReservationForm(prev => ({ ...prev, specialRequests: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Dietary restrictions, special occasion, seating preferences, etc."
          />
        </div>

        {providers.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Available through:</h4>
            <div className="flex flex-wrap gap-2">
              {providers.map((provider) => (
                <div key={provider.id} className="flex items-center gap-2 bg-white px-3 py-1 rounded-full text-sm">
                  <span>{provider.name}</span>
                  {provider.supportsApi && <span className="text-green-600 text-xs">✓ Direct booking</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleMakeReservation}
          disabled={isSubmitting || !reservationForm.userName || !reservationForm.userEmail || !reservationForm.date}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Calendar className="h-5 w-5" />
          {isSubmitting ? 'Processing...' : 'Make Reservation'}
        </button>
      </div>
    </div>
  );
}

// Helper functions
function generateTimeSlots(): string[] {
  const slots = [];
  for (let hour = 11; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  return slots;
}

function formatTime(time: string): string {
  const [hour, minute] = time.split(':');
  const hourNum = parseInt(hour);
  const period = hourNum >= 12 ? 'PM' : 'AM';
  const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
  return `${displayHour}:${minute} ${period}`;
}
