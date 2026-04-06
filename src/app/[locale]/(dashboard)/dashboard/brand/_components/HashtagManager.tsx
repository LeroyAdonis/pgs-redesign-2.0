'use client';

/**
 * HashtagManager — View/add/remove hashtag patterns
 *
 * SA-specific hashtags are highlighted with a 🇿🇦 indicator.
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { isSAHashtag } from '@/lib/brand/sa-context';
import type { HashtagPattern } from '@/lib/brand/types';

interface HashtagManagerProps {
  patterns: HashtagPattern[];
  onAdd: (hashtag: string, category: string) => void;
  onRemove: (hashtag: string) => void;
}

export function HashtagManager({ patterns, onAdd, onRemove }: HashtagManagerProps) {
  const t = useTranslations('dashboard');
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
          placeholder={t('brand.addHashtagPlaceholder')}
          className={cn(
            'flex-1 h-9 rounded-none border border-border bg-surface px-3',
            'text-sm text-text placeholder:text-text-muted',
            'focus:outline-2 focus:outline-brand',
          )}
          aria-label={t('brand.addHashtagLabel')}
        />
        <button
          onClick={handleAdd}
          disabled={!newHashtag.trim()}
          className={cn(
            'h-9 px-4 rounded-none text-sm font-medium',
            'bg-brand text-white',
            'hover:bg-brand-vivid',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors',
          )}
        >
          {t('brand.addHashtag')}
        </button>
      </div>

      {/* Hashtag list */}
      {patterns.length === 0 ? (
        <p className="text-sm text-text-muted">
          {t('brand.noHashtags')}
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
                {isSA && <span aria-label={t('brand.saHashtagLabel')}>🇿🇦</span>}
                {pattern.hashtag}
                <span className="text-text-muted">({pattern.frequency})</span>
                <button
                  onClick={() => onRemove(pattern.hashtag)}
                  className="ml-0.5 text-text-muted hover:text-error transition-colors"
                  aria-label={t('brand.removeHashtag', { hashtag: pattern.hashtag })}
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
