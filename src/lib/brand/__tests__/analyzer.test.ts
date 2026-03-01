/**
 * Tests for the brand analyzer engine
 */

import { describe, expect, it } from 'vitest';
import {
  analyzeTone,
  extractVocabularyClusters,
  analyzeHashtags,
  analyzePostingCadence,
  analyzeEmojis,
  calculateAvgContentLength,
  analyzeVisualStyle,
  analyzeBrandPosts,
} from '../analyzer';
import type { RawPost } from '../types';

// ── Test Helpers ────────────────────────────────────────────────

function makePost(overrides: Partial<RawPost> = {}): RawPost {
  return {
    platformPostId: 'test_1',
    platform: 'instagram',
    content: 'Hello world from Mzansi! #ProudlySA',
    publishedAt: '2025-03-15T10:00:00Z',
    hashtags: ['#ProudlySA'],
    emojis: [],
    likes: 10,
    comments: 2,
    shares: 1,
    media: [],
    language: 'en',
    ...overrides,
  };
}

function makePosts(count: number, overrides: Partial<RawPost> = {}): RawPost[] {
  return Array.from({ length: count }, (_, i) =>
    makePost({
      platformPostId: `test_${i}`,
      publishedAt: new Date(2025, 2, 15 - i).toISOString(),
      ...overrides,
    }),
  );
}

// ── analyzeTone ─────────────────────────────────────────────────

describe('analyzeTone', () => {
  it('returns zero scores for empty posts', () => {
    const result = analyzeTone([]);
    expect(result.formal).toBe(0);
    expect(result.casual).toBe(0);
    expect(result.humorous).toBe(0);
    expect(result.professional).toBe(0);
    expect(result.inspirational).toBe(0);
    expect(result.educational).toBe(0);
  });

  it('detects formal tone from formal keywords', () => {
    const posts = makePosts(3, {
      content: 'Please kindly acknowledge our announcement regarding the new policy. We sincerely appreciate your regards.',
    });
    const result = analyzeTone(posts);
    expect(result.formal).toBeGreaterThan(0);
  });

  it('detects casual tone from casual keywords', () => {
    const posts = makePosts(3, {
      content: 'Hey yo totally gonna chill with the fam this weekend, gonna be awesome lol',
    });
    const result = analyzeTone(posts);
    expect(result.casual).toBeGreaterThan(0);
  });

  it('detects humorous tone', () => {
    const posts = makePosts(3, {
      content: 'haha this is hilarious lol the joke was so funny rofl 😂',
    });
    const result = analyzeTone(posts);
    expect(result.humorous).toBeGreaterThan(0);
  });

  it('detects professional tone', () => {
    const posts = makePosts(3, {
      content: 'Our strategy for revenue growth involves optimizing metrics and stakeholder deliverables for enterprise scalability.',
    });
    const result = analyzeTone(posts);
    expect(result.professional).toBeGreaterThan(0);
  });

  it('detects inspirational tone', () => {
    const posts = makePosts(3, {
      content: 'Believe in your dreams, empower others, inspire change. Rise and shine, your purpose awaits!',
    });
    const result = analyzeTone(posts);
    expect(result.inspirational).toBeGreaterThan(0);
  });

  it('detects educational tone', () => {
    const posts = makePosts(3, {
      content: 'Learn these tips: our step-by-step guide teaches the technique and method. Study this tutorial for beginners.',
    });
    const result = analyzeTone(posts);
    expect(result.educational).toBeGreaterThan(0);
  });

  it('returns scores between 0 and 1', () => {
    const posts = makePosts(5, {
      content: 'Please kindly hey yo haha lol strategy dream learn tip guide tutorial',
    });
    const result = analyzeTone(posts);

    for (const key of Object.keys(result) as Array<keyof typeof result>) {
      expect(result[key]).toBeGreaterThanOrEqual(0);
      expect(result[key]).toBeLessThanOrEqual(1);
    }
  });
});

// ── extractVocabularyClusters ───────────────────────────────────

describe('extractVocabularyClusters', () => {
  it('returns empty for no posts', () => {
    expect(extractVocabularyClusters([])).toEqual([]);
  });

  it('groups words into categories', () => {
    const posts = makePosts(5, {
      content: 'brand marketing customer brand product customer launch team partner',
    });
    const clusters = extractVocabularyClusters(posts);
    const businessCluster = clusters.find((c) => c.category === 'business');
    expect(businessCluster).toBeDefined();
    expect(businessCluster!.words.length).toBeGreaterThan(0);
  });

  it('includes frequency data', () => {
    const posts = makePosts(5, {
      content: 'brand brand brand marketing marketing customer',
    });
    const clusters = extractVocabularyClusters(posts);
    for (const cluster of clusters) {
      expect(cluster.frequency).toBeGreaterThan(0);
    }
  });

  it('excludes stop words', () => {
    const posts = makePosts(3, {
      content: 'the and but brand customer is are was',
    });
    const clusters = extractVocabularyClusters(posts);
    const allWords = clusters.flatMap((c) => c.words);
    expect(allWords).not.toContain('the');
    expect(allWords).not.toContain('and');
    expect(allWords).not.toContain('but');
  });
});

// ── analyzeHashtags ─────────────────────────────────────────────

describe('analyzeHashtags', () => {
  it('returns empty for no posts', () => {
    expect(analyzeHashtags([])).toEqual([]);
  });

  it('counts hashtag frequency', () => {
    const posts = [
      makePost({ hashtags: ['#SA', '#Brand'] }),
      makePost({ hashtags: ['#SA', '#LocalIsLekker'] }),
      makePost({ hashtags: ['#SA'] }),
    ];
    const patterns = analyzeHashtags(posts);
    const saPattern = patterns.find((p) => p.hashtag === '#SA');
    expect(saPattern?.frequency).toBe(3);
  });

  it('sorts by frequency descending', () => {
    const posts = [
      makePost({ hashtags: ['#A', '#B', '#B'] }),
      makePost({ hashtags: ['#B', '#C'] }),
    ];
    const patterns = analyzeHashtags(posts);
    expect(patterns[0].frequency).toBeGreaterThanOrEqual(patterns[patterns.length - 1].frequency);
  });

  it('categorizes SA hashtags', () => {
    const posts = [makePost({ hashtags: ['#Mzansi'] })];
    const patterns = analyzeHashtags(posts);
    const mzansi = patterns.find((p) => p.hashtag.toLowerCase() === '#mzansi');
    expect(mzansi).toBeDefined();
  });
});

// ── analyzePostingCadence ───────────────────────────────────────

describe('analyzePostingCadence', () => {
  it('returns defaults for no posts', () => {
    const result = analyzePostingCadence([]);
    expect(result.postsPerWeek).toBe(0);
  });

  it('finds the most popular day', () => {
    // All posts on Wednesday (day 3)
    const posts = makePosts(5, {
      publishedAt: new Date(2025, 2, 12, 10, 0).toISOString(), // Wed
    });
    const result = analyzePostingCadence(posts);
    expect(result.dayOfWeek).toBe(3);
  });

  it('finds the most popular hour', () => {
    const posts = makePosts(5, {
      publishedAt: new Date(2025, 2, 12, 14, 0).toISOString(), // 2 PM
    });
    const result = analyzePostingCadence(posts);
    expect(result.hourOfDay).toBe(14);
  });

  it('calculates posts per week', () => {
    // 7 posts over 7 days = 1 per day = 7 per week
    const posts = Array.from({ length: 7 }, (_, i) =>
      makePost({
        platformPostId: `test_${i}`,
        publishedAt: new Date(2025, 2, 15 - i).toISOString(),
      }),
    );
    const result = analyzePostingCadence(posts);
    expect(result.postsPerWeek).toBeGreaterThan(0);
  });
});

// ── analyzeEmojis ───────────────────────────────────────────────

describe('analyzeEmojis', () => {
  it('returns empty for no posts', () => {
    expect(analyzeEmojis([])).toEqual([]);
  });

  it('counts emoji frequency', () => {
    const posts = [
      makePost({ emojis: ['🔥', '❤️'] }),
      makePost({ emojis: ['🔥', '🚀'] }),
      makePost({ emojis: ['🔥'] }),
    ];
    const usage = analyzeEmojis(posts);
    const fire = usage.find((u) => u.emoji === '🔥');
    expect(fire?.frequency).toBe(3);
  });

  it('limits to top 20 emojis', () => {
    const manyEmojis = Array.from({ length: 30 }, (_, i) =>
      String.fromCodePoint(0x1F600 + i),
    );
    const posts = [makePost({ emojis: manyEmojis })];
    const usage = analyzeEmojis(posts);
    expect(usage.length).toBeLessThanOrEqual(20);
  });
});

// ── calculateAvgContentLength ───────────────────────────────────

describe('calculateAvgContentLength', () => {
  it('returns 0 for no posts', () => {
    expect(calculateAvgContentLength([])).toBe(0);
  });

  it('calculates average correctly', () => {
    const posts = [
      makePost({ content: 'Hello' }),      // 5
      makePost({ content: 'Hello World' }), // 11
    ];
    const avg = calculateAvgContentLength(posts);
    expect(avg).toBe(8); // (5 + 11) / 2 = 8
  });
});

// ── analyzeVisualStyle ──────────────────────────────────────────

describe('analyzeVisualStyle', () => {
  it('extracts color palette from media', () => {
    const posts = [
      makePost({
        media: [
          { type: 'image', url: 'test.jpg', dominantColors: ['#ff0000', '#00ff00'] },
        ],
      }),
    ];
    const style = analyzeVisualStyle(posts);
    expect(style.colorPalette).toContain('#ff0000');
    expect(style.colorPalette).toContain('#00ff00');
  });

  it('extracts image types', () => {
    const posts = [
      makePost({
        media: [
          { type: 'image', url: 'img.jpg' },
          { type: 'video', url: 'vid.mp4' },
        ],
      }),
    ];
    const style = analyzeVisualStyle(posts);
    expect(style.imageTypes).toContain('image');
    expect(style.imageTypes).toContain('video');
  });

  it('returns empty arrays for no media', () => {
    const posts = [makePost({ media: [] })];
    const style = analyzeVisualStyle(posts);
    expect(style.colorPalette).toEqual([]);
    expect(style.imageTypes).toEqual([]);
  });
});

// ── analyzeBrandPosts (full pipeline) ───────────────────────────

describe('analyzeBrandPosts', () => {
  it('returns a complete analysis result', () => {
    const posts = makePosts(10, {
      content: 'Hello from Joburg! Our brand strategy is lekker amazing 🔥 #Mzansi #ProudlySA',
      hashtags: ['#Mzansi', '#ProudlySA'],
      emojis: ['🔥'],
      media: [{ type: 'image', url: 'test.jpg', dominantColors: ['#8b5cf6'] }],
    });

    const result = analyzeBrandPosts(posts);

    // All fields are present
    expect(result.toneFingerprint).toBeDefined();
    expect(result.vocabularyClusters).toBeDefined();
    expect(result.hashtagPatterns).toBeDefined();
    expect(result.postingCadence).toBeDefined();
    expect(result.emojiUsage).toBeDefined();
    expect(result.avgContentLength).toBeGreaterThan(0);
    expect(result.visualStyle).toBeDefined();
    expect(result.postsAnalyzed).toBe(10);
    expect(result.saCulturalScore).toBeGreaterThanOrEqual(0);
    expect(result.saCulturalScore).toBeLessThanOrEqual(1);
    expect(result.detectedLanguages).toContain('en');
  });

  it('handles empty posts gracefully', () => {
    const result = analyzeBrandPosts([]);
    expect(result.postsAnalyzed).toBe(0);
    expect(result.avgContentLength).toBe(0);
    expect(result.saCulturalScore).toBe(0);
  });
});
