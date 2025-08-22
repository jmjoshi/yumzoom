'use client';

import React from 'react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { 
  Calendar, 
  Utensils, 
  Truck, 
  Share2, 
  CheckCircle, 
  XCircle,
  Settings,
  ExternalLink,
  Trash2,
  Plus,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function IntegrationsPage() {
  const {
    integrations,
    reservations,
    calendarEvents,
    isLoading,
    connectCalendar,
    disconnectIntegration,
    cancelReservation,
    getIntegrationStatus,
  } = useIntegrations();

  const integrationTypes = [
    {
      id: 'calendar',
      name: 'Calendar Integration',
      description: 'Connect your calendar to plan dining events and track restaurant visits.',
      icon: Calendar,
      color: 'blue',
      providers: ['google', 'outlook'],
    },
    {
      id: 'reservation',
      name: 'Reservation Systems',
      description: 'Book tables directly through integrated reservation platforms.',
      icon: Utensils,
      color: 'green',
      providers: ['opentable', 'resy', 'yelp'],
    },
    {
      id: 'delivery',
      name: 'Food Delivery',
      description: 'Order food for delivery from your favorite rated restaurants.',
      icon: Truck,
      color: 'orange',
      providers: ['doordash', 'ubereats', 'grubhub'],
    },
    {
      id: 'social',
      name: 'Social Media',
      description: 'Share your dining experiences and restaurant recommendations.',
      icon: Share2,
      color: 'purple',
      providers: ['facebook', 'twitter', 'instagram', 'whatsapp', 'linkedin'],
    },
  ];

  const handleConnect = async (type: string, provider: string) => {
    try {
      if (type === 'calendar') {
        await connectCalendar(provider);
      } else {
        // For other types, they don't require OAuth setup in this implementation
        alert(`${provider} integration is automatically available. Use it from restaurant pages!`);
      }
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect. Please try again.');
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    if (confirm('Are you sure you want to disconnect this integration?')) {
      try {
        await disconnectIntegration(integrationId);
      } catch (error) {
        console.error('Disconnect error:', error);
        alert('Failed to disconnect. Please try again.');
      }
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (confirm('Are you sure you want to cancel this reservation?')) {
      try {
        await cancelReservation(reservationId);
      } catch (error) {
        console.error('Cancel error:', error);
        alert('Failed to cancel reservation. Please try again.');
      }
    }
  };

  const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
      google: 'Google Calendar',
      outlook: 'Microsoft Outlook',
      opentable: 'OpenTable',
      resy: 'Resy',
      yelp: 'Yelp Reservations',
      doordash: 'DoorDash',
      ubereats: 'Uber Eats',
      grubhub: 'Grubhub',
      facebook: 'Facebook',
      twitter: 'Twitter',
      instagram: 'Instagram',
      whatsapp: 'WhatsApp',
      linkedin: 'LinkedIn',
    };
    return names[provider] || provider;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading integrations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Third-Party Integrations</h1>
          <p className="text-gray-600 mt-2">
            Connect YumZoom with your favorite services to enhance your dining experience.
          </p>
        </div>

        {/* Integration Types */}
        <div className="space-y-8">
          {integrationTypes.map((type) => {
            const Icon = type.icon;
            const userIntegrations = integrations.filter(i => i.integration_type === type.id);
            
            return (
              <div key={type.id} className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-lg bg-${type.color}-100`}>
                      <Icon className={`h-6 w-6 text-${type.color}-600`} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{type.name}</h2>
                      <p className="text-gray-600">{type.description}</p>
                    </div>
                  </div>

                  {/* Providers */}
                  <div className="space-y-3">
                    {type.providers.map((provider) => {
                      const integration = userIntegrations.find(i => i.provider === provider);
                      const isConnected = integration?.is_active;

                      return (
                        <div key={provider} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {getProviderName(provider).charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{getProviderName(provider)}</h3>
                              <div className="flex items-center gap-2">
                                {isConnected ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-sm text-green-600">Connected</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-500">Not connected</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isConnected ? (
                              <button
                                onClick={() => handleDisconnect(integration.id)}
                                className="flex items-center gap-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="h-4 w-4" />
                                Disconnect
                              </button>
                            ) : (
                              <button
                                onClick={() => handleConnect(type.id, provider)}
                                className={`flex items-center gap-2 px-4 py-2 bg-${type.color}-600 text-white rounded-lg hover:bg-${type.color}-700`}
                              >
                                <Plus className="h-4 w-4" />
                                Connect
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Reservations */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Recent Reservations
              </h3>
            </div>
            <div className="p-6">
              {reservations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No reservations yet</p>
              ) : (
                <div className="space-y-4">
                  {reservations.slice(0, 5).map((reservation) => (
                    <div key={reservation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          Party of {reservation.party_size}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(reservation.reservation_date).toLocaleDateString()} at {reservation.reservation_time}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {reservation.status}
                          </span>
                          <span className="text-xs text-gray-500">{reservation.provider}</span>
                        </div>
                      </div>
                      {reservation.status === 'confirmed' && (
                        <button
                          onClick={() => handleCancelReservation(reservation.id)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Calendar Events */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendar Events
              </h3>
            </div>
            <div className="p-6">
              {calendarEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No calendar events yet</p>
              ) : (
                <div className="space-y-4">
                  {calendarEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">{event.event_title}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(event.event_date).toLocaleDateString()} at {event.event_time}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span>{event.duration_hours}h</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-xs">{event.provider}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">How to Use Integrations</h3>
              <div className="space-y-2 text-blue-800 text-sm">
                <p>• <strong>Calendar:</strong> Connect your calendar to automatically create dining events when you make reservations.</p>
                <p>• <strong>Reservations:</strong> Book tables directly from restaurant pages through OpenTable, Resy, and other platforms.</p>
                <p>• <strong>Delivery:</strong> Order food for delivery with one click from your favorite rated restaurants.</p>
                <p>• <strong>Social Media:</strong> Share your dining experiences and restaurant recommendations with friends and family.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
