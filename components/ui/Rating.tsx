'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  maxRating?: number;
  showValue?: boolean;
  className?: string;
}

export function Rating({
  value,
  onChange,
  readonly = false,
  size = 'md',
  maxRating = 10,
  showValue = true,
  className,
}: RatingProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleHover = (rating: number) => {
    if (!readonly) {
      // Could add hover state here if needed
    }
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, i) => {
          const rating = i + 1;
          const isFilled = rating <= value;
          
          return (
            <div
              key={i}
              className={cn(
                'inline-flex transition-all duration-150',
                !readonly && 'cursor-pointer hover:scale-110 active:scale-95'
              )}
              onClick={() => handleClick(rating)}
              onMouseEnter={() => handleHover(rating)}
              title={`Rate ${rating} out of ${maxRating}`}
            >
              <Star
                className={cn(
                  sizes[size],
                  'transition-colors duration-150',
                  isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300',
                  !readonly && 'hover:text-yellow-400',
                  !readonly && !isFilled && 'hover:fill-yellow-200'
                )}
              />
            </div>
          );
        })}
      </div>
      {showValue && value > 0 && (
        <span className="text-sm font-medium text-gray-700 ml-2">
          {value}/{maxRating}
        </span>
      )}
      {showValue && value === 0 && !readonly && (
        <span className="text-sm text-gray-500 ml-2 italic">
          Click to rate
        </span>
      )}
    </div>
  );
}

interface StarRatingProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StarRating({ value, size = 'md', className }: StarRatingProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  // Convert 1-10 rating to 1-5 stars
  const starRating = Math.round(value / 2);
  
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: 5 }, (_, i) => {
        const isFilled = i < starRating;
        
        return (
          <Star
            key={i}
            className={cn(
              sizes[size],
              isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            )}
          />
        );
      })}
      <span className="text-sm font-medium text-gray-700 ml-2">
        {value.toFixed(1)}
      </span>
    </div>
  );
}