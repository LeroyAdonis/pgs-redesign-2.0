/**
 * EmptyState — Shown when no brand profile exists
 *
 * Server component. Displays a CTA to link social accounts first.
 */

import { cn } from '@/lib/utils';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      {/* Icon */}
      <div
        className={cn(
          'flex h-20 w-20 items-center justify-center',
          'rounded-2xl bg-brand-surface',
          'shadow-glow',
        )}
      >
        <svg
          className="h-10 w-10 text-brand"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
          />
        </svg>
      </div>

      {/* Text */}
      <h2 className="mt-6 text-xl font-semibold text-text">
        No brand profile yet
      </h2>
      <p className="mt-2 max-w-md text-sm text-text-muted">
        Connect your social media accounts first, then we&apos;ll analyze your
        content to build your unique brand profile — including tone, vocabulary,
        hashtag patterns, and SA cultural awareness.
      </p>

      {/* CTA */}
      <a
        href="/accounts"
        className={cn(
          'mt-8 inline-flex items-center gap-2',
          'h-10 rounded-none bg-brand px-6',
          'text-sm font-medium text-white',
          'hover:bg-brand-vivid',
          'shadow-sm hover:shadow-glow',
          'transition-all',
        )}
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
          />
        </svg>
        Link Social Accounts
      </a>
    </div>
  );
}
