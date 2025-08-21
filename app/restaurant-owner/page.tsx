'use client';

import { useState, useEffect } from 'react';
import { Building2, Shield, MessageSquare, TrendingUp, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurantOwner } from '@/hooks/useRestaurantOwner';
import OwnerVerificationForm from '@/components/restaurant/OwnerVerificationForm';
import OwnerDashboard from '@/components/restaurant/OwnerDashboard';

// Mock restaurants data - in real app this would come from API
const MOCK_RESTAURANTS = [
  { id: '1', name: 'The Gourmet Bistro', address: '123 Main St, Anytown, ST 12345' },
  { id: '2', name: 'Sakura Sushi', address: '456 Oak Ave, Anytown, ST 12345' },
  { id: '3', name: "Mama Mia's", address: '789 Pine St, Anytown, ST 12345' },
  { id: '4', name: 'Spice Garden', address: '321 Elm St, Anytown, ST 12345' },
];

export default function RestaurantOwnerPage() {
  const { user } = useAuth();
  const { ownerStatus, loading, refreshOwnerStatus } = useRestaurantOwner();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'verification'>('dashboard');

  useEffect(() => {
    if (user) {
      refreshOwnerStatus();
    }
  }, [user]);

  // Check if user has any verified restaurants
  const hasVerifiedRestaurants = ownerStatus.some(status => status.verification_status === 'verified');
  
  // Default to verification tab if no verified restaurants
  useEffect(() => {
    if (!loading && !hasVerifiedRestaurants) {
      setActiveTab('verification');
    }
  }, [loading, hasVerifiedRestaurants]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-4">
            Please sign in to access the restaurant owner dashboard.
          </p>
          <a
            href="/signin"
            className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Building2 className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Restaurant Owner Dashboard</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Manage your restaurant presence, respond to customer reviews, and engage with your community on YumZoom.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare className="w-5 h-5 inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'verification'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="w-5 h-5 inline mr-2" />
              Verification
              {ownerStatus.some(s => s.verification_status === 'pending') && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                  Pending
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <div>
                {hasVerifiedRestaurants ? (
                  <OwnerDashboard />
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to YumZoom for Business</h2>
                    <p className="text-gray-600 mb-6">
                      Get verified as a restaurant owner to start responding to customer reviews and engaging with your community.
                    </p>
                    <button
                      onClick={() => setActiveTab('verification')}
                      className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                    >
                      Get Verified Now
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'verification' && (
              <OwnerVerificationForm
                restaurants={MOCK_RESTAURANTS}
                onSuccess={() => {
                  refreshOwnerStatus();
                  if (hasVerifiedRestaurants) {
                    setActiveTab('dashboard');
                  }
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Features Section */}
      {!hasVerifiedRestaurants && (
        <div className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Verify Your Restaurant?</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Join thousands of restaurant owners who use YumZoom to connect with families and build lasting relationships.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Respond to Reviews</h3>
                <p className="text-gray-600">
                  Engage directly with customers, address concerns, and thank them for their feedback.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Performance</h3>
                <p className="text-gray-600">
                  Monitor your restaurant's ratings, reviews, and customer satisfaction trends.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Build Trust</h3>
                <p className="text-gray-600">
                  Show potential customers that you care about their experience and feedback.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
