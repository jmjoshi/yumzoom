'use client';

import { useRef, useEffect, useState, ReactNode, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowUp, MoreHorizontal, X, RotateCcw } from 'lucide-react';

interface AdvancedGestureProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinchZoom?: (scale: number) => void;
  onRotate?: (angle: number) => void;
  onLongPress?: (x: number, y: number) => void;
  onDoubleTap?: (x: number, y: number) => void;
  onTripleTap?: () => void;
  onTwoFingerTap?: () => void;
  onThreeFingerTap?: () => void;
  onFourFingerSwipe?: (direction: 'left' | 'right' | 'up' | 'down') => void;
  className?: string;
  enableHapticFeedback?: boolean;
  gestureThreshold?: number;
  velocityThreshold?: number;
}

interface TouchPoint {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

interface GestureState {
  touches: TouchPoint[];
  startTime: number;
  lastTapTime: number;
  tapCount: number;
  initialDistance: number | null;
  initialAngle: number | null;
  isLongPress: boolean;
  longPressTimer: NodeJS.Timeout | null;
  initialCenter: { x: number; y: number } | null;
}

export function AdvancedGesture({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinchZoom,
  onRotate,
  onLongPress,
  onDoubleTap,
  onTripleTap,
  onTwoFingerTap,
  onThreeFingerTap,
  onFourFingerSwipe,
  className = '',
  enableHapticFeedback = true,
  gestureThreshold = 50,
  velocityThreshold = 0.5,
}: AdvancedGestureProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const gestureState = useRef<GestureState>({
    touches: [],
    startTime: 0,
    lastTapTime: 0,
    tapCount: 0,
    initialDistance: null,
    initialAngle: null,
    isLongPress: false,
    longPressTimer: null,
    initialCenter: null,
  });

  const [activeGesture, setActiveGesture] = useState<string | null>(null);

  // Haptic feedback utility
  const hapticFeedback = useCallback((pattern: number | number[] = 50) => {
    if (enableHapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, [enableHapticFeedback]);

  // Get touch center point
  const getTouchCenter = (touches: TouchPoint[]): { x: number; y: number } => {
    const x = touches.reduce((sum, touch) => sum + touch.x, 0) / touches.length;
    const y = touches.reduce((sum, touch) => sum + touch.y, 0) / touches.length;
    return { x, y };
  };

  // Get distance between two touches
  const getTouchDistance = (touch1: TouchPoint, touch2: TouchPoint): number => {
    return Math.sqrt(
      Math.pow(touch2.x - touch1.x, 2) + Math.pow(touch2.y - touch1.y, 2)
    );
  };

  // Get angle between two touches
  const getTouchAngle = (touch1: TouchPoint, touch2: TouchPoint): number => {
    return Math.atan2(touch2.y - touch1.y, touch2.x - touch1.x) * (180 / Math.PI);
  };

  // Convert TouchEvent to TouchPoint array
  const touchEventToPoints = (e: TouchEvent): TouchPoint[] => {
    return Array.from(e.touches).map((touch, index) => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    }));
  };

  // Handle touch start
  const handleTouchStart = (e: TouchEvent) => {
    const touches = touchEventToPoints(e);
    const state = gestureState.current;
    
    state.touches = touches;
    state.startTime = Date.now();
    state.isLongPress = false;
    
    // Clear existing long press timer
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }

    // Handle multi-touch gestures
    if (touches.length === 2) {
      state.initialDistance = getTouchDistance(touches[0], touches[1]);
      state.initialAngle = getTouchAngle(touches[0], touches[1]);
      state.initialCenter = getTouchCenter(touches);
      setActiveGesture('pinch/rotate');
    } else if (touches.length === 1) {
      // Start long press timer
      state.longPressTimer = setTimeout(() => {
        state.isLongPress = true;
        setActiveGesture('long-press');
        hapticFeedback([50, 50, 100]);
        onLongPress?.(touches[0].x, touches[0].y);
      }, 500);
      
      setActiveGesture('single-touch');
    } else if (touches.length >= 3) {
      setActiveGesture(`${touches.length}-finger`);
    }

    // Prevent default behavior for multi-touch
    if (touches.length > 1) {
      e.preventDefault();
    }
  };

  // Handle touch move
  const handleTouchMove = (e: TouchEvent) => {
    const touches = touchEventToPoints(e);
    const state = gestureState.current;

    if (touches.length !== state.touches.length) return;

    // Cancel long press if finger moves significantly
    if (state.longPressTimer && touches.length === 1) {
      const initialTouch = state.touches[0];
      const currentTouch = touches[0];
      const distance = getTouchDistance(initialTouch, currentTouch);
      
      if (distance > 10) {
        clearTimeout(state.longPressTimer);
        state.longPressTimer = null;
      }
    }

    // Handle pinch and rotation
    if (touches.length === 2 && state.initialDistance && state.initialAngle) {
      const currentDistance = getTouchDistance(touches[0], touches[1]);
      const currentAngle = getTouchAngle(touches[0], touches[1]);
      
      // Pinch zoom
      if (onPinchZoom) {
        const scale = currentDistance / state.initialDistance;
        onPinchZoom(scale);
      }
      
      // Rotation
      if (onRotate) {
        const angleDiff = currentAngle - state.initialAngle;
        onRotate(angleDiff);
      }
    }

    state.touches = touches;
    e.preventDefault();
  };

  // Handle touch end
  const handleTouchEnd = (e: TouchEvent) => {
    const state = gestureState.current;
    const endTime = Date.now();
    const duration = endTime - state.startTime;
    
    // Clear long press timer
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }

    // Handle tap gestures
    if (!state.isLongPress && duration < 300 && state.touches.length === 1) {
      const timeSinceLastTap = endTime - state.lastTapTime;
      
      if (timeSinceLastTap < 500) {
        state.tapCount++;
      } else {
        state.tapCount = 1;
      }
      
      state.lastTapTime = endTime;
      
      // Handle multiple taps
      setTimeout(() => {
        if (state.tapCount === 1) {
          // Single tap - no action needed, handled by click events
        } else if (state.tapCount === 2) {
          hapticFeedback([25, 25]);
          onDoubleTap?.(state.touches[0].x, state.touches[0].y);
        } else if (state.tapCount === 3) {
          hapticFeedback([25, 25, 25, 25]);
          onTripleTap?.();
        }
        state.tapCount = 0;
      }, 300);
    }

    // Handle multi-finger taps
    if (!state.isLongPress && duration < 300) {
      if (state.touches.length === 2) {
        hapticFeedback([30, 30]);
        onTwoFingerTap?.();
      } else if (state.touches.length === 3) {
        hapticFeedback([30, 30, 30]);
        onThreeFingerTap?.();
      }
    }

    // Handle swipe gestures for single finger
    if (state.touches.length === 1 && !state.isLongPress && duration < 500) {
      const startTouch = state.touches[0];
      const remainingTouches = Array.from(e.changedTouches);
      
      if (remainingTouches.length > 0) {
        const endTouch = {
          x: remainingTouches[0].clientX,
          y: remainingTouches[0].clientY,
        };
        
        const deltaX = endTouch.x - startTouch.x;
        const deltaY = endTouch.y - startTouch.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const velocity = distance / duration;
        
        if (distance > gestureThreshold && velocity > velocityThreshold) {
          const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
          
          // Determine swipe direction
          if (Math.abs(angle) < 45) {
            hapticFeedback(30);
            onSwipeRight?.();
          } else if (Math.abs(angle) > 135) {
            hapticFeedback(30);
            onSwipeLeft?.();
          } else if (angle > 45 && angle < 135) {
            hapticFeedback(30);
            onSwipeDown?.();
          } else if (angle < -45 && angle > -135) {
            hapticFeedback(30);
            onSwipeUp?.();
          }
        }
      }
    }

    // Handle four-finger swipe
    if (state.touches.length === 4 && duration < 300) {
      const startCenter = getTouchCenter(state.touches);
      const endTouches = Array.from(e.changedTouches).map(touch => ({
        x: touch.clientX,
        y: touch.clientY,
      }));
      
      if (endTouches.length === 4) {
        const endCenter = {
          x: endTouches.reduce((sum, touch) => sum + touch.x, 0) / 4,
          y: endTouches.reduce((sum, touch) => sum + touch.y, 0) / 4,
        };
        
        const deltaX = endCenter.x - startCenter.x;
        const deltaY = endCenter.y - startCenter.y;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          hapticFeedback([40, 40, 40, 40]);
          onFourFingerSwipe?.(deltaX > 0 ? 'right' : 'left');
        } else {
          hapticFeedback([40, 40, 40, 40]);
          onFourFingerSwipe?.(deltaY > 0 ? 'down' : 'up');
        }
      }
    }

    setActiveGesture(null);
    
    // Reset gesture state
    state.touches = [];
    state.initialDistance = null;
    state.initialAngle = null;
    state.initialCenter = null;
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Add event listeners with passive: false for preventDefault
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  return (
    <div
      ref={elementRef}
      className={`relative touch-manipulation ${className}`}
      style={{
        touchAction: 'none', // Disable default touch behaviors
        userSelect: 'none',
      }}
    >
      {children}
      
      {/* Gesture indicator */}
      {activeGesture && (
        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs z-10">
          {activeGesture}
        </div>
      )}
    </div>
  );
}

// Enhanced swipeable card with gesture controls
interface AdvancedSwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinchZoom?: () => void;
  onRotate?: () => void;
  onLongPress?: () => void;
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
  upAction?: {
    icon: ReactNode;
    color: string;
    label: string;
  };
  downAction?: {
    icon: ReactNode;
    color: string;
    label: string;
  };
  className?: string;
}

export function AdvancedSwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinchZoom,
  onRotate,
  onLongPress,
  leftAction,
  rightAction,
  upAction,
  downAction,
  className = '',
}: AdvancedSwipeableCardProps) {
  const [transform, setTransform] = useState('');
  const [showActions, setShowActions] = useState(false);

  const handleSwipe = (direction: string) => {
    setShowActions(true);
    
    // Animate the swipe
    switch (direction) {
      case 'left':
        setTransform('translateX(-100%)');
        setTimeout(() => onSwipeLeft?.(), 200);
        break;
      case 'right':
        setTransform('translateX(100%)');
        setTimeout(() => onSwipeRight?.(), 200);
        break;
      case 'up':
        setTransform('translateY(-100%)');
        setTimeout(() => onSwipeUp?.(), 200);
        break;
      case 'down':
        setTransform('translateY(100%)');
        setTimeout(() => onSwipeDown?.(), 200);
        break;
    }

    // Reset after animation
    setTimeout(() => {
      setTransform('');
      setShowActions(false);
    }, 300);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Action indicators */}
      {showActions && (
        <>
          {leftAction && (
            <div className={`absolute inset-y-0 left-0 flex items-center justify-center w-20 ${leftAction.color} text-white z-10`}>
              <div className="flex flex-col items-center">
                {leftAction.icon}
                <span className="text-xs mt-1">{leftAction.label}</span>
              </div>
            </div>
          )}
          
          {rightAction && (
            <div className={`absolute inset-y-0 right-0 flex items-center justify-center w-20 ${rightAction.color} text-white z-10`}>
              <div className="flex flex-col items-center">
                {rightAction.icon}
                <span className="text-xs mt-1">{rightAction.label}</span>
              </div>
            </div>
          )}
          
          {upAction && (
            <div className={`absolute inset-x-0 top-0 flex items-center justify-center h-20 ${upAction.color} text-white z-10`}>
              <div className="flex flex-col items-center">
                {upAction.icon}
                <span className="text-xs mt-1">{upAction.label}</span>
              </div>
            </div>
          )}
          
          {downAction && (
            <div className={`absolute inset-x-0 bottom-0 flex items-center justify-center h-20 ${downAction.color} text-white z-10`}>
              <div className="flex flex-col items-center">
                {downAction.icon}
                <span className="text-xs mt-1">{downAction.label}</span>
              </div>
            </div>
          )}
        </>
      )}

      <AdvancedGesture
        onSwipeLeft={() => handleSwipe('left')}
        onSwipeRight={() => handleSwipe('right')}
        onSwipeUp={() => handleSwipe('up')}
        onSwipeDown={() => handleSwipe('down')}
        onPinchZoom={onPinchZoom}
        onRotate={onRotate}
        onLongPress={onLongPress}
      >
        <div
          className="transition-transform duration-200 ease-out"
          style={{ transform }}
        >
          {children}
        </div>
      </AdvancedGesture>
    </div>
  );
}

// Gesture-enabled image viewer
interface GestureImageViewerProps {
  src: string;
  alt: string;
  onClose?: () => void;
  className?: string;
}

export function GestureImageViewer({ src, alt, onClose, className = '' }: GestureImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const resetTransform = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className={`fixed inset-0 bg-black z-50 flex items-center justify-center ${className}`}>
      {/* Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <button
          onClick={resetTransform}
          className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        
        {onClose && (
          <button
            onClick={onClose}
            className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Gesture instructions */}
      <div className="absolute bottom-4 left-4 right-4 text-center z-10">
        <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
          Pinch to zoom • Rotate with two fingers • Double tap to reset
        </div>
      </div>

      <AdvancedGesture
        onPinchZoom={(newScale) => setScale(Math.max(0.5, Math.min(5, newScale)))}
        onRotate={(angle) => setRotation(rotation + angle * 0.1)}
        onDoubleTap={resetTransform}
        onTripleTap={onClose}
        className="w-full h-full flex items-center justify-center"
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain transition-transform duration-100"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
          }}
        />
      </AdvancedGesture>
    </div>
  );
}

// Gesture tutorial component
interface GestureTutorialProps {
  onClose?: () => void;
}

export function GestureTutorial({ onClose }: GestureTutorialProps = {}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const steps = [
    {
      title: "Single Finger Gestures",
      description: "Swipe left/right/up/down to navigate",
      demo: <ChevronRight className="w-8 h-8 text-blue-500" />,
    },
    {
      title: "Two Finger Gestures",
      description: "Pinch to zoom, rotate to turn, tap for options",
      demo: <MoreHorizontal className="w-8 h-8 text-green-500" />,
    },
    {
      title: "Long Press",
      description: "Hold to access context menus",
      demo: <div className="w-8 h-8 bg-orange-500 rounded-full animate-pulse" />,
    },
    {
      title: "Multi-tap",
      description: "Double-tap to select, triple-tap for quick actions",
      demo: <ArrowUp className="w-8 h-8 text-purple-500" />,
    },
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Gesture Tutorial</h3>
          <button
            onClick={() => {
              setIsVisible(false);
              onClose?.();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center">
          <div className="mb-4 flex justify-center">
            {steps[currentStep].demo}
          </div>
          
          <h4 className="font-medium text-gray-900 mb-2">
            {steps[currentStep].title}
          </h4>
          
          <p className="text-sm text-gray-600 mb-6">
            {steps[currentStep].description}
          </p>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            
            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md"
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsVisible(false);
                  onClose?.();
                }}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-md"
              >
                Got it!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
