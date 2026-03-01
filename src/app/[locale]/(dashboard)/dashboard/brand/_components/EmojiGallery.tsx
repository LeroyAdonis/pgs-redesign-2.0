/**
 * EmojiGallery — Grid display of frequently used emojis
 *
 * Server component. Shows emojis with usage counts in a responsive grid.
 */

import { cn } from '@/lib/utils';
import type { EmojiUsage } from '@/lib/brand/types';

interface EmojiGalleryProps {
  emojis: EmojiUsage[];
}

export function EmojiGallery({ emojis }: EmojiGalleryProps) {
  if (emojis.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        No emoji usage data yet. Run a brand scan to analyze your posts.
      </p>
    );
  }

  const maxFreq = Math.max(...emojis.map((e) => e.frequency));

  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-5">
      {emojis.slice(0, 10).map((item, index) => {
        const intensity = item.frequency / maxFreq;

        return (
          <div
            key={`${item.emoji}-${index}`}
            className={cn(
              'flex flex-col items-center justify-center',
              'rounded-lg p-3',
              'border border-border',
              'transition-all hover:shadow-glow hover:border-brand/30',
              intensity > 0.7
                ? 'bg-brand-surface'
                : 'bg-surface-inset',
            )}
          >
            <span className="text-2xl" role="img" aria-label={`Emoji used ${item.frequency} times`}>
              {item.emoji}
            </span>
            <span className="mt-1 text-xs font-mono text-text-muted">
              {item.frequency}×
            </span>
          </div>
        );
      })}
    </div>
  );
}
