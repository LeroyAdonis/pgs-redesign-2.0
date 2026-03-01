'use client';

/**
 * HashtagManager — View/add/remove hashtag patterns
 *
 * SA-specific hashtags are highlighted with a 🇿🇦 indicator.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { isSAHashtag } from '@/lib/brand/sa-context';
import type { HashtagPattern } from '@/lib/brand/types';

interface HashtagManagerProps {
  patterns: HashtagPattern[];
  onAdd: (hashtag: string, category: string) => void;
  onRemove: (hashtag: string) => void;
}

export function HashtagManager({ patterns, onAdd, onRemove }: HashtagManagerProps) {
  const [newHashtag, setNewHashtag] = useState('');

  const handleAdd = () => {
    const tag = newHashtag.trim();
    if (!tag) return;

    const normalized = tag.startsWith('#') ? tag : `#${tag}`;
    // Check for duplicate
    if (patterns.some((p) => p.hashtag.toLowerCase() === normalized.toLowerCase())) {
      return;
    }

    const category = isSAHashtag(normalized) ? 'south_african' : 'general';
    onAdd(normalized, category);
    setNewHashtag('');
  };

  return (
    <div className="space-y-4">
      {/* Add new hashtag */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newHashtag}
          onChange={(e) => setNewHashtag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Add hashtag..."
          className={cn(
            'flex-1 h-9 rounded-lg border border-border bg-surface px-3',
            'text-sm text-text placeholder:text-text-muted',
            'focus:outline-2 focus:outline-brand',
          )}
          aria-label="Add new hashtag"
        />
        <button
          onClick={handleAdd}
          disabled={!newHashtag.trim()}
          className={cn(
            'h-9 px-4 rounded-lg text-sm font-medium',
            'bg-brand text-white',
            'hover:bg-brand-vivid',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors',
          )}
        >
          Add
        </button>
      </div>

      {/* Hashtag list */}
      {patterns.length === 0 ? (
        <p className="text-sm text-text-muted">
          No hashtags yet. Add some above or run a brand scan.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {patterns.map((pattern) => {
            const isSA = isSAHashtag(pattern.hashtag);

            return (
              <span
                key={pattern.hashtag}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full',
                  'border px-3 py-1 text-xs font-medium',
                  isSA
                    ? 'bg-brand-surface border-brand/30 text-brand'
                    : 'bg-surface-inset border-border text-text-secondary',
                )}
              >
                {isSA && <span aria-label="South African hashtag">🇿🇦</span>}
                {pattern.hashtag}
                <span className="text-text-muted">({pattern.frequency})</span>
                <button
                  onClick={() => onRemove(pattern.hashtag)}
                  className="ml-0.5 text-text-muted hover:text-error transition-colors"
                  aria-label={`Remove ${pattern.hashtag}`}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
