'use client';

import type { ReviewStats } from '@/types/restaurant';
import { StarRating } from '@/components/ui/Rating';
import { Camera, MessageSquare, Star, Users } from 'lucide-react';

interface ReviewStatsProps {
  stats: ReviewStats;
  className?: string;
}

export function ReviewStats({ stats, className = '' }: ReviewStatsProps) {
  const { 
    total_reviews, 
    average_rating, 
    reviews_with_photos, 
    reviews_with_text, 
    rating_distribution 
  } = stats;

  // Calculate percentages
  const photosPercentage = total_reviews > 0 ? Math.round((reviews_with_photos / total_reviews) * 100) : 0;
  const textPercentage = total_reviews > 0 ? Math.round((reviews_with_text / total_reviews) * 100) : 0;

  // Prepare rating distribution for display (1-10 scale)
  const ratingBars = [];
  for (let rating = 10; rating >= 1; rating--) {
    const count = rating_distribution[rating.toString()] || 0;
    const percentage = total_reviews > 0 ? (count / total_reviews) * 100 : 0;
    ratingBars.push({ rating, count, percentage });
  }

  if (total_reviews === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 text-center ${className}`}>
        <div className="text-gray-500">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No reviews yet</p>
          <p className="text-xs text-gray-400 mt-1">Be the first to share your experience!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 space-y-6 ${className}`}>
      {/* Summary Stats */}
      <div className="text-center border-b border-gray-100 pb-4">
        <div className="flex items-center justify-center mb-2">
          <StarRating value={average_rating} size="lg" />
          <span className="text-2xl font-bold text-primary-600 ml-2">
            {average_rating.toFixed(1)}
          </span>
          <span className="text-gray-500 ml-1">/10</span>
        </div>
        <p className="text-sm text-gray-600">
          Based on {total_reviews} {total_reviews === 1 ? 'review' : 'reviews'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Camera className="h-4 w-4 text-blue-500 mr-1" />
            <span className="text-sm font-medium text-gray-700">With Photos</span>
          </div>
          <p className="text-lg font-semibold text-blue-600">{photosPercentage}%</p>
          <p className="text-xs text-gray-500">{reviews_with_photos} reviews</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <MessageSquare className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm font-medium text-gray-700">With Text</span>
          </div>
          <p className="text-lg font-semibold text-green-600">{textPercentage}%</p>
          <p className="text-xs text-gray-500">{reviews_with_text} reviews</p>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Rating Distribution</h4>
        {ratingBars.map(({ rating, count, percentage }) => (
          <div key={rating} className="flex items-center space-x-2">
            <div className="flex items-center w-8">
              <span className="text-xs text-gray-600">{rating}</span>
              <Star className="h-3 w-3 text-yellow-400 ml-1" />
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
          </div>
        ))}
      </div>

      {/* Additional Insights */}
      {total_reviews >= 5 && (
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Insights</h4>
          <div className="space-y-1 text-xs text-gray-600">
            {average_rating >= 8 && (
              <p className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Highly rated by families
              </p>
            )}
            {photosPercentage >= 50 && (
              <p className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Great visual reviews
              </p>
            )}
            {textPercentage >= 70 && (
              <p className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Detailed written feedback
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
