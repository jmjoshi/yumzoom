/**
 * Accessibility utility functions for YumZoom
 */

export type AccessibilityFeature = 
  | 'wheelchair_accessible'
  | 'hearing_loop'
  | 'braille_menu'
  | 'accessible_parking'
  | 'accessible_restroom'
  | 'sign_language_service'
  | 'large_print_menu'
  | 'service_animals_welcome'
  | 'visual_impairment_support'
  | 'hearing_impairment_support'
  | 'mobility_support'
  | 'cognitive_support';

export interface AccessibilityPreferences {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  contrast: 'normal' | 'high' | 'extra-high';
  motionReduced: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  colorBlindness: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  visualAcuity: 'normal' | 'low-vision' | 'blind';
  hearingLevel: 'normal' | 'hard-of-hearing' | 'deaf';
  motorSkills: 'normal' | 'limited-mobility' | 'voice-control';
  cognitiveLevel: 'normal' | 'learning-disability' | 'memory-impairment';
}

export interface RestaurantAccessibility {
  wheelchairAccessible: boolean;
  hearingLoop: boolean;
  brailleMenu: boolean;
  accessibleParking: boolean;
  accessibleRestroom: boolean;
  signLanguageService: boolean;
  largePrintMenu: boolean;
  serviceAnimalsWelcome: boolean;
  accessibilityNotes?: string;
  lastVerified?: string;
  verifiedBy?: string;
}

/**
 * Get user's accessibility preferences from storage
 */
export function getAccessibilityPreferences(): AccessibilityPreferences {
  if (typeof window === 'undefined') {
    return getDefaultAccessibilityPreferences();
  }

  try {
    const stored = localStorage.getItem('accessibility-preferences');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...getDefaultAccessibilityPreferences(), ...parsed };
    }
  } catch (error) {
    console.error('Error reading accessibility preferences:', error);
  }

  return detectSystemAccessibilityPreferences();
}

/**
 * Save user's accessibility preferences
 */
export function saveAccessibilityPreferences(preferences: Partial<AccessibilityPreferences>): void {
  if (typeof window === 'undefined') return;

  try {
    const current = getAccessibilityPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem('accessibility-preferences', JSON.stringify(updated));
    
    // Apply preferences immediately
    applyAccessibilityPreferences(updated);
  } catch (error) {
    console.error('Error saving accessibility preferences:', error);
  }
}

/**
 * Get default accessibility preferences
 */
export function getDefaultAccessibilityPreferences(): AccessibilityPreferences {
  return {
    fontSize: 'medium',
    contrast: 'normal',
    motionReduced: false,
    screenReader: false,
    keyboardNavigation: false,
    colorBlindness: 'none',
    visualAcuity: 'normal',
    hearingLevel: 'normal',
    motorSkills: 'normal',
    cognitiveLevel: 'normal',
  };
}

/**
 * Detect system accessibility preferences
 */
export function detectSystemAccessibilityPreferences(): AccessibilityPreferences {
  const defaults = getDefaultAccessibilityPreferences();

  if (typeof window === 'undefined') {
    return defaults;
  }

  try {
    return {
      ...defaults,
      motionReduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      contrast: window.matchMedia('(prefers-contrast: high)').matches ? 'high' : 'normal',
      screenReader: isScreenReaderActive(),
      keyboardNavigation: isKeyboardNavigationPreferred(),
    };
  } catch (error) {
    console.error('Error detecting system accessibility preferences:', error);
    return defaults;
  }
}

/**
 * Check if screen reader is active
 */
export function isScreenReaderActive(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for common screen reader indicators
  const indicators = [
    'speechSynthesis' in window,
    'webkitSpeechSynthesis' in window,
    document.querySelector('[aria-live]') !== null,
    document.querySelector('[role="application"]') !== null,
  ];

  return indicators.some(Boolean);
}

/**
 * Check if keyboard navigation is preferred
 */
export function isKeyboardNavigationPreferred(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if user is primarily using keyboard
  return document.activeElement?.tagName !== 'BODY';
}

/**
 * Apply accessibility preferences to the document
 */
export function applyAccessibilityPreferences(preferences: AccessibilityPreferences): void {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  // Font size
  root.classList.remove('text-small', 'text-medium', 'text-large', 'text-extra-large');
  root.classList.add(`text-${preferences.fontSize}`);

  // Contrast
  root.classList.remove('contrast-normal', 'contrast-high', 'contrast-extra-high');
  root.classList.add(`contrast-${preferences.contrast}`);

  // Motion
  if (preferences.motionReduced) {
    root.classList.add('motion-reduced');
  } else {
    root.classList.remove('motion-reduced');
  }

  // Color blindness
  root.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
  if (preferences.colorBlindness !== 'none') {
    root.classList.add(preferences.colorBlindness);
  }

  // Screen reader
  if (preferences.screenReader) {
    root.classList.add('screen-reader-active');
  } else {
    root.classList.remove('screen-reader-active');
  }

  // Keyboard navigation
  if (preferences.keyboardNavigation) {
    root.classList.add('keyboard-navigation');
  } else {
    root.classList.remove('keyboard-navigation');
  }
}

/**
 * Generate accessibility description for restaurant
 */
export function generateAccessibilityDescription(
  accessibility: RestaurantAccessibility
): string {
  const features: string[] = [];

  if (accessibility.wheelchairAccessible) {
    features.push('wheelchair accessible');
  }
  if (accessibility.hearingLoop) {
    features.push('hearing loop system');
  }
  if (accessibility.brailleMenu) {
    features.push('Braille menu available');
  }
  if (accessibility.accessibleParking) {
    features.push('accessible parking');
  }
  if (accessibility.accessibleRestroom) {
    features.push('accessible restroom');
  }
  if (accessibility.signLanguageService) {
    features.push('sign language service');
  }
  if (accessibility.largePrintMenu) {
    features.push('large print menu');
  }
  if (accessibility.serviceAnimalsWelcome) {
    features.push('service animals welcome');
  }

  if (features.length === 0) {
    return 'Accessibility information not available';
  }

  return `This restaurant offers: ${features.join(', ')}.`;
}

/**
 * Filter restaurants by accessibility features
 */
export function filterRestaurantsByAccessibility(
  restaurants: any[],
  requiredFeatures: AccessibilityFeature[]
): any[] {
  if (requiredFeatures.length === 0) {
    return restaurants;
  }

  return restaurants.filter(restaurant => {
    const accessibility = restaurant.accessibility_info || {};
    
    return requiredFeatures.every(feature => {
      switch (feature) {
        case 'wheelchair_accessible':
          return accessibility.wheelchairAccessible;
        case 'hearing_loop':
          return accessibility.hearingLoop;
        case 'braille_menu':
          return accessibility.brailleMenu;
        case 'accessible_parking':
          return accessibility.accessibleParking;
        case 'accessible_restroom':
          return accessibility.accessibleRestroom;
        case 'sign_language_service':
          return accessibility.signLanguageService;
        case 'large_print_menu':
          return accessibility.largePrintMenu;
        case 'service_animals_welcome':
          return accessibility.serviceAnimalsWelcome;
        default:
          return false;
      }
    });
  });
}

/**
 * Announce content to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (typeof window === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Focus management utilities
 */
export class FocusManager {
  private static focusHistory: HTMLElement[] = [];

  static pushFocus(element: HTMLElement): void {
    this.focusHistory.push(document.activeElement as HTMLElement);
    element.focus();
  }

  static popFocus(): void {
    const previousElement = this.focusHistory.pop();
    if (previousElement && previousElement.focus) {
      previousElement.focus();
    }
  }

  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Focus first element
    firstElement?.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }
}

/**
 * Keyboard navigation utilities
 */
export class KeyboardNavigation {
  static addArrowKeyNavigation(container: HTMLElement, orientation: 'horizontal' | 'vertical' = 'horizontal'): () => void {
    const handleKeyDown = (e: KeyboardEvent) => {
      const items = container.querySelectorAll('[role="menuitem"], [role="tab"], button, a') as NodeListOf<HTMLElement>;
      const currentIndex = Array.from(items).indexOf(document.activeElement as HTMLElement);

      if (currentIndex === -1) return;

      let nextIndex: number;

      switch (e.key) {
        case 'ArrowDown':
          if (orientation === 'vertical') {
            e.preventDefault();
            nextIndex = (currentIndex + 1) % items.length;
            items[nextIndex].focus();
          }
          break;
        case 'ArrowUp':
          if (orientation === 'vertical') {
            e.preventDefault();
            nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
            items[nextIndex].focus();
          }
          break;
        case 'ArrowRight':
          if (orientation === 'horizontal') {
            e.preventDefault();
            nextIndex = (currentIndex + 1) % items.length;
            items[nextIndex].focus();
          }
          break;
        case 'ArrowLeft':
          if (orientation === 'horizontal') {
            e.preventDefault();
            nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
            items[nextIndex].focus();
          }
          break;
        case 'Home':
          e.preventDefault();
          items[0].focus();
          break;
        case 'End':
          e.preventDefault();
          items[items.length - 1].focus();
          break;
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }
}

/**
 * Color contrast utilities
 */
export function getContrastRatio(color1: string, color2: string): number {
  // Simple contrast ratio calculation
  // In production, use a proper color contrast library
  return 4.5; // Placeholder return
}

export function meetsWCAGContrast(color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean {
  const ratio = getContrastRatio(color1, color2);
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
}
