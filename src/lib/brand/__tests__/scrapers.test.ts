/**
 * Tests for platform scrapers
 */

import { describe, expect, it } from 'vitest';
import { InstagramScraper } from '../scrapers/instagram-scraper';
import { FacebookScraper } from '../scrapers/facebook-scraper';
import { TwitterScraper } from '../scrapers/twitter-scraper';
import { LinkedInScraper } from '../scrapers/linkedin-scraper';
import { getScraperForPlatform, getSupportedPlatforms } from '../scrapers/scraper-factory';

// ── Factory ─────────────────────────────────────────────────────

describe('getScraperForPlatform', () => {
  it('returns InstagramScraper for instagram', () => {
    const scraper = getScraperForPlatform('instagram');
    expect(scraper).toBeInstanceOf(InstagramScraper);
  });

  it('returns FacebookScraper for facebook', () => {
    const scraper = getScraperForPlatform('facebook');
    expect(scraper).toBeInstanceOf(FacebookScraper);
  });

  it('returns TwitterScraper for twitter', () => {
    const scraper = getScraperForPlatform('twitter');
    expect(scraper).toBeInstanceOf(TwitterScraper);
  });

  it('returns LinkedInScraper for linkedin', () => {
    const scraper = getScraperForPlatform('linkedin');
    expect(scraper).toBeInstanceOf(LinkedInScraper);
  });

  it('caches scraper instances', () => {
    const first = getScraperForPlatform('instagram');
    const second = getScraperForPlatform('instagram');
    expect(first).toBe(second);
  });
});

describe('getSupportedPlatforms', () => {
  it('returns all 4 supported platforms', () => {
    const platforms = getSupportedPlatforms();
    expect(platforms).toContain('instagram');
    expect(platforms).toContain('facebook');
    expect(platforms).toContain('twitter');
    expect(platforms).toContain('linkedin');
    expect(platforms).toHaveLength(4);
  });
});

// ── Instagram Scraper ───────────────────────────────────────────

describe('InstagramScraper', () => {
  const scraper = new InstagramScraper();

  it('has platform set to instagram', () => {
    expect(scraper.platform).toBe('instagram');
  });

  it('generates mock posts', () => {
    const posts = scraper.generateMockPosts(10);
    expect(posts).toHaveLength(10);
  });

  it('generates posts with required fields', () => {
    const posts = scraper.generateMockPosts(5);
    for (const post of posts) {
      expect(post.platformPostId).toBeTruthy();
      expect(post.platform).toBe('instagram');
      expect(post.content).toBeTruthy();
      expect(post.publishedAt).toBeTruthy();
      expect(Array.isArray(post.hashtags)).toBe(true);
      expect(Array.isArray(post.emojis)).toBe(true);
      expect(typeof post.likes).toBe('number');
      expect(typeof post.comments).toBe('number');
      expect(typeof post.shares).toBe('number');
      expect(Array.isArray(post.media)).toBe(true);
    }
  });

  it('generates posts with SA-themed content', () => {
    const posts = scraper.generateMockPosts(20);
    const allContent = posts.map((p) => p.content).join(' ');
    // Should contain SA references somewhere across 20 posts
    const hasSAContent =
      allContent.includes('Mzansi') ||
      allContent.includes('SA') ||
      allContent.includes('Joburg') ||
      allContent.includes('Cape Town') ||
      allContent.includes('lekker') ||
      allContent.includes('braai');
    expect(hasSAContent).toBe(true);
  });

  it('generates posts with hashtags', () => {
    const posts = scraper.generateMockPosts(10);
    const withHashtags = posts.filter((p) => p.hashtags.length > 0);
    expect(withHashtags.length).toBeGreaterThan(0);
  });

  it('scrapes with mock data option', async () => {
    const result = await scraper.scrape({
      socialAccountId: 'test-id',
      platform: 'instagram',
      maxPosts: 5,
      useMockData: true,
    });
    expect(result.isMock).toBe(true);
    expect(result.posts.length).toBe(5);
  });
});

// ── Facebook Scraper ────────────────────────────────────────────

describe('FacebookScraper', () => {
  const scraper = new FacebookScraper();

  it('has platform set to facebook', () => {
    expect(scraper.platform).toBe('facebook');
  });

  it('generates mock posts with required fields', () => {
    const posts = scraper.generateMockPosts(5);
    expect(posts).toHaveLength(5);
    for (const post of posts) {
      expect(post.platform).toBe('facebook');
      expect(post.content).toBeTruthy();
    }
  });

  it('scrapes with mock data', async () => {
    const result = await scraper.scrape({
      socialAccountId: 'test-id',
      platform: 'facebook',
      maxPosts: 3,
      useMockData: true,
    });
    expect(result.isMock).toBe(true);
    expect(result.posts).toHaveLength(3);
  });
});

// ── Twitter Scraper ─────────────────────────────────────────────

describe('TwitterScraper', () => {
  const scraper = new TwitterScraper();

  it('has platform set to twitter', () => {
    expect(scraper.platform).toBe('twitter');
  });

  it('generates mock posts with required fields', () => {
    const posts = scraper.generateMockPosts(5);
    expect(posts).toHaveLength(5);
    for (const post of posts) {
      expect(post.platform).toBe('twitter');
      expect(post.content).toBeTruthy();
    }
  });

  it('scrapes with mock data', async () => {
    const result = await scraper.scrape({
      socialAccountId: 'test-id',
      platform: 'twitter',
      maxPosts: 8,
      useMockData: true,
    });
    expect(result.isMock).toBe(true);
    expect(result.posts).toHaveLength(8);
  });
});

// ── LinkedIn Scraper ────────────────────────────────────────────

describe('LinkedInScraper', () => {
  const scraper = new LinkedInScraper();

  it('has platform set to linkedin', () => {
    expect(scraper.platform).toBe('linkedin');
  });

  it('generates mock posts with required fields', () => {
    const posts = scraper.generateMockPosts(5);
    expect(posts).toHaveLength(5);
    for (const post of posts) {
      expect(post.platform).toBe('linkedin');
      expect(post.content).toBeTruthy();
    }
  });

  it('generates longer-form content typical of LinkedIn', () => {
    const posts = scraper.generateMockPosts(10);
    const avgLength =
      posts.reduce((sum, p) => sum + p.content.length, 0) / posts.length;
    // LinkedIn posts are typically longer than tweets
    expect(avgLength).toBeGreaterThan(100);
  });

  it('scrapes with mock data', async () => {
    const result = await scraper.scrape({
      socialAccountId: 'test-id',
      platform: 'linkedin',
      maxPosts: 4,
      useMockData: true,
    });
    expect(result.isMock).toBe(true);
    expect(result.posts).toHaveLength(4);
  });
});
