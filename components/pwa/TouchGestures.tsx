'use client';

import { useRef, useEffect, useState, ReactNode } from 'react';

interface TouchGestureProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onTap?: () => void;
  onLongPress?: () => void;
  className?: string;
  threshold?: number;
  longPressDelay?: number;
}

export function TouchGesture({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinch,
  onTap,
  onLongPress,
  className = '',
  threshold = 50,
  longPressDelay = 500,
}: TouchGestureProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [initialDistance, setInitialDistance] = useState<number | null>(null);

  const minSwipeDistance = threshold;

  const getTouchPosition = (e: TouchEvent) => ({
    x: e.touches[0].clientX,
    y: e.touches[0].clientY,
  });

  const getTouchDistance = (e: TouchEvent) => {
    if (e.touches.length < 2) return null;
    
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchStart = (e: TouchEvent) => {
    const touch = getTouchPosition(e);
    setTouchEnd(null);
    setTouchStart(touch);
    setIsLongPress(false);

    // Handle pinch gesture
    if (e.touches.length === 2 && onPinch) {
      const distance = getTouchDistance(e);
      setInitialDistance(distance);
    }

    // Start long press timer
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        setIsLongPress(true);
        onLongPress();
        
        // Add haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }, longPressDelay);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchStart) return;

    // Cancel long press if user moves finger
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Handle pinch gesture
    if (e.touches.length === 2 && onPinch && initialDistance) {
      const currentDistance = getTouchDistance(e);
      if (currentDistance) {
        const scale = currentDistance / initialDistance;
        onPinch(scale);
      }
    }

    const currentTouch = getTouchPosition(e);
    setTouchEnd(currentTouch);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!touchStart || !touchEnd) {
      // Handle tap if no movement detected
      if (!isLongPress && onTap) {
        onTap();
      }
      return;
    }

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    // Determine primary direction
    const primaryDirection = Math.abs(distanceX) > Math.abs(distanceY) ? 'horizontal' : 'vertical';

    if (primaryDirection === 'horizontal') {
      if (isLeftSwipe && onSwipeLeft) {
        onSwipeLeft();
      } else if (isRightSwipe && onSwipeRight) {
        onSwipeRight();
      }
    } else {
      if (isUpSwipe && onSwipeUp) {
        onSwipeUp();
      } else if (isDownSwipe && onSwipeDown) {
        onSwipeDown();
      }
    }

    // Reset pinch state
    setInitialDistance(null);
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStart, touchEnd, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onPinch, onTap, onLongPress]);

  return (
    <div
      ref={elementRef}
      className={`touch-manipulation ${className}`}
      style={{ touchAction: onPinch ? 'none' : 'pan-y' }}
    >
      {children}
    </div>
  );
}

// Swipeable card component
interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon: ReactNode;
    color: string;
    label: string;
  };
  rightAction?: {
    icon: ReactNode;
    color: string;
    label: string;
  };
  className?: string;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className = '',
}: SwipeableCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = () => {
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !cardRef.current) return;

    const touch = e.touches[0];
    const rect = cardRef.current.getBoundingClientRect();
    const offset = touch.clientX - rect.left - rect.width / 2;
    
    // Limit swipe to reasonable bounds
    const maxOffset = rect.width * 0.3;
    const constrainedOffset = Math.max(-maxOffset, Math.min(maxOffset, offset));
    
    setSwipeOffset(constrainedOffset);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    const threshold = 80;
    
    if (swipeOffset < -threshold && onSwipeLeft) {
      onSwipeLeft();
    } else if (swipeOffset > threshold && onSwipeRight) {
      onSwipeRight();
    }
    
    // Reset position
    setSwipeOffset(0);
  };

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, swipeOffset]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Left action */}
      {leftAction && (
        <div
          className={`absolute inset-y-0 left-0 flex items-center justify-center w-20 ${leftAction.color} text-white transition-opacity ${
            swipeOffset > 20 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex flex-col items-center">
            {leftAction.icon}
            <span className="text-xs mt-1">{leftAction.label}</span>
          </div>
        </div>
      )}

      {/* Right action */}
      {rightAction && (
        <div
          className={`absolute inset-y-0 right-0 flex items-center justify-center w-20 ${rightAction.color} text-white transition-opacity ${
            swipeOffset < -20 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex flex-col items-center">
            {rightAction.icon}
            <span className="text-xs mt-1">{rightAction.label}</span>
          </div>
        </div>
      )}

      {/* Card content */}
      <div
        ref={cardRef}
        className="relative bg-white transition-transform duration-200 ease-out"
        style={{
          transform: `translateX(${swipeOffset}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Pull to refresh component
interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  className = '',
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const threshold = 80;

  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (window.scrollY > 0 || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      e.preventDefault();
      setIsPulling(true);
      setPullDistance(Math.min(diff * 0.5, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      
      // Add haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center bg-amber-50 border-b border-amber-200 transition-all duration-200 ease-out"
        style={{
          height: `${pullDistance}px`,
          opacity: isPulling ? 1 : 0,
        }}
      >
        <div className="flex flex-col items-center text-amber-600">
          <div
            className={`transition-transform duration-200 ${
              pullDistance >= threshold ? 'rotate-180' : ''
            }`}
          >
            {isRefreshing ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-600 border-t-transparent" />
            ) : (
              <div className="text-xl">↓</div>
            )}
          </div>
          <span className="text-xs mt-1">
            {isRefreshing
              ? 'Refreshing...'
              : pullDistance >= threshold
              ? 'Release to refresh'
              : 'Pull to refresh'}
          </span>
        </div>
      </div>

      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${isPulling ? pullDistance : 0}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
