import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingDisplayProps {
  rating: number;
  maxRating?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showValue?: boolean;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

interface InteractiveStarRatingProps extends StarRatingDisplayProps {
  onRatingChange: (rating: number) => void;
  interactive: true;
}

interface StaticStarRatingProps extends StarRatingDisplayProps {
  interactive?: false;
  onRatingChange?: never;
}

type StarRatingProps = InteractiveStarRatingProps | StaticStarRatingProps;

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 10,
  size = 'md',
  showValue = false,
  showLabel = false,
  label,
  className = '',
  interactive = false,
  onRatingChange
}) => {
  const [hoverRating, setHoverRating] = useState<number>(0);

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  const handleStarClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleStarHover = (value: number) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {showLabel && label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      
      <div className="flex items-center gap-1">
        <div className="flex items-center" onMouseLeave={handleMouseLeave}>
          {Array.from({ length: maxRating }, (_, index) => {
            const starValue = index + 1;
            const isStarFilled = starValue <= displayRating;
            
            return (
              <Star
                key={starValue}
                className={`${sizeClasses[size]} ${
                  interactive ? 'cursor-pointer hover:scale-110' : ''
                } ${
                  isStarFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200'
                } transition-all duration-150`}
                onClick={() => handleStarClick(starValue)}
                onMouseEnter={() => handleStarHover(starValue)}
              />
            );
          })}
        </div>
        
        {showValue && (
          <span className={`ml-2 text-gray-600 ${
            size === 'xs' ? 'text-xs' : 
            size === 'sm' ? 'text-sm' : 
            size === 'lg' ? 'text-base' : 'text-sm'
          }`}>
            {displayRating}/{maxRating}
          </span>
        )}
      </div>
    </div>
  );
};

export default StarRating;
