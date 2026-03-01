/**
 * Base scraper — abstract interface for platform-specific scrapers.
 *
 * Each platform scraper normalizes API data into the common RawPost format.
 * In development mode (useMockData=true), scrapers return realistic mock data.
 */

import type { RawPost, ScrapeOptions, ScrapeResult, ScrapePlatform } from "../types";

/**
 * Abstract base class for platform scrapers.
 *
 * Subclasses implement `scrapeReal()` for API calls and `generateMockPosts()`
 * for development/testing. The `scrape()` method selects the appropriate one.
 */
export abstract class BaseScraper {
  abstract readonly platform: ScrapePlatform;

  /**
   * Scrape posts from the platform.
   * Delegates to mock or real implementation based on options.
   */
  async scrape(options: ScrapeOptions): Promise<ScrapeResult> {
    const maxPosts = options.maxPosts ?? 50;

    if (options.useMockData) {
      const posts = this.generateMockPosts(maxPosts);
      return {
        posts,
        isMock: true,
        totalAvailable: posts.length,
      };
    }

    return this.scrapeReal(options);
  }

  /**
   * Perform real API scraping. Subclasses implement this with
   * platform-specific API calls.
   */
  protected abstract scrapeReal(options: ScrapeOptions): Promise<ScrapeResult>;

  /**
   * Generate realistic mock posts for development/testing.
   * Subclasses provide platform-appropriate content.
   */
  abstract generateMockPosts(count: number): RawPost[];

  /**
   * Extract hashtags from post content.
   */
  protected extractHashtags(content: string): string[] {
    const matches = content.match(/#[\w\u00C0-\u024F]+/g);
    return matches ?? [];
  }

  /**
   * Extract emojis from post content.
   */
  protected extractEmojis(content: string): string[] {
    const matches = content.match(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
    );
    return [...new Set(matches ?? [])];
  }

  /**
   * Generate a random date within the last N days.
   */
  protected randomDate(withinDays = 90): string {
    const now = Date.now();
    const offset = Math.random() * withinDays * 24 * 60 * 60 * 1000;
    return new Date(now - offset).toISOString();
  }

  /**
   * Pick a random item from an array.
   */
  protected randomPick<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}
