/**
 * Scraper factory — returns the correct scraper for a given platform.
 */

import type { ScrapePlatform } from "../types";
import { BaseScraper } from "./base-scraper";
import { InstagramScraper } from "./instagram-scraper";
import { FacebookScraper } from "./facebook-scraper";
import { TwitterScraper } from "./twitter-scraper";
import { LinkedInScraper } from "./linkedin-scraper";

/** Cached scraper instances (they're stateless, safe to reuse) */
const scraperInstances = new Map<ScrapePlatform, BaseScraper>();

/**
 * Get a scraper instance for the specified platform.
 *
 * @throws Error if platform is not supported for scraping
 */
export function getScraperForPlatform(platform: ScrapePlatform): BaseScraper {
  const cached = scraperInstances.get(platform);
  if (cached) return cached;

  let scraper: BaseScraper;

  switch (platform) {
    case "instagram":
      scraper = new InstagramScraper();
      break;
    case "facebook":
      scraper = new FacebookScraper();
      break;
    case "twitter":
      scraper = new TwitterScraper();
      break;
    case "linkedin":
      scraper = new LinkedInScraper();
      break;
    default: {
      const _exhaustive: never = platform;
      throw new Error(`Unsupported scrape platform: ${_exhaustive}`);
    }
  }

  scraperInstances.set(platform, scraper);
  return scraper;
}

/**
 * List all supported scrape platforms.
 */
export function getSupportedPlatforms(): ScrapePlatform[] {
  return ["instagram", "facebook", "twitter", "linkedin"];
}
