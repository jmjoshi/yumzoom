'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Rating } from '@/components/ui/Rating';
import { PhotoUpload } from '@/components/ui/PhotoUpload';
import { FamilyMember } from '@/types/user';
import { CreateRating } from '@/types/restaurant';
import { cn } from '@/lib/utils';
import { Star, MessageSquare, Camera, User } from 'lucide-react';

interface EnhancedRatingFormProps {
  menuItemId: string;
  familyMembers: FamilyMember[];
  onSubmit: (rating: CreateRating) => void;
  onCancel?: () => void;
  className?: string;
  isSubmitting?: boolean;
}

export function EnhancedRatingForm({
  menuItemId,
  familyMembers,
  onSubmit,
  onCancel,
  className = '',
  isSubmitting = false
}: EnhancedRatingFormProps) {
  const [rating, setRating] = useState(0);
  const [familyMemberId, setFamilyMemberId] = useState<string>('');
  const [reviewText, setReviewText] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const characterLimit = 500;
  const remainingChars = characterLimit - reviewText.length;

  const handleSubmit = () => {
    if (rating === 0) return;

    const ratingData: CreateRating = {
      menu_item_id: menuItemId,
      rating,
      family_member_id: familyMemberId || undefined,
      review_text: reviewText.trim() || undefined,
      notes: notes.trim() || undefined,
      photos: photos.length > 0 ? photos : undefined
    };

    onSubmit(ratingData);
  };

  const resetForm = () => {
    setRating(0);
    setFamilyMemberId('');
    setReviewText('');
    setPhotos([]);
    setNotes('');
    setShowAdvanced(false);
  };

  const handleCancel = () => {
    resetForm();
    onCancel?.();
  };

  const isValid = rating > 0;
  const hasContent = reviewText.trim() || photos.length > 0;

  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Star className="h-5 w-5 text-yellow-500 mr-2" />
          Write a Review
        </h3>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
        )}
      </div>

      {/* Family Member Selection */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <User className="h-4 w-4 mr-1" />
          Rating for:
        </label>
        <select
          value={familyMemberId}
          onChange={(e) => setFamilyMemberId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Yourself</option>
          {familyMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} ({member.relationship})
            </option>
          ))}
        </select>
      </div>

      {/* Rating */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Your Rating *
        </label>
        <div className={cn(
          "p-4 rounded-lg border-2 transition-colors",
          rating === 0 
            ? "border-dashed border-gray-300 bg-gray-50" 
            : "border-solid border-primary-200 bg-primary-50"
        )}>
          <Rating
            value={rating}
            onChange={setRating}
            size="lg"
            showValue={true}
          />
          {rating === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Click stars to rate this item (1-10)
            </p>
          )}
        </div>
      </div>

      {/* Written Review */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <MessageSquare className="h-4 w-4 mr-1" />
          Share your experience (optional)
        </label>
        <div className="relative">
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Tell other families about your experience with this dish. What did you like? How was the taste, presentation, or value?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[100px] resize-none"
            maxLength={characterLimit}
          />
          <div className="absolute bottom-2 right-2 text-xs text-gray-500">
            {remainingChars} characters left
          </div>
        </div>
        {reviewText.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs text-green-600">
              <MessageSquare className="h-3 w-3 mr-1" />
              Great! Written reviews help other families.
            </div>
          </div>
        )}
      </div>

      {/* Photo Upload */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <Camera className="h-4 w-4 mr-1" />
          Add photos (optional)
        </label>
        <PhotoUpload
          photos={photos}
          onPhotosChange={setPhotos}
          maxPhotos={3}
          maxSizeKB={5000}
        />
        {photos.length > 0 && (
          <div className="flex items-center text-xs text-blue-600">
            <Camera className="h-3 w-3 mr-1" />
            Excellent! Photos make reviews more helpful.
          </div>
        )}
      </div>

      {/* Advanced Options Toggle */}
      <div className="border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {showAdvanced ? 'Hide' : 'Show'} additional options
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Private notes (only you can see these)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Personal notes about this dish for your family's reference..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                rows={2}
              />
            </div>
          </div>
        )}
      </div>

      {/* Review Guidelines */}
      {(reviewText.length > 0 || photos.length > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-blue-900 mb-1">
            Tips for helpful reviews:
          </h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Describe taste, texture, and presentation</li>
            <li>• Mention family-friendly aspects</li>
            <li>• Include portion size and value</li>
            <li>• Be honest and constructive</li>
          </ul>
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className={cn(
            "flex-1 transition-all duration-200",
            !isValid 
              ? "opacity-50 cursor-not-allowed" 
              : "hover:scale-105 shadow-md"
          )}
          size="lg"
        >
          {isSubmitting ? (
            'Submitting...'
          ) : (
            `Submit Review${rating > 0 ? ` (${rating}/10)` : ''}`
          )}
        </Button>
        
        {hasContent && (
          <Button
            variant="outline"
            onClick={resetForm}
            disabled={isSubmitting}
            size="lg"
          >
            Clear Form
          </Button>
        )}
      </div>

      {/* Form Status */}
      {rating === 0 && (
        <p className="text-center text-sm text-gray-500">
          Please select a rating to continue
        </p>
      )}
      
      {rating > 0 && !hasContent && (
        <p className="text-center text-sm text-green-600">
          ✓ Ready to submit! Consider adding a written review or photos to help other families.
        </p>
      )}
    </div>
  );
}
