'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * ScrollReveal — viewport-triggered fade-in wrapper.
 *
 * Uses IntersectionObserver to detect when children scroll into view,
 * then applies a one-shot CSS transition (opacity + translate).
 * Children start invisible and animate in; once revealed they stay visible.
 *
 * All section components remain server components — this wrapper
 * handles the client-side intersection logic only.
 */

type Direction = 'up' | 'left' | 'right';

interface ScrollRevealProps {
  children: React.ReactNode;
  /** Delay before animation starts (ms). Default 0. */
  delay?: number;
  /** Direction the element slides in from. Default 'up'. */
  direction?: Direction;
  /** Additional CSS classes on the wrapper div. */
  className?: string;
}

/** Tailwind translate classes for the hidden state, keyed by direction. */
const TRANSLATE_HIDDEN: Record<Direction, string> = {
  up: 'translate-y-6',
  left: 'translate-x-6',
  right: '-translate-x-6',
};

/** Tailwind translate classes for the visible state, keyed by direction. */
const TRANSLATE_VISIBLE: Record<Direction, string> = {
  up: 'translate-y-0',
  left: 'translate-x-0',
  right: 'translate-x-0',
};

export function ScrollReveal({
  children,
  delay = 0,
  direction = 'up',
  className,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element); // fire once
        }
      },
      { rootMargin: '-50px', threshold: 0.1 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible
          ? `opacity-100 ${TRANSLATE_VISIBLE[direction]}`
          : `opacity-0 ${TRANSLATE_HIDDEN[direction]}`,
        className,
      )}
      style={isVisible && delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
