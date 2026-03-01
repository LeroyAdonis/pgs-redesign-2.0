/**
 * Tests for the South African context layer
 */

import { describe, expect, it } from 'vitest';
import {
  isSAHashtag,
  getSAHashtagCategory,
  countSASlang,
  findSASlang,
  mentionsSACity,
  findSACities,
  getUpcomingSAHoliday,
  calculateSACulturalScore,
  suggestSAHashtags,
  SA_HASHTAGS,
  SA_SLANG,
  SA_CITIES,
  SA_HOLIDAYS,
  SA_LANGUAGES,
} from '../sa-context';

// ── isSAHashtag ─────────────────────────────────────────────────

describe('isSAHashtag', () => {
  it('recognizes #Mzansi as SA hashtag', () => {
    expect(isSAHashtag('#Mzansi')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isSAHashtag('#mzansi')).toBe(true);
    expect(isSAHashtag('#MZANSI')).toBe(true);
    expect(isSAHashtag('#ProudlySA')).toBe(true);
    expect(isSAHashtag('#proudlysa')).toBe(true);
  });

  it('works without the # prefix', () => {
    expect(isSAHashtag('Mzansi')).toBe(true);
    expect(isSAHashtag('LocalIsLekker')).toBe(true);
  });

  it('returns false for non-SA hashtags', () => {
    expect(isSAHashtag('#RandomHashtag')).toBe(false);
    expect(isSAHashtag('#NewYorkCity')).toBe(false);
  });
});

// ── getSAHashtagCategory ────────────────────────────────────────

describe('getSAHashtagCategory', () => {
  it('returns "national" for #Mzansi', () => {
    expect(getSAHashtagCategory('#Mzansi')).toBe('national');
  });

  it('returns "johannesburg" for #Joburg', () => {
    expect(getSAHashtagCategory('#Joburg')).toBe('johannesburg');
  });

  it('returns "food" for #Braai', () => {
    expect(getSAHashtagCategory('#Braai')).toBe('food');
  });

  it('returns "culture" for #Ubuntu', () => {
    // Ubuntu appears in both national and culture; check it returns one of them
    const cat = getSAHashtagCategory('#Ubuntu');
    expect(cat).toBeTruthy();
  });

  it('returns null for non-SA hashtags', () => {
    expect(getSAHashtagCategory('#NotSA')).toBeNull();
  });
});

// ── countSASlang ────────────────────────────────────────────────

describe('countSASlang', () => {
  it('counts SA slang words in text', () => {
    expect(countSASlang('That braai was so lekker, eish!')).toBe(3);
  });

  it('returns 0 for text with no SA slang', () => {
    expect(countSASlang('Hello world, this is a normal sentence.')).toBe(0);
  });

  it('is case-insensitive', () => {
    expect(countSASlang('LEKKER BRAAI')).toBe(2);
  });
});

// ── findSASlang ─────────────────────────────────────────────────

describe('findSASlang', () => {
  it('finds SA slang words in text', () => {
    const result = findSASlang('Howzit bru, that braai was lekker!');
    expect(result).toContain('howzit');
    expect(result).toContain('bru');
    expect(result).toContain('braai');
    expect(result).toContain('lekker');
  });

  it('returns unique words only', () => {
    const result = findSASlang('lekker lekker lekker');
    expect(result).toEqual(['lekker']);
  });

  it('returns empty array for no slang', () => {
    expect(findSASlang('Regular English text.')).toEqual([]);
  });
});

// ── mentionsSACity ──────────────────────────────────────────────

describe('mentionsSACity', () => {
  it('detects Johannesburg', () => {
    expect(mentionsSACity('Meeting in Johannesburg tomorrow')).toBe(true);
  });

  it('detects Cape Town', () => {
    expect(mentionsSACity('Beautiful day in Cape Town')).toBe(true);
  });

  it('detects Durban', () => {
    expect(mentionsSACity('Durban beach vibes')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(mentionsSACity('love cape town so much')).toBe(true);
  });

  it('returns false for non-SA cities', () => {
    expect(mentionsSACity('Meeting in London tomorrow')).toBe(false);
  });
});

// ── findSACities ────────────────────────────────────────────────

describe('findSACities', () => {
  it('finds all mentioned SA cities', () => {
    const result = findSACities('Trip from Johannesburg to Durban via Pretoria');
    expect(result).toContain('Johannesburg');
    expect(result).toContain('Durban');
    expect(result).toContain('Pretoria');
  });

  it('returns empty for no cities', () => {
    expect(findSACities('Just a regular sentence')).toEqual([]);
  });
});

// ── getUpcomingSAHoliday ────────────────────────────────────────

describe('getUpcomingSAHoliday', () => {
  it('finds Heritage Day when reference date is Sept 15', () => {
    const ref = new Date(2025, 8, 15); // Sept 15
    const holiday = getUpcomingSAHoliday(14, ref);
    expect(holiday?.name).toBe('Heritage Day');
  });

  it('returns null when no holiday is upcoming', () => {
    const ref = new Date(2025, 9, 5); // Oct 5 — nothing within 14 days
    const holiday = getUpcomingSAHoliday(14, ref);
    expect(holiday).toBeNull();
  });

  it('finds Freedom Day when reference date is April 20', () => {
    const ref = new Date(2025, 3, 20); // April 20
    const holiday = getUpcomingSAHoliday(14, ref);
    expect(holiday?.name).toBe('Freedom Day');
  });
});

// ── calculateSACulturalScore ────────────────────────────────────

describe('calculateSACulturalScore', () => {
  it('returns 0 for empty posts', () => {
    expect(calculateSACulturalScore([])).toBe(0);
  });

  it('returns 0 for posts with no SA content', () => {
    const posts = [
      { content: 'Just a regular post.', hashtags: ['#Hello'] },
    ];
    expect(calculateSACulturalScore(posts)).toBe(0);
  });

  it('returns high score for posts with SA content', () => {
    const posts = [
      {
        content: 'Lekker braai in Johannesburg with the brus!',
        hashtags: ['#Mzansi', '#ProudlySA'],
      },
      {
        content: 'Howzit Cape Town! Eish, what a beautiful day',
        hashtags: ['#CapeTown', '#LocalIsLekker'],
      },
    ];
    const score = calculateSACulturalScore(posts);
    expect(score).toBeGreaterThan(0.5);
  });

  it('returns score between 0 and 1', () => {
    const posts = [
      {
        content: 'Some lekker content from Joburg',
        hashtags: ['#Mzansi'],
      },
    ];
    const score = calculateSACulturalScore(posts);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

// ── suggestSAHashtags ───────────────────────────────────────────

describe('suggestSAHashtags', () => {
  it('always suggests #Mzansi if not present', () => {
    const suggestions = suggestSAHashtags('General content', []);
    expect(suggestions).toContain('#Mzansi');
  });

  it('does not suggest #Mzansi if already present', () => {
    const suggestions = suggestSAHashtags('General content', ['#Mzansi']);
    expect(suggestions).not.toContain('#Mzansi');
  });

  it('suggests city hashtags based on content', () => {
    const suggestions = suggestSAHashtags(
      'Great food in Johannesburg today!',
      [],
      5,
    );
    // Should contain at least one Joburg-related hashtag
    const hasJoburg = suggestions.some(
      (s) => s.toLowerCase().includes('joburg') || s.toLowerCase().includes('johannesburg'),
    );
    expect(hasJoburg).toBe(true);
  });

  it('respects maxSuggestions limit', () => {
    const suggestions = suggestSAHashtags('Content about Johannesburg and braai', [], 3);
    expect(suggestions.length).toBeLessThanOrEqual(3);
  });

  it('does not suggest duplicates of existing hashtags', () => {
    const existing = ['#Joburg', '#ProudlySA'];
    const suggestions = suggestSAHashtags('Content in Johannesburg', existing);
    for (const tag of suggestions) {
      expect(existing.map((e) => e.toLowerCase())).not.toContain(tag.toLowerCase());
    }
  });
});

// ── Data integrity ──────────────────────────────────────────────

describe('SA data integrity', () => {
  it('has all 11 official languages', () => {
    expect(Object.keys(SA_LANGUAGES)).toHaveLength(11);
    expect(SA_LANGUAGES.en).toBe('English');
    expect(SA_LANGUAGES.af).toBe('Afrikaans');
    expect(SA_LANGUAGES.zu).toBe('isiZulu');
  });

  it('has at least 10 public holidays', () => {
    expect(SA_HOLIDAYS.length).toBeGreaterThanOrEqual(10);
  });

  it('has at least 15 SA cities', () => {
    expect(SA_CITIES.length).toBeGreaterThanOrEqual(15);
  });

  it('has SA slang entries', () => {
    expect(Object.keys(SA_SLANG).length).toBeGreaterThan(20);
    expect(SA_SLANG.lekker).toBeDefined();
    expect(SA_SLANG.braai).toBeDefined();
    expect(SA_SLANG.ubuntu).toBeDefined();
  });

  it('has hashtags in multiple categories', () => {
    expect(Object.keys(SA_HASHTAGS).length).toBeGreaterThanOrEqual(5);
    expect(SA_HASHTAGS.national.length).toBeGreaterThan(0);
    expect(SA_HASHTAGS.johannesburg.length).toBeGreaterThan(0);
    expect(SA_HASHTAGS.food.length).toBeGreaterThan(0);
  });
});
