import React, { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Hook for managing focus trap within a container
 */
export const useFocusTrap = (isActive: boolean = true) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          lastFocusable?.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          firstFocusable?.focus();
          e.preventDefault();
        }
      }
    };

    // Focus first element
    firstFocusable?.focus();

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
};

/**
 * Hook for keyboard navigation
 */
export const useKeyboardNavigation = (
  items: any[],
  onSelect: (item: any, index: number) => void,
  options?: {
    vertical?: boolean;
    wrap?: boolean;
    onEscape?: () => void;
  }
) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const { vertical = true, wrap = true, onEscape } = options || {};

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const currentIndex = focusedIndex;
      let newIndex = currentIndex;

      switch (key) {
        case 'ArrowDown':
        case 'ArrowRight':
          if (vertical ? key === 'ArrowDown' : key === 'ArrowRight') {
            e.preventDefault();
            newIndex = currentIndex + 1;
            if (newIndex >= items.length) {
              newIndex = wrap ? 0 : items.length - 1;
            }
          }
          break;

        case 'ArrowUp':
        case 'ArrowLeft':
          if (vertical ? key === 'ArrowUp' : key === 'ArrowLeft') {
            e.preventDefault();
            newIndex = currentIndex - 1;
            if (newIndex < 0) {
              newIndex = wrap ? items.length - 1 : 0;
            }
          }
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          if (currentIndex >= 0 && currentIndex < items.length) {
            onSelect(items[currentIndex], currentIndex);
          }
          break;

        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;

        case 'End':
          e.preventDefault();
          newIndex = items.length - 1;
          break;

        case 'Escape':
          if (onEscape) {
            e.preventDefault();
            onEscape();
          }
          break;
      }

      if (newIndex !== currentIndex) {
        setFocusedIndex(newIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, focusedIndex, onSelect, vertical, wrap, onEscape]);

  return {
    focusedIndex,
    setFocusedIndex,
    resetFocus: () => setFocusedIndex(-1)
  };
};

/**
 * Hook for screen reader announcements
 */
export const useAnnounce = () => {
  const [announcement, setAnnouncement] = useState('');
  const announcerRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement('');
    setTimeout(() => {
      setAnnouncement(message);
      if (announcerRef.current) {
        announcerRef.current.setAttribute('aria-live', priority);
      }
    }, 100);
  }, []);

  const Announcer = () => (
    <div
      ref={announcerRef}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      role="status"
    >
      {announcement}
    </div>
  );

  return { announce, Announcer };
};

/**
 * Hook for reduced motion preference
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

/**
 * Hook for high contrast mode detection
 */
export const useHighContrast = () => {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersHighContrast;
};

/**
 * Hook for managing ARIA attributes
 */
export const useAriaLiveRegion = (
  message: string,
  options?: {
    priority?: 'polite' | 'assertive' | 'off';
    atomic?: boolean;
    relevant?: 'additions' | 'removals' | 'text' | 'all';
  }
) => {
  const { priority = 'polite', atomic = true, relevant = 'additions text' } = options || {};
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!regionRef.current) return;

    const region = regionRef.current;
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', String(atomic));
    region.setAttribute('aria-relevant', relevant);
  }, [priority, atomic, relevant]);

  return {
    ref: regionRef,
    announce: (text: string) => {
      if (regionRef.current) {
        regionRef.current.textContent = text;
      }
    }
  };
};

// Skip links component should be in a separate file since this is a hooks file
// Removed SkipLinks component from here

/**
 * Utility function for generating unique IDs
 */
let idCounter = 0;
export const useUniqueId = (prefix: string = 'id') => {
  const [id] = useState(() => `${prefix}-${++idCounter}`);
  return id;
};

/**
 * Hook for managing focus restoration
 */
export const useFocusRestore = () => {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current && previousFocusRef.current.focus) {
      previousFocusRef.current.focus();
    }
  }, []);

  return { saveFocus, restoreFocus };
};