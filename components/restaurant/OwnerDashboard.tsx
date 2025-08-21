import { useState, useEffect } from 'react';
import { Star, MessageSquare, TrendingUp, Users, Eye, Reply, Edit, Trash2 } from 'lucide-react';
import { useRestaurantOwner } from '@/hooks/useRestaurantOwner';
import ResponseModal from './ResponseModal';
import type { OwnerDashboardStats } from '@/types/restaurant-owner';

export default function OwnerDashboard() {
  const { 
    dashboardData, 
    loading, 
    error,
    createResponse,
    updateResponse,
    deleteResponse,
    refreshDashboard 
  } = useRestaurantOwner();

  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<any>(null);

  useEffect(() => {
    refreshDashboard();
  }, []);

  const handleRespond = (review: any) => {
    setSelectedReview(review);
    setEditingResponse(null);
    setIsResponseModalOpen(true);
  };

  const handleEditResponse = (review: any, response: any) => {
    setSelectedReview(review);
    setEditingResponse(response);
    setIsResponseModalOpen(true);
  };

  const handleDeleteResponse = async (responseId: string) => {
    if (window.confirm('Are you sure you want to delete this response?')) {
      await deleteResponse(responseId);
    }
  };

  const handleResponseSubmit = async (responseText: string) => {
    if (editingResponse) {
      const success = await updateResponse({
        response_id: editingResponse.id,
        response_text: responseText
      });
      if (success) {
        setIsResponseModalOpen(false);
        setSelectedReview(null);
        setEditingResponse(null);
      }
    } else {
      const success = await createResponse({
        rating_id: selectedReview.id,
        response_text: responseText
      });
      if (success) {
        setIsResponseModalOpen(false);
        setSelectedReview(null);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-600';
    if (rating >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!dashboardData.length) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Verified Restaurants</h3>
        <p className="text-gray-600">
          You don't have any verified restaurants yet. Submit a verification request to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {dashboardData.map((restaurant) => (
        <div key={restaurant.restaurant_id} className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Restaurant Header */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{restaurant.restaurant_name}</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Reviews</p>
                    <p className="text-2xl font-bold text-blue-900">{restaurant.total_reviews}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Average Rating</p>
                    <div className="flex items-center space-x-1">
                      <p className="text-2xl font-bold text-yellow-900">
                        {restaurant.average_rating || 'N/A'}
                      </p>
                      {restaurant.average_rating && (
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      )}
                    </div>
                  </div>
                  <Star className="w-8 h-8 text-yellow-500" />
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Responses</p>
                    <p className="text-2xl font-bold text-green-900">{restaurant.reviews_with_responses}</p>
                  </div>
                  <Reply className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Pending</p>
                    <p className="text-2xl font-bold text-orange-900">{restaurant.pending_responses}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reviews</h3>
            
            {restaurant.recent_reviews && restaurant.recent_reviews.length > 0 ? (
              <div className="space-y-4">
                {restaurant.recent_reviews.slice(0, 10).map((review) => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          {[...Array(10)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`font-semibold ${getRatingColor(review.rating)}`}>
                          {review.rating}/10
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{review.user_name}</p>
                        <p className="text-xs text-gray-500">{formatDate(review.created_at)}</p>
                      </div>
                    </div>

                    {review.review_text && (
                      <p className="text-gray-700 mb-3">{review.review_text}</p>
                    )}

                    {review.has_response ? (
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mt-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-800 mb-1">Your Response:</p>
                            <p className="text-blue-700">{/* Response text would be loaded separately */}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditResponse(review, { /* response data */ })}
                              className="text-blue-600 hover:text-blue-700"
                              title="Edit response"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteResponse('response-id')}
                              className="text-red-600 hover:text-red-700"
                              title="Delete response"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRespond(review)}
                        className="mt-3 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                      >
                        <Reply className="w-4 h-4 inline mr-2" />
                        Respond to Review
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No reviews yet</p>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Response Modal */}
      <ResponseModal
        isOpen={isResponseModalOpen}
        onClose={() => {
          setIsResponseModalOpen(false);
          setSelectedReview(null);
          setEditingResponse(null);
        }}
        onSubmit={handleResponseSubmit}
        review={selectedReview}
        existingResponse={editingResponse?.response_text}
        isEditing={!!editingResponse}
      />
    </div>
  );
}
