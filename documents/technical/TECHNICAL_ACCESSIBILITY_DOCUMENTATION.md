# YumZoom Accessibility Documentation
## Comprehensive Accessibility Implementation & Guidelines

---

## Table of Contents

1. [Accessibility Overview](#accessibility-overview)
2. [WCAG 2.1 Compliance](#wcag-21-compliance)
3. [Keyboard Navigation](#keyboard-navigation)
4. [Screen Reader Support](#screen-reader-support)
5. [Visual Accessibility](#visual-accessibility)
6. [Motor Accessibility](#motor-accessibility)
7. [Cognitive Accessibility](#cognitive-accessibility)
8. [Testing & Validation](#testing--validation)

---

## Accessibility Overview

### Accessibility Mission

```
YumZoom Accessibility Goals:
├── 🎯 Universal Design
│   ├── WCAG 2.1 AA compliance
│   ├── Section 508 compliance
│   ├── ADA compliance
│   └── International standards
├── 👥 Inclusive Experience
│   ├── Screen reader friendly
│   ├── Keyboard navigable
│   ├── High contrast support
│   └── Multiple input methods
├── 🔧 Assistive Technology
│   ├── Voice control support
│   ├── Switch navigation
│   ├── Eye tracking compatible
│   └── Alternative input devices
└── 📱 Platform Accessibility
    ├── Mobile accessibility
    ├── Desktop accessibility
    ├── PWA accessibility
    └── Cross-browser support
```

### Accessibility Standards

```typescript
// lib/accessibility/config.ts
export const accessibilityConfig = {
  wcag: {
    version: '2.1',
    level: 'AA',
    guidelines: [
      'perceivable',
      'operable', 
      'understandable',
      'robust'
    ]
  },
  
  standards: {
    section508: true,
    ada: true,
    en301549: true,
    iso14289: true
  },
  
  testing: {
    automated: ['axe-core', 'lighthouse', 'pa11y'],
    manual: ['keyboard', 'screenReader', 'voiceOver'],
    users: ['disabled', 'elderly', 'cognitive']
  },
  
  features: {
    skipLinks: true,
    landmarks: true,
    headingStructure: true,
    altText: true,
    ariaLabels: true,
    focusManagement: true,
    colorContrast: true,
    textScaling: true,
    reducedMotion: true
  }
};
```

---

## WCAG 2.1 Compliance

### Perceivable Guidelines

```typescript
// components/accessibility/PerceivableComponents.tsx
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useHighContrast } from '@/hooks/useHighContrast';

// Text Alternatives (1.1)
interface AccessibleImageProps {
  src: string;
  alt: string;
  decorative?: boolean;
  longDescription?: string;
}

export function AccessibleImage({ 
  src, 
  alt, 
  decorative = false,
  longDescription 
}: AccessibleImageProps) {
  return (
    <figure>
      <img 
        src={src} 
        alt={decorative ? '' : alt}
        aria-describedby={longDescription ? 'long-desc' : undefined}
        role={decorative ? 'presentation' : 'img'}
      />
      {longDescription && (
        <figcaption id="long-desc" className="sr-only">
          {longDescription}
        </figcaption>
      )}
    </figure>
  );
}

// Time-based Media (1.2)
interface AccessibleVideoProps {
  src: string;
  poster?: string;
  captions?: string;
  transcript?: string;
  audioDescription?: string;
}

export function AccessibleVideo({
  src,
  poster,
  captions,
  transcript,
  audioDescription
}: AccessibleVideoProps) {
  return (
    <div className="video-container">
      <video 
        controls
        poster={poster}
        aria-describedby="video-description"
      >
        <source src={src} type="video/mp4" />
        {captions && (
          <track 
            kind="captions" 
            src={captions} 
            srcLang="en" 
            label="English captions"
            default
          />
        )}
        {audioDescription && (
          <track 
            kind="descriptions" 
            src={audioDescription} 
            srcLang="en" 
            label="Audio descriptions"
          />
        )}
      </video>
      
      {transcript && (
        <details className="mt-4">
          <summary>Video Transcript</summary>
          <div id="video-description" className="p-4 border rounded">
            {transcript}
          </div>
        </details>
      )}
    </div>
  );
}

// Adaptable Content (1.3)
export function AccessibleForm({ children }: { children: React.ReactNode }) {
  return (
    <form noValidate>
      <fieldset>
        <legend className="text-lg font-semibold mb-4">
          Restaurant Rating Form
        </legend>
        {children}
      </fieldset>
    </form>
  );
}

// Distinguishable Content (1.4)
export function HighContrastText({ 
  children, 
  level = 'normal' 
}: { 
  children: React.ReactNode;
  level?: 'normal' | 'large';
}) {
  const { isHighContrast } = useHighContrast();
  
  return (
    <span 
      className={cn(
        'transition-colors',
        isHighContrast && level === 'normal' && 'text-black bg-white',
        isHighContrast && level === 'large' && 'text-black bg-yellow-200',
        !isHighContrast && 'text-foreground'
      )}
    >
      {children}
    </span>
  );
}
```

### Operable Guidelines

```typescript
// components/accessibility/OperableComponents.tsx

// Keyboard Accessible (2.1)
interface KeyboardNavigableProps {
  children: React.ReactNode;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  trapFocus?: boolean;
}

export function KeyboardNavigable({ 
  children, 
  onKeyDown,
  trapFocus = false 
}: KeyboardNavigableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!trapFocus) return;
    
    const focusableElements = containerRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (!focusableElements?.length) return;
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
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
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    firstElement.focus();
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [trapFocus]);
  
  return (
    <div 
      ref={containerRef}
      onKeyDown={onKeyDown}
      className="focus-within:outline-2 focus-within:outline-blue-500"
    >
      {children}
    </div>
  );
}

// No Seizures (2.3)
export function ReducedMotionWrapper({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <div 
      className={cn(
        'transition-all',
        prefersReducedMotion ? 'motion-reduce:transition-none' : 'duration-300'
      )}
    >
      {children}
    </div>
  );
}

// Navigable (2.4)
export function SkipLinks() {
  return (
    <div className="skip-links">
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50"
      >
        Skip to main content
      </a>
      <a 
        href="#navigation"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-32 bg-blue-600 text-white px-4 py-2 rounded z-50"
      >
        Skip to navigation
      </a>
      <a 
        href="#search"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-64 bg-blue-600 text-white px-4 py-2 rounded z-50"
      >
        Skip to search
      </a>
    </div>
  );
}

export function AccessibleHeadings() {
  return (
    <div className="heading-structure">
      <h1>YumZoom - Family Restaurant Ratings</h1>
      <nav aria-label="Main navigation">
        <h2 className="sr-only">Navigation Menu</h2>
        {/* Navigation items */}
      </nav>
      <main id="main-content">
        <h2>Restaurant Search Results</h2>
        <section>
          <h3>Filter Options</h3>
          {/* Filter content */}
        </section>
        <section>
          <h3>Search Results</h3>
          {/* Results content */}
        </section>
      </main>
    </div>
  );
}

// Input Assistance (2.5)
export function AccessibleGestures({ children }: { children: React.ReactNode }) {
  const [isPressed, setIsPressed] = useState(false);
  
  const handlePointerDown = () => setIsPressed(true);
  const handlePointerUp = () => setIsPressed(false);
  const handlePointerCancel = () => setIsPressed(false);
  
  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={cn(
        'cursor-pointer select-none',
        isPressed && 'scale-95 transition-transform'
      )}
      role="button"
      tabIndex={0}
    >
      {children}
    </div>
  );
}
```

### Understandable Guidelines

```typescript
// components/accessibility/UnderstandableComponents.tsx

// Readable (3.1)
export function ReadableContent({ children }: { children: React.ReactNode }) {
  return (
    <div 
      lang="en"
      className="readable-content leading-relaxed tracking-wide"
      style={{
        lineHeight: '1.6',
        maxWidth: '65ch',
        fontSize: 'clamp(1rem, 2.5vw, 1.25rem)'
      }}
    >
      {children}
    </div>
  );
}

// Predictable (3.2)
interface PredictableFormProps {
  onSubmit: (data: any) => void;
  children: React.ReactNode;
}

export function PredictableForm({ onSubmit, children }: PredictableFormProps) {
  const [hasChanges, setHasChanges] = useState(false);
  
  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
      onChange={() => setHasChanges(true)}
      noValidate
    >
      {children}
      
      {hasChanges && (
        <div 
          role="status" 
          aria-live="polite"
          className="text-sm text-muted-foreground mt-2"
        >
          Form has unsaved changes
        </div>
      )}
      
      <button 
        type="submit"
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Submit Rating
      </button>
    </form>
  );
}

// Input Assistance (3.3)
interface AccessibleInputProps {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  error?: string;
  help?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function AccessibleInput({
  id,
  label,
  type = 'text',
  required = false,
  error,
  help,
  value,
  onChange
}: AccessibleInputProps) {
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  
  return (
    <div className="mb-4">
      <label 
        htmlFor={id}
        className={cn(
          'block text-sm font-medium mb-2',
          required && 'after:content-["*"] after:text-red-500 after:ml-1'
        )}
      >
        {label}
      </label>
      
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        aria-describedby={cn(
          help && helpId,
          error && errorId
        )}
        aria-invalid={!!error}
        className={cn(
          'w-full px-3 py-2 border rounded focus:outline-none focus:ring-2',
          error 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:ring-blue-500'
        )}
      />
      
      {help && (
        <div 
          id={helpId}
          className="text-sm text-muted-foreground mt-1"
        >
          {help}
        </div>
      )}
      
      {error && (
        <div 
          id={errorId}
          role="alert"
          aria-live="polite"
          className="text-sm text-red-600 mt-1"
        >
          {error}
        </div>
      )}
    </div>
  );
}
```

### Robust Guidelines

```typescript
// components/accessibility/RobustComponents.tsx

// Compatible (4.1)
export function SemanticMarkup({ children }: { children: React.ReactNode }) {
  return (
    <article>
      <header>
        <h1>Restaurant Review</h1>
        <time dateTime="2024-08-23">August 23, 2024</time>
      </header>
      
      <main>
        {children}
      </main>
      
      <footer>
        <address>
          Review by <a href="/profile/user123">John Doe</a>
        </address>
      </footer>
    </article>
  );
}

interface AriaLiveRegionProps {
  message: string;
  level?: 'polite' | 'assertive';
  atomic?: boolean;
}

export function AriaLiveRegion({ 
  message, 
  level = 'polite',
  atomic = false 
}: AriaLiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={level}
      aria-atomic={atomic}
      className="sr-only"
    >
      {message}
    </div>
  );
}

export function AccessibleTable({ data }: { data: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table 
        className="w-full border-collapse"
        role="table"
        aria-label="Restaurant ratings data"
      >
        <caption className="text-left font-semibold mb-2">
          Recent Restaurant Ratings
        </caption>
        
        <thead>
          <tr role="row">
            <th 
              scope="col"
              className="border p-2 text-left bg-gray-100"
            >
              Restaurant
            </th>
            <th 
              scope="col"
              className="border p-2 text-left bg-gray-100"
            >
              Rating
            </th>
            <th 
              scope="col"
              className="border p-2 text-left bg-gray-100"
            >
              Date
            </th>
          </tr>
        </thead>
        
        <tbody>
          {data.map((item, index) => (
            <tr key={index} role="row">
              <td 
                className="border p-2"
                role="gridcell"
              >
                {item.restaurant}
              </td>
              <td 
                className="border p-2"
                role="gridcell"
                aria-describedby={`rating-${index}`}
              >
                <span id={`rating-${index}`}>
                  {item.rating} out of 10 stars
                </span>
              </td>
              <td 
                className="border p-2"
                role="gridcell"
              >
                <time dateTime={item.date}>
                  {new Date(item.date).toLocaleDateString()}
                </time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Keyboard Navigation

### Focus Management

```typescript
// hooks/useFocusManagement.ts
import { useEffect, useRef, useCallback } from 'react';

export function useFocusManagement() {
  const focusHistoryRef = useRef<HTMLElement[]>([]);
  
  const saveFocus = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      focusHistoryRef.current.push(activeElement);
    }
  }, []);
  
  const restoreFocus = useCallback(() => {
    const lastFocused = focusHistoryRef.current.pop();
    if (lastFocused && lastFocused.focus) {
      lastFocused.focus();
    }
  }, []);
  
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
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
      }
      
      if (e.key === 'Escape') {
        restoreFocus();
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [restoreFocus]);
  
  return {
    saveFocus,
    restoreFocus,
    trapFocus
  };
}
```

### Keyboard Navigation Patterns

```typescript
// components/accessibility/KeyboardNavigation.tsx
import { useState, useRef, useEffect } from 'react';

// Arrow Key Navigation for Lists
interface ArrowNavigationProps {
  children: React.ReactNode[];
  orientation?: 'horizontal' | 'vertical';
  loop?: boolean;
}

export function ArrowNavigation({ 
  children, 
  orientation = 'vertical',
  loop = true 
}: ArrowNavigationProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  
  useEffect(() => {
    itemRefs.current[focusedIndex]?.focus();
  }, [focusedIndex]);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const { key } = e;
    const isVertical = orientation === 'vertical';
    const nextKeys = isVertical ? ['ArrowDown'] : ['ArrowRight'];
    const prevKeys = isVertical ? ['ArrowUp'] : ['ArrowLeft'];
    
    if (nextKeys.includes(key)) {
      e.preventDefault();
      setFocusedIndex(prev => {
        const next = prev + 1;
        return next >= children.length ? (loop ? 0 : prev) : next;
      });
    } else if (prevKeys.includes(key)) {
      e.preventDefault();
      setFocusedIndex(prev => {
        const next = prev - 1;
        return next < 0 ? (loop ? children.length - 1 : 0) : next;
      });
    } else if (key === 'Home') {
      e.preventDefault();
      setFocusedIndex(0);
    } else if (key === 'End') {
      e.preventDefault();
      setFocusedIndex(children.length - 1);
    }
  };
  
  return (
    <div 
      role={orientation === 'horizontal' ? 'toolbar' : 'listbox'}
      onKeyDown={handleKeyDown}
      className={cn(
        'focus-within:outline-2 focus-within:outline-blue-500',
        orientation === 'horizontal' ? 'flex space-x-2' : 'space-y-2'
      )}
    >
      {children.map((child, index) => (
        <div
          key={index}
          ref={el => itemRefs.current[index] = el}
          tabIndex={index === focusedIndex ? 0 : -1}
          role={orientation === 'horizontal' ? 'button' : 'option'}
          aria-selected={index === focusedIndex}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// Roving Tab Index for Complex Widgets
export function RovingTabIndex({ children }: { children: React.ReactNode }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<HTMLElement[]>([]);
  
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = (index + 1) % itemRefs.current.length;
        setActiveIndex(nextIndex);
        itemRefs.current[nextIndex]?.focus();
        break;
        
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = index === 0 ? itemRefs.current.length - 1 : index - 1;
        setActiveIndex(prevIndex);
        itemRefs.current[prevIndex]?.focus();
        break;
        
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        itemRefs.current[0]?.focus();
        break;
        
      case 'End':
        e.preventDefault();
        const lastIndex = itemRefs.current.length - 1;
        setActiveIndex(lastIndex);
        itemRefs.current[lastIndex]?.focus();
        break;
    }
  };
  
  return (
    <div role="grid">
      {React.Children.map(children, (child, index) => (
        <div
          ref={el => el && (itemRefs.current[index] = el)}
          tabIndex={index === activeIndex ? 0 : -1}
          onKeyDown={e => handleKeyDown(e, index)}
          role="gridcell"
          className="focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {child}
        </div>
      ))}
    </div>
  );
}
```

---

## Screen Reader Support

### ARIA Implementation

```typescript
// components/accessibility/AriaComponents.tsx

// Modal Dialog with Proper ARIA
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function AccessibleModal({ 
  isOpen, 
  onClose, 
  title, 
  children 
}: AccessibleModalProps) {
  const { trapFocus, restoreFocus } = useFocusManagement();
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const cleanup = trapFocus(modalRef.current);
      document.body.style.overflow = 'hidden';
      
      return () => {
        cleanup();
        document.body.style.overflow = '';
        restoreFocus();
      };
    }
  }, [isOpen, trapFocus, restoreFocus]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center mb-4">
          <h2 id="modal-title" className="text-xl font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        
        <div id="modal-description">
          {children}
        </div>
      </div>
    </div>
  );
}

// Accessible Dropdown Menu
interface AccessibleDropdownProps {
  trigger: React.ReactNode;
  items: Array<{
    label: string;
    action: () => void;
    disabled?: boolean;
  }>;
}

export function AccessibleDropdown({ trigger, items }: AccessibleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex(prev => 
            prev < items.length - 1 ? prev + 1 : 0
          );
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : items.length - 1
          );
        }
        break;
        
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else if (focusedIndex >= 0) {
          items[focusedIndex].action();
          setIsOpen(false);
          triggerRef.current?.focus();
        }
        break;
        
      case 'Escape':
        if (isOpen) {
          setIsOpen(false);
          triggerRef.current?.focus();
        }
        break;
    }
  };
  
  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
      >
        {trigger}
      </button>
      
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Dropdown menu"
          className="absolute top-full left-0 mt-1 bg-white border rounded shadow-lg min-w-48 z-10"
        >
          {items.map((item, index) => (
            <button
              key={index}
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                item.action();
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
              onMouseEnter={() => setFocusedIndex(index)}
              className={cn(
                'w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
                index === focusedIndex && 'bg-gray-100'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Accessible Progress Indicator
interface AccessibleProgressProps {
  value: number;
  max?: number;
  label: string;
  description?: string;
}

export function AccessibleProgress({ 
  value, 
  max = 100, 
  label,
  description 
}: AccessibleProgressProps) {
  const percentage = Math.round((value / max) * 100);
  
  return (
    <div>
      <div 
        className="flex justify-between items-center mb-2"
        id="progress-label"
      >
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-gray-500">{percentage}%</span>
      </div>
      
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-labelledby="progress-label"
        aria-describedby={description ? "progress-description" : undefined}
        className="w-full bg-gray-200 rounded-full h-2"
      >
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {description && (
        <div 
          id="progress-description"
          className="text-sm text-gray-600 mt-1"
        >
          {description}
        </div>
      )}
    </div>
  );
}
```

### Screen Reader Announcements

```typescript
// hooks/useScreenReader.ts
import { useEffect, useRef } from 'react';

export function useScreenReader() {
  const liveRegionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Create live region if it doesn't exist
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.id = 'live-region';
      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
    }
  }, []);
  
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority);
      liveRegionRef.current.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
      }, 1000);
    }
  };
  
  const announceNavigation = (pageName: string) => {
    announce(`Navigated to ${pageName}`);
  };
  
  const announceAction = (action: string) => {
    announce(`${action} completed`);
  };
  
  const announceError = (error: string) => {
    announce(`Error: ${error}`, 'assertive');
  };
  
  return {
    announce,
    announceNavigation,
    announceAction,
    announceError
  };
}
```

---

## Visual Accessibility

### Color and Contrast

```typescript
// lib/accessibility/colorContrast.ts
export class ColorContrastChecker {
  static getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }
  
  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;
    
    const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }
  
  static meetsWCAG(foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
  }
  
  static meetWCAGLarge(foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return level === 'AA' ? ratio >= 3 : ratio >= 4.5;
  }
  
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}

// High Contrast Theme
export const highContrastTheme = {
  colors: {
    foreground: '#000000',
    background: '#ffffff',
    primary: '#0000ff',
    secondary: '#008000',
    accent: '#ff0000',
    muted: '#808080',
    border: '#000000',
    input: '#ffffff',
    ring: '#0000ff'
  },
  
  apply() {
    const root = document.documentElement;
    Object.entries(this.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  },
  
  remove() {
    const root = document.documentElement;
    Object.keys(this.colors).forEach(key => {
      root.style.removeProperty(`--color-${key}`);
    });
  }
};
```

### Text Scaling and Zoom

```typescript
// hooks/useTextScaling.ts
import { useState, useEffect } from 'react';

export function useTextScaling() {
  const [scale, setScale] = useState(1);
  const [userPreference, setUserPreference] = useState<number | null>(null);
  
  useEffect(() => {
    // Check user preference from localStorage
    const saved = localStorage.getItem('text-scale');
    if (saved) {
      const parsedScale = parseFloat(saved);
      setScale(parsedScale);
      setUserPreference(parsedScale);
    }
    
    // Listen for browser zoom changes
    const handleResize = () => {
      const currentZoom = window.devicePixelRatio;
      // Adjust text scale based on zoom level
      if (!userPreference) {
        setScale(Math.max(1, currentZoom));
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [userPreference]);
  
  useEffect(() => {
    // Apply text scaling to root element
    document.documentElement.style.fontSize = `${16 * scale}px`;
    
    // Save preference
    if (userPreference !== null) {
      localStorage.setItem('text-scale', scale.toString());
    }
  }, [scale, userPreference]);
  
  const increaseTextSize = () => {
    const newScale = Math.min(scale + 0.1, 2);
    setScale(newScale);
    setUserPreference(newScale);
  };
  
  const decreaseTextSize = () => {
    const newScale = Math.max(scale - 0.1, 0.8);
    setScale(newScale);
    setUserPreference(newScale);
  };
  
  const resetTextSize = () => {
    setScale(1);
    setUserPreference(1);
  };
  
  return {
    scale,
    increaseTextSize,
    decreaseTextSize,
    resetTextSize
  };
}

// Text Scaling Controls Component
export function TextScalingControls() {
  const { scale, increaseTextSize, decreaseTextSize, resetTextSize } = useTextScaling();
  
  return (
    <div className="flex items-center space-x-2 p-4 border rounded">
      <span className="text-sm font-medium">Text Size:</span>
      
      <button
        onClick={decreaseTextSize}
        aria-label="Decrease text size"
        className="p-2 border rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        A−
      </button>
      
      <span className="text-sm px-2">
        {Math.round(scale * 100)}%
      </span>
      
      <button
        onClick={increaseTextSize}
        aria-label="Increase text size"
        className="p-2 border rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        A+
      </button>
      
      <button
        onClick={resetTextSize}
        aria-label="Reset text size to default"
        className="px-3 py-1 text-sm border rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Reset
      </button>
    </div>
  );
}
```

---

## Related Documentation

- [Technical UI Components Documentation](./TECHNICAL_UI_COMPONENTS_DOCUMENTATION.md)
- [Technical Frontend Documentation](./TECHNICAL_FRONTEND_DOCUMENTATION.md)
- [Technical Testing Documentation](./TECHNICAL_TESTING_DOCUMENTATION.md)
- [User Manual](./YUMZOOM_USER_MANUAL.md)

---

## Version Information

- **Accessibility Documentation Version**: 1.0
- **WCAG Compliance Level**: AA (targeting AAA)
- **Testing Standards**: Automated + Manual + User Testing
- **Last Updated**: August 2025

---

*For accessibility questions or compliance assistance, contact our accessibility team at accessibility@yumzoom.com*
