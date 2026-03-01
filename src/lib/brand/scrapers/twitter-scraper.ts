/**
 * Twitter/X scraper — Twitter API v2 tweet extraction
 *
 * In production: uses Twitter API v2 to fetch recent tweets.
 * In development: generates realistic SA-themed tweets.
 */

import { logger } from "@/lib/logger";
import type { RawPost, ScrapeOptions, ScrapeResult } from "../types";
import { BaseScraper } from "./base-scraper";

const MOCK_TWEETS = [
  "Launching something big tomorrow! Stay tuned Mzansi 🇿🇦🚀 #ComingSoon #SABusiness",
  "Thread 🧵: Why SA small businesses need to be on social media in 2025. Let's talk about it 👇 #DigitalMarketing #Mzansi",
  "Howzit! Just had the best bunny chow in Durban. If you know, you know 🤤 #BunnyChow #Durban #SAFood",
  "Happy Freedom Day! 🇿🇦 27 years of democracy and counting. What does freedom mean to your business? #FreedomDay #27April",
  "Pro tip: Post when your audience is online. For SA, that's usually 12pm-2pm and 7pm-9pm SAST ⏰ #SocialMediaTips",
  "Shoutout to all the entrepreneurs hustling in Joburg today! The City of Gold always delivers 💛 #Joburg #Hustle #CityOfGold",
  "Our Q3 results are in! 📊 Revenue up 45% year-on-year. Thank you to our amazing customers and team! #GrowthMindset #SABusiness",
  "Eish, load shedding again? 😤 Here's how we keep our business running during power cuts: generator + solar + determination 💪 #LoadShedding",
  "Youth Day reminder: The future belongs to the young people of SA 🌟 We're committed to training 100 young entrepreneurs this year #YouthDay #June16",
  "Just vibes today. Coffee, laptop, Table Mountain view. Living the Cape Town dream ☕🏔️ #RemoteWork #CapeTown #LekkerLife",
  "RT if you think SA brands deserve more love on the timeline! 🇿🇦❤️ #ProudlySA #LocalIsLekker",
  "Sharp sharp! New product alert 🔔 Check our bio link for the full range. Delivery nationwide 🚚 #NewProduct #MadeinSA",
];

export class TwitterScraper extends BaseScraper {
  readonly platform = "twitter" as const;

  protected async scrapeReal(options: ScrapeOptions): Promise<ScrapeResult> {
    logger.info("Twitter scrape: real API not yet implemented, falling back to mock", {
      socialAccountId: options.socialAccountId,
    });
    // Real implementation would use Twitter API v2:
    // GET /2/users/{id}/tweets?tweet.fields=created_at,public_metrics,...
    const posts = this.generateMockPosts(options.maxPosts ?? 50);
    return { posts, isMock: true, totalAvailable: posts.length };
  }

  generateMockPosts(count: number): RawPost[] {
    const posts: RawPost[] = [];

    for (let i = 0; i < count; i++) {
      const content = this.randomPick(MOCK_TWEETS);
      posts.push({
        platformPostId: `tw_${Date.now()}_${i}`,
        platform: "twitter",
        content,
        publishedAt: this.randomDate(60),
        hashtags: this.extractHashtags(content),
        emojis: this.extractEmojis(content),
        likes: Math.floor(Math.random() * 200) + 1,
        comments: Math.floor(Math.random() * 30),
        shares: Math.floor(Math.random() * 100),
        media: Math.random() > 0.5
          ? [
              {
                type: "image" as const,
                url: `https://placeholder.test/tw/${i}.jpg`,
              },
            ]
          : [],
        language: "en",
      });
    }

    return posts;
  }
}
