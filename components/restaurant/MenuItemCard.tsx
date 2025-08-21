'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StarRating } from '@/components/ui/Rating';
import { MenuItemWithRatings, UserRating, CreateRating } from '@/types/restaurant';
import { FamilyMember } from '@/types/user';
import { formatRating, cn } from '@/lib/utils';
import { Edit, Trash2, Plus, MessageSquare, Star } from 'lucide-react';
import { QuickAddFamilyMember } from './QuickAddFamilyMember';
import { EnhancedRatingForm } from './EnhancedRatingForm';
import { ReviewDisplay } from './ReviewDisplay';
import { ReviewStats } from './ReviewStats';

interface MenuItemCardProps {
  menuItem: MenuItemWithRatings;
  userRatings?: UserRating[];
  allReviews?: UserRating[];
  familyMembers?: FamilyMember[];
  onRate: (rating: CreateRating) => void;
  onUpdateRating: (ratingId: string, rating: number, reviewText?: string) => void;
  onDeleteRating: (ratingId: string) => void;
  onFamilyMemberAdded?: () => void;
  onHelpfulVote?: (reviewId: string, isHelpful: boolean) => void;
  currentUserId?: string;
  showAllReviews?: boolean;
}

export function MenuItemCard({ 
  menuItem, 
  userRatings = [], 
  allReviews = [],
  familyMembers = [],
  onRate,
  onUpdateRating,
  onDeleteRating,
  onFamilyMemberAdded,
  onHelpfulVote,
  currentUserId,
  showAllReviews = false
}: MenuItemCardProps) {
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [editingRating, setEditingRating] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showAllReviewsState, setShowAllReviewsState] = useState(showAllReviews);

  const handleSubmitRating = (rating: CreateRating) => {
    onRate(rating);
    setShowRatingForm(false);
  };

  const handleEditReview = (review: UserRating) => {
    setEditingRating(review.id);
    // Here you would open an edit form similar to the rating form
    // For now, we'll just show a placeholder
    console.log('Edit review:', review);
  };

  const handleReportReview = (reviewId: string) => {
    // Implementation for reporting reviews
    console.log('Report review:', reviewId);
  };

  // Get all reviews (from all users) - use allReviews prop instead of userRatings
  const reviewsForStats = allReviews.filter(rating => {
    try {
      return rating.rating > 0;
    } catch (error) {
      // Fallback for old schema - just check for rating
      return rating.rating > 0;
    }
  });

  // Show limited reviews initially
  const reviewsToShow = showAllReviewsState ? reviewsForStats : reviewsForStats.slice(0, 3);
  const hasMoreReviews = reviewsForStats.length > 3;

  // Calculate simple stats from available data with error handling
  const reviewStats = {
    total_reviews: reviewsForStats.length,
    average_rating: reviewsForStats.length > 0 
      ? reviewsForStats.reduce((sum, r) => sum + r.rating, 0) / reviewsForStats.length 
      : 0,
    reviews_with_photos: reviewsForStats.filter(r => {
      try {
        return r.photos?.length;
      } catch {
        return false;
      }
    }).length,
    reviews_with_text: reviewsForStats.filter(r => {
      try {
        return r.review_text?.trim();
      } catch {
        return false;
      }
    }).length,
    rating_distribution: reviewsForStats.reduce((dist, r) => {
      dist[r.rating.toString()] = (dist[r.rating.toString()] || 0) + 1;
      return dist;
    }, {} as Record<string, number>)
  };

  return (
    <Card className="h-full">
      <div className="relative h-32 w-full">
        {!imageError ? (
          <Image
            src={menuItem.image_url || '/placeholder-food.jpg'}
            alt={menuItem.name}
            fill
            className="object-cover rounded-t-lg"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-t-lg">
            <span className="text-gray-500 text-sm">Image not available</span>
          </div>
        )}
      </div>
      
      <CardHeader>
        <CardTitle className="text-lg">{menuItem.name}</CardTitle>
        <div className="flex items-center justify-between">
          {menuItem.average_rating && menuItem.average_rating > 0 ? (
            <div className="flex items-center space-x-2">
              <StarRating value={menuItem.average_rating} size="sm" />
              <span className="text-sm text-gray-600">
                ({reviewsForStats.length} {reviewsForStats.length === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-500">No reviews yet</span>
          )}
          {menuItem.price && (
            <span className="text-lg font-semibold text-green-600">
              ${menuItem.price.toFixed(2)}
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {menuItem.description && (
          <p className="text-gray-600 text-sm">{menuItem.description}</p>
        )}
        
        {menuItem.category && (
          <span className="inline-block bg-secondary-100 text-secondary-800 text-xs px-2 py-1 rounded-full">
            {menuItem.category}
          </span>
        )}

        {/* Review Statistics */}
        {reviewsForStats.length > 0 && (
          <ReviewStats stats={reviewStats} className="mb-4" />
        )}

        {/* Existing Reviews */}
        {reviewsToShow.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700 flex items-center">
                <MessageSquare className="h-4 w-4 mr-1" />
                Reviews ({reviewsForStats.length})
              </h4>
              {hasMoreReviews && !showAllReviewsState && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllReviewsState(true)}
                  className="text-xs"
                >
                  Show all
                </Button>
              )}
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {reviewsToShow.map((rating) => (
                <ReviewDisplay
                  key={rating.id}
                  review={rating}
                  currentUserId={currentUserId}
                  onHelpfulVote={onHelpfulVote}
                  onEdit={handleEditReview}
                  onDelete={onDeleteRating}
                  onReport={handleReportReview}
                />
              ))}
            </div>
            
            {showAllReviewsState && hasMoreReviews && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllReviewsState(false)}
                className="w-full text-xs"
              >
                Show less
              </Button>
            )}
          </div>
        )}

        {/* Rating Form Toggle */}
        {!showRatingForm && (
          <div className="border-t pt-4">
            <Button
              onClick={() => setShowRatingForm(true)}
              className="w-full"
              variant="outline"
            >
              <Star className="h-4 w-4 mr-2" />
              Write a Review
            </Button>
          </div>
        )}

        {/* Enhanced Rating Form */}
        {showRatingForm && !showQuickAdd && (
          <div className="border-t pt-4">
            <EnhancedRatingForm
              menuItemId={menuItem.id}
              familyMembers={familyMembers}
              onSubmit={handleSubmitRating}
              onCancel={() => setShowRatingForm(false)}
            />
          </div>
        )}

        {/* Quick Add Family Member */}
        {showQuickAdd && (
          <div className="border-t pt-4">
            <QuickAddFamilyMember
              onMemberAdded={() => {
                setShowQuickAdd(false);
                if (onFamilyMemberAdded) onFamilyMemberAdded();
              }}
              onCancel={() => setShowQuickAdd(false)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}