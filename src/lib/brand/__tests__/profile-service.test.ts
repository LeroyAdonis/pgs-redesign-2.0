/**
 * Tests for the brand profile service
 *
 * Tests the mergeProfiles function (pure logic).
 * CRUD operations that require a real database are tested via integration tests.
 */

import { describe, expect, it } from 'vitest';
import { mergeProfiles } from '../profile-service';
import type { BrandProfileRow } from '../profile-service';

// ── Helpers ─────────────────────────────────────────────────────

function makeProfileRow(overrides: Partial<BrandProfileRow> = {}): BrandProfileRow {
  return {
    id: 'profile-1',
    orgId: 'org-1',
    socialAccountId: 'sa-1',
    language: 'en',
    toneFingerprint: {
      formal: 0.3,
      casual: 0.7,
      humorous: 0.4,
      professional: 0.6,
      inspirational: 0.5,
      educational: 0.2,
    },
    vocabularyClusters: [
      { category: 'business', words: ['brand', 'customer'], frequency: 10 },
    ],
    hashtagPatterns: [
      { hashtag: '#Mzansi', frequency: 5, category: 'south_african' },
    ],
    postingCadence: { dayOfWeek: 2, hourOfDay: 10, postsPerWeek: 3 },
    emojiUsage: [{ emoji: '🔥', frequency: 8 }],
    avgContentLength: 150,
    visualStyle: {
      colorPalette: ['#8b5cf6'],
      filterPreferences: ['none'],
      imageTypes: ['image'],
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

// ── mergeProfiles ───────────────────────────────────────────────

describe('mergeProfiles', () => {
  it('returns empty object for no profiles', () => {
    const result = mergeProfiles([]);
    expect(result).toEqual({});
  });

  it('returns the single profile data for one profile', () => {
    const profile = makeProfileRow();
    const result = mergeProfiles([profile]);
    expect(result.toneFingerprint).toEqual(profile.toneFingerprint);
    expect(result.avgContentLength).toBe(profile.avgContentLength);
  });

  it('averages tone fingerprints across multiple profiles', () => {
    const profile1 = makeProfileRow({
      id: 'p-1',
      toneFingerprint: {
        formal: 0.2,
        casual: 0.8,
        humorous: 0.4,
        professional: 0.6,
        inspirational: 0.3,
        educational: 0.1,
      },
    });
    const profile2 = makeProfileRow({
      id: 'p-2',
      toneFingerprint: {
        formal: 0.8,
        casual: 0.2,
        humorous: 0.6,
        professional: 0.4,
        inspirational: 0.7,
        educational: 0.9,
      },
    });

    const result = mergeProfiles([profile1, profile2]);

    expect(result.toneFingerprint?.formal).toBe(0.5);
    expect(result.toneFingerprint?.casual).toBe(0.5);
    expect(result.toneFingerprint?.humorous).toBe(0.5);
    expect(result.toneFingerprint?.professional).toBe(0.5);
    expect(result.toneFingerprint?.inspirational).toBe(0.5);
    expect(result.toneFingerprint?.educational).toBe(0.5);
  });

  it('combines vocabulary clusters from multiple profiles', () => {
    const profile1 = makeProfileRow({
      id: 'p-1',
      vocabularyClusters: [
        { category: 'business', words: ['brand', 'customer'], frequency: 10 },
      ],
    });
    const profile2 = makeProfileRow({
      id: 'p-2',
      vocabularyClusters: [
        { category: 'business', words: ['marketing', 'brand'], frequency: 8 },
        { category: 'lifestyle', words: ['coffee', 'food'], frequency: 5 },
      ],
    });

    const result = mergeProfiles([profile1, profile2]);

    const businessCluster = result.vocabularyClusters?.find(
      (c) => c.category === 'business',
    );
    expect(businessCluster).toBeDefined();
    // Merged frequency
    expect(businessCluster!.frequency).toBe(18);
    // Merged words (unique)
    expect(businessCluster!.words).toContain('brand');
    expect(businessCluster!.words).toContain('customer');
    expect(businessCluster!.words).toContain('marketing');

    const lifestyleCluster = result.vocabularyClusters?.find(
      (c) => c.category === 'lifestyle',
    );
    expect(lifestyleCluster).toBeDefined();
  });

  it('combines hashtag patterns and sums frequencies', () => {
    const profile1 = makeProfileRow({
      id: 'p-1',
      hashtagPatterns: [
        { hashtag: '#Mzansi', frequency: 5, category: 'south_african' },
        { hashtag: '#Business', frequency: 3, category: 'business' },
      ],
    });
    const profile2 = makeProfileRow({
      id: 'p-2',
      hashtagPatterns: [
        { hashtag: '#Mzansi', frequency: 8, category: 'south_african' },
        { hashtag: '#Tech', frequency: 4, category: 'general' },
      ],
    });

    const result = mergeProfiles([profile1, profile2]);

    const mzansi = result.hashtagPatterns?.find(
      (p) => p.hashtag === '#Mzansi',
    );
    expect(mzansi?.frequency).toBe(13);

    const tech = result.hashtagPatterns?.find(
      (p) => p.hashtag === '#Tech',
    );
    expect(tech?.frequency).toBe(4);
  });

  it('averages content length', () => {
    const profile1 = makeProfileRow({ id: 'p-1', avgContentLength: 100 });
    const profile2 = makeProfileRow({ id: 'p-2', avgContentLength: 200 });

    const result = mergeProfiles([profile1, profile2]);
    expect(result.avgContentLength).toBe(150);
  });

  it('handles null values gracefully', () => {
    const profile1 = makeProfileRow({
      id: 'p-1',
      toneFingerprint: null,
      vocabularyClusters: null,
      hashtagPatterns: null,
      avgContentLength: null,
    });

    // Should not throw
    const result = mergeProfiles([profile1]);
    expect(result).toBeDefined();
  });
});
