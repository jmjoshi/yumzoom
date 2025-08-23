'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { StarRating } from '@/components/ui/Rating';
import { UserRating, ReviewVote } from '@/types/restaurant';
import { formatRating, cn, formatDate } from '@/lib/utils';
import { ContentReport, QualityScore, TrustScore } from '@/components/moderation/ContentReport';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Flag,
  Calendar,
  User,
  Shield,
  Award
} from 'lucide-react';

interface ReviewDisplayProps {
  review: UserRating;
  currentUserId?: string;
  onHelpfulVote?: (reviewId: string, isHelpful: boolean) => void;
  onEdit?: (review: UserRating) => void;
  onDelete?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
  className?: string;
  showActions?: boolean;
  showModerationInfo?: boolean;
  qualityScore?: number;
  userTrustScore?: number;
}

export function ReviewDisplay({
  review,
  currentUserId,
  onHelpfulVote,
  onEdit,
  onDelete,
  onReport,
  className = '',
  showActions = true,
  showModerationInfo = false,
  qualityScore,
  userTrustScore
}: ReviewDisplayProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const isOwnReview = currentUserId === review.user_id;
  const hasVoted = review.user_vote !== undefined;
  const userVotedHelpful = review.user_vote?.is_helpful === true;
  const userVotedNotHelpful = review.user_vote?.is_helpful === false;

  const handleVote = (isHelpful: boolean) => {
    if (!onHelpfulVote || !currentUserId || isOwnReview) return;
    
    // If user already voted the same way, remove vote; otherwise add/change vote
    if ((isHelpful && userVotedHelpful) || (!isHelpful && userVotedNotHelpful)) {
      // Remove vote by toggling (this would need API support)
      return;
    }
    
    onHelpfulVote(review.id, isHelpful);
  };

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const closePhotoModal = () => {
    setSelectedPhotoIndex(null);
  };

  // Add safety checks for new properties
  const hasReviewText = review.review_text && review.review_text.trim().length > 0;
  const hasPhotos = review.photos && Array.isArray(review.photos) && review.photos.length > 0;

  return (
    <>
      <div className={cn("bg-white border border-gray-200 rounded-lg p-4 space-y-3", className)}>
        {/* Header with user info and rating */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gray-100 rounded-full p-2">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">
                  {review.family_member?.name || 'Anonymous Reviewer'}
                </span>
                {review.family_member?.relationship && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {review.family_member.relationship}
                  </span>
                )}
                {/* Trust Score Display */}
                {showModerationInfo && userTrustScore && (
                  <TrustScore 
                    trustScore={userTrustScore} 
                    showDetails={false}
                    className="ml-2"
                  />
                )}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <StarRating value={review.rating} size="sm" />
                <span className="text-sm font-semibold text-primary-600">
                  {formatRating(review.rating)}/10
                </span>
                {/* Quality Score Display */}
                {showModerationInfo && qualityScore && (
                  <QualityScore 
                    score={qualityScore} 
                    showDetails={false}
                    className="ml-2"
                  />
                )}
              </div>
            </div>
          </div>
          
          {showActions && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              
              {showMenu && (
                <div className="absolute right-0 top-8 bg-white shadow-lg border border-gray-200 rounded-md py-1 z-10 min-w-[120px]">
                  {isOwnReview ? (
                    <>
                      {onEdit && (
                        <button
                          onClick={() => {
                            onEdit(review);
                            setShowMenu(false);
                          }}
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <Edit className="h-3 w-3 mr-2" />
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => {
                            onDelete(review.id);
                            setShowMenu(false);
                          }}
                          className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete
                        </button>
                      )}
                    </>
                  ) : (
                    onReport && (
                      <ContentReport
                        contentType="review"
                        contentId={review.id}
                        triggerComponent={
                          <button className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left">
                            <Flag className="h-3 w-3 mr-2" />
                            Report
                          </button>
                        }
                      />
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Review text */}
        {hasReviewText && (
          <div className="text-gray-700 text-sm leading-relaxed">
            {review.review_text}
            {review.is_edited && (
              <span className="text-xs text-gray-500 ml-2 italic">
                (edited {review.edited_at ? formatDate(review.edited_at) : ''})
              </span>
            )}
          </div>
        )}

        {/* Photos */}
        {hasPhotos && (
          <div className="grid grid-cols-3 gap-2">
            {review.photos!.slice(0, 3).map((photo, index) => (
              <div
                key={photo.id}
                className="aspect-square relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handlePhotoClick(index)}
              >
                <Image
                  src={photo.photo_url}
                  alt={`Review photo ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Footer with date and helpfulness */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3 w-3 mr-1" />
            {review.created_at ? formatDate(review.created_at) : 'Unknown date'}
          </div>
          
          {showActions && onHelpfulVote && !isOwnReview && currentUserId && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Helpful?</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote(true)}
                className={cn(
                  "h-7 px-2 text-xs",
                  userVotedHelpful ? "bg-green-50 text-green-700" : "text-gray-600"
                )}
                disabled={!currentUserId}
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                {review.helpful_count ?? 0}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote(false)}
                className={cn(
                  "h-7 px-2 text-xs",
                  userVotedNotHelpful ? "bg-red-50 text-red-700" : "text-gray-600"
                )}
                disabled={!currentUserId}
              >
                <ThumbsDown className="h-3 w-3 mr-1" />
                {review.not_helpful_count ?? 0}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhotoIndex !== null && hasPhotos && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closePhotoModal}
        >
          <div className="max-w-4xl max-h-full relative">
            <Image
              src={review.photos![selectedPhotoIndex].photo_url}
              alt={`Review photo ${selectedPhotoIndex + 1}`}
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={closePhotoModal}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white hover:bg-opacity-75"
            >
              ×
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
