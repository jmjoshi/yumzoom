import React, { useState, useEffect } from 'react';
import { Star, StarHalf, ThumbsUp, ThumbsDown, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { 
  RestaurantWithCharacteristics, 
  UserRestaurantRatingWithDetails, 
  CreateRestaurantRating,
  RestaurantCharacteristicsBreakdown 
} from '@/types/restaurant';

interface RestaurantCharacteristicsProps {
  restaurantId: string;
  onRatingSubmitted?: () => void;
}

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  onRatingChange, 
  interactive = false, 
  size = 'md',
  label 
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
          <Star
            key={value}
            className={`${sizeClasses[size]} ${
              interactive ? 'cursor-pointer' : ''
            } ${
              value <= displayRating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            } transition-colors duration-150`}
            onClick={() => handleClick(value)}
            onMouseEnter={() => handleMouseEnter(value)}
            onMouseLeave={handleMouseLeave}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {displayRating}/10
        </span>
      </div>
    </div>
  );
};

const RestaurantCharacteristics: React.FC<RestaurantCharacteristicsProps> = ({
  restaurantId,
  onRatingSubmitted
}) => {
  const [restaurant, setRestaurant] = useState<RestaurantWithCharacteristics | null>(null);
  const [userRatings, setUserRatings] = useState<UserRestaurantRatingWithDetails[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [userRating, setUserRating] = useState<CreateRestaurantRating>({
    restaurant_id: restaurantId,
    ambience_rating: 8,
    decor_rating: 8,
    service_rating: 8,
    cleanliness_rating: 8,
    noise_level_rating: 5,
    value_for_money_rating: 7,
    food_quality_rating: 8,
    overall_rating: 8,
    review_text: '',
    visit_date: new Date().toISOString().split('T')[0],
    would_recommend: true
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRestaurantCharacteristics();
  }, [restaurantId]);

  const fetchRestaurantCharacteristics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/restaurants/${restaurantId}/characteristics`);
      const data = await response.json();
      
      if (response.ok) {
        setRestaurant(data.restaurant);
        setUserRatings(data.user_ratings || []);
        setRatingDistribution(data.rating_distribution || {});
      } else {
        console.error('Error fetching restaurant characteristics:', data.error);
      }
    } catch (error) {
      console.error('Error fetching restaurant characteristics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async () => {
    try {
      setSubmitting(true);
      
      const response = await fetch(`/api/restaurants/${restaurantId}/characteristics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer user-${Date.now()}` // Simplified auth for demo
        },
        body: JSON.stringify(userRating)
      });

      if (response.ok) {
        setShowRatingForm(false);
        await fetchRestaurantCharacteristics();
        onRatingSubmitted?.();
      } else {
        const error = await response.json();
        console.error('Error submitting rating:', error);
        alert('Failed to submit rating. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateRating = (field: keyof CreateRestaurantRating, value: any) => {
    setUserRating(prev => ({ ...prev, [field]: value }));
  };

  const characteristicLabels = {
    ambience: 'Ambience',
    decor: 'Decor & Design',
    service: 'Service Quality',
    cleanliness: 'Cleanliness',
    noise_level: 'Noise Level',
    value_for_money: 'Value for Money',
    food_quality: 'Food Quality',
    overall: 'Overall Experience'
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Restaurant not found</p>
      </div>
    );
  }

  const characteristics = restaurant.characteristics;

  return (
    <div className="space-y-8">
      {/* Restaurant Characteristics Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Restaurant Ratings & Reviews
          </h2>
          <button
            onClick={() => setShowRatingForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Rate This Restaurant
          </button>
        </div>

        {characteristics && characteristics.total_ratings_count > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.entries(characteristicLabels).map(([key, label]) => {
              const rating = characteristics[`${key}_rating` as keyof typeof characteristics] as number;
              return (
                <div key={key} className="text-center">
                  <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
                  <div className="flex items-center justify-center">
                    <StarRating rating={rating} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No ratings yet. Be the first to rate this restaurant!</p>
          </div>
        )}

        {characteristics && characteristics.total_ratings_count > 0 && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600">
              Based on {characteristics.total_ratings_count} rating{characteristics.total_ratings_count !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Rating Form Modal */}
      {showRatingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Rate {restaurant.name}
                </h3>
                <button
                  onClick={() => setShowRatingForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Rating Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(characteristicLabels).map(([key, label]) => (
                    <StarRating
                      key={key}
                      label={label}
                      rating={userRating[`${key}_rating` as keyof CreateRestaurantRating] as number}
                      onRatingChange={(rating) => updateRating(`${key}_rating` as keyof CreateRestaurantRating, rating)}
                      interactive
                      size="md"
                    />
                  ))}
                </div>

                {/* Visit Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visit Date
                  </label>
                  <input
                    type="date"
                    value={userRating.visit_date}
                    onChange={(e) => updateRating('visit_date', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Review (Optional)
                  </label>
                  <textarea
                    value={userRating.review_text}
                    onChange={(e) => updateRating('review_text', e.target.value)}
                    placeholder="Share your experience at this restaurant..."
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Would Recommend */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">
                    Would you recommend this restaurant?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateRating('would_recommend', true)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                        userRating.would_recommend
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Yes
                    </button>
                    <button
                      onClick={() => updateRating('would_recommend', false)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                        !userRating.would_recommend
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      No
                    </button>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    onClick={() => setShowRatingForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRatingSubmit}
                    disabled={submitting}
                    className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                      submitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {submitting ? 'Submitting...' : 'Submit Rating'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Reviews */}
      {userRatings.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Customer Reviews ({userRatings.length})
          </h3>
          
          <div className="space-y-6">
            {userRatings.map((rating) => (
              <div key={rating.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {rating.user_profile?.avatar_url ? (
                      <img
                        src={rating.user_profile.avatar_url}
                        alt={`${rating.user_profile.first_name} ${rating.user_profile.last_name}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {rating.user_profile?.first_name?.[0] || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">
                        {rating.user_profile?.first_name} {rating.user_profile?.last_name}
                      </span>
                      <span className="text-gray-500 text-sm">•</span>
                      <StarRating rating={rating.overall_rating} size="sm" />
                      {rating.would_recommend && (
                        <>
                          <span className="text-gray-500 text-sm">•</span>
                          <span className="text-green-600 text-sm font-medium">
                            Recommends
                          </span>
                        </>
                      )}
                    </div>
                    
                    {rating.review_text && (
                      <p className="text-gray-700 mb-3">{rating.review_text}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {rating.visit_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Visited {new Date(rating.visit_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4">
                        <button className="flex items-center gap-1 hover:text-green-600 transition-colors">
                          <ThumbsUp className="w-4 h-4" />
                          <span>Helpful ({rating.helpful_count})</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-red-600 transition-colors">
                          <ThumbsDown className="w-4 h-4" />
                          <span>Not helpful ({rating.not_helpful_count})</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantCharacteristics;
