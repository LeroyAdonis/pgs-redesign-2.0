'use client';

/**
 * BrandProfileView — Main client component for brand profile display
 *
 * Renders all brand analysis sections and manages save/re-scan state.
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { ToneSliders } from './ToneSliders';
import { VocabularyCloud } from './VocabularyCloud';
import { HashtagManager } from './HashtagManager';
import { PostingCadenceChart } from './PostingCadenceChart';
import { EmojiGallery } from './EmojiGallery';
import { ContentStats } from './ContentStats';
import { SACulturalBadge } from './SACulturalBadge';
import type {
  ToneFingerprint,
  VocabularyCluster,
  HashtagPattern,
  PostingCadence,
  EmojiUsage,
  VisualStyle,
} from '@/lib/brand/types';

interface BrandProfile {
  id: string;
  orgId: string;
  language: string;
  toneFingerprint: ToneFingerprint;
  vocabularyClusters: VocabularyCluster[];
  hashtagPatterns: HashtagPattern[];
  postingCadence: PostingCadence;
  emojiUsage: EmojiUsage[];
  avgContentLength: number;
  visualStyle: VisualStyle;
}

interface BrandProfileViewProps {
  profile: BrandProfile;
  saCulturalScore: number;
}

export function BrandProfileView({ profile, saCulturalScore }: BrandProfileViewProps) {
  const [tone, setTone] = useState<ToneFingerprint>(profile.toneFingerprint);
  const [hashtags, setHashtags] = useState<HashtagPattern[]>(profile.hashtagPatterns);
  const [isSaving, setIsSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(profile.language);

  const handleToneChange = useCallback((key: keyof ToneFingerprint, value: number) => {
    setTone((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const handleAddHashtag = useCallback((hashtag: string, category: string) => {
    setHashtags((prev) => [
      ...prev,
      { hashtag, frequency: 1, category },
    ]);
    setHasChanges(true);
  }, []);

  const handleRemoveHashtag = useCallback((hashtagToRemove: string) => {
    setHashtags((prev) => prev.filter((h) => h.hashtag !== hashtagToRemove));
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/brand/profile/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toneFingerprint: tone,
          hashtagPatterns: hashtags,
          language: selectedLanguage,
        }),
      });

      if (response.ok) {
        setHasChanges(false);
      }
    } finally {
      setIsSaving(false);
    }
  }, [tone, hashtags, selectedLanguage, profile.id]);

  const handleReScan = useCallback(async () => {
    setIsScanning(true);
    try {
      await fetch('/api/brand/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socialAccountId: profile.id }),
      });
      // In production, we'd reload the profile data
    } finally {
      setIsScanning(false);
    }
  }, [profile.id]);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'af', label: 'Afrikaans' },
    { code: 'zu', label: 'isiZulu' },
    { code: 'xh', label: 'isiXhosa' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-text">
            Brand Profile
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Your brand&apos;s voice, style, and patterns analyzed from social media
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SACulturalBadge score={saCulturalScore} />

          {/* Language Toggle */}
          <select
            value={selectedLanguage}
            onChange={(e) => {
              setSelectedLanguage(e.target.value);
              setHasChanges(true);
            }}
            className={cn(
              'h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text',
              'focus:outline-2 focus:outline-brand',
            )}
            aria-label="Select language"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          isLoading={isScanning}
          onClick={handleReScan}
        >
          Re-Scan Brand
        </Button>
        <Button
          variant="primary"
          size="sm"
          isLoading={isSaving}
          disabled={!hasChanges}
          onClick={handleSave}
        >
          Save Changes
        </Button>
        {hasChanges && (
          <span className="text-xs text-warning">Unsaved changes</span>
        )}
      </div>

      {/* Tone Fingerprint */}
      <section
        className={cn(
          'rounded-xl border border-border bg-surface-raised p-6',
          'shadow-sm',
        )}
      >
        <h2 className="mb-4 text-lg font-semibold text-text">
          Tone Fingerprint
        </h2>
        <ToneSliders tone={tone} onChange={handleToneChange} />
      </section>

      {/* Two-column grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Vocabulary Cloud */}
        <section
          className={cn(
            'rounded-xl border border-border bg-surface-raised p-6',
            'shadow-sm',
          )}
        >
          <h2 className="mb-4 text-lg font-semibold text-text">
            Vocabulary Cloud
          </h2>
          <VocabularyCloud clusters={profile.vocabularyClusters} />
        </section>

        {/* Hashtag Manager */}
        <section
          className={cn(
            'rounded-xl border border-border bg-surface-raised p-6',
            'shadow-sm',
          )}
        >
          <h2 className="mb-4 text-lg font-semibold text-text">
            Hashtag Patterns
          </h2>
          <HashtagManager
            patterns={hashtags}
            onAdd={handleAddHashtag}
            onRemove={handleRemoveHashtag}
          />
        </section>

        {/* Posting Cadence */}
        <section
          className={cn(
            'rounded-xl border border-border bg-surface-raised p-6',
            'shadow-sm',
          )}
        >
          <h2 className="mb-4 text-lg font-semibold text-text">
            Posting Cadence
          </h2>
          <PostingCadenceChart cadence={profile.postingCadence} />
        </section>

        {/* Emoji Gallery */}
        <section
          className={cn(
            'rounded-xl border border-border bg-surface-raised p-6',
            'shadow-sm',
          )}
        >
          <h2 className="mb-4 text-lg font-semibold text-text">
            Emoji Usage
          </h2>
          <EmojiGallery emojis={profile.emojiUsage} />
        </section>
      </div>

      {/* Content Stats */}
      <section
        className={cn(
          'rounded-xl border border-border bg-surface-raised p-6',
          'shadow-sm',
        )}
      >
        <h2 className="mb-4 text-lg font-semibold text-text">
          Content Stats
        </h2>
        <ContentStats
          avgContentLength={profile.avgContentLength}
          visualStyle={profile.visualStyle}
        />
      </section>
    </div>
  );
}
