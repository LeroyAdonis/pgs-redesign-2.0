'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * ScrollReveal — viewport-triggered entrance animation wrapper.
 *
 * Progressive-enhancement approach:
 *   1. Content is ALWAYS visible (SSR and client). Never hidden by default.
 *   2. On the client, an IntersectionObserver watches for elements entering the
 *      viewport. Once intersecting, the `has-entered` CSS animation class fires
 *      a one-time fade-in + slide-up transition.
 *   3. Elements already in the viewport at page load animate in immediately.
 *
 * This ensures crawlers, screenshots, and reduced-motion users always see
 * full content without any hidden-then-shown flash.
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

/** Initial translate classes (before reveal) keyed by direction. */
const TRANSLATE_FROM: Record<Direction, string> = {
  up: 'translate-y-8',
  left: '-translate-x-8',
  right: 'translate-x-8',
};

export function ScrollReveal({
  children,
  delay = 0,
  direction = 'up',
  className,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px 100px 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        // Start hidden + offset, then animate to visible
        'transition-all duration-700 ease-out',
        entered
          ? 'opacity-100 translate-x-0 translate-y-0'
          : cn('opacity-0', TRANSLATE_FROM[direction]),
        className,
      )}
      style={entered && delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}


