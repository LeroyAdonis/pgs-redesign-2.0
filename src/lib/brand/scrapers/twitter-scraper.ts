/**
 * Twitter/X scraper — Twitter API v2 tweet extraction
 *
 * In production: uses Twitter API v2 to fetch recent tweets.
 * In development: generates realistic SA-themed tweets.
 */

import { logger } from "@/lib/logger";
import { decrypt } from "@/lib/crypto";
import { db } from "@/db";
import { socialAccount } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { RawPost, ScrapeOptions, ScrapeResult } from "../types";
import { BaseScraper } from "./base-scraper";

const TWITTER_API_BASE = "https://api.twitter.com/2";

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
    try {
      // Look up the social account to get tokens
      const accounts = await db
        .select()
        .from(socialAccount)
        .where(eq(socialAccount.id, options.socialAccountId))
        .limit(1);

      const account = accounts[0];
      if (!account?.accessTokenEncrypted) {
        logger.warn("Twitter scrape: no access token, falling back to mock", {
          socialAccountId: options.socialAccountId,
        });
        const posts = this.generateMockPosts(options.maxPosts ?? 50);
        return { posts, isMock: true, totalAvailable: posts.length };
      }

      const accessToken = decrypt(account.accessTokenEncrypted);
      const userId = account.platformUserId;
      const maxResults = Math.min(options.maxPosts ?? 50, 100);

      // Twitter API v2: fetch user tweets with public metrics
      const tweetFields = "created_at,public_metrics,attachments";
      const url = `${TWITTER_API_BASE}/users/${userId}/tweets?tweet.fields=${tweetFields}&max_results=${maxResults}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Unknown error");
        throw new Error(`Twitter API error (${response.status}): ${errorBody}`);
      }

      const data = await response.json();

      if (!data.data || !Array.isArray(data.data)) {
        throw new Error("Twitter API returned unexpected data format");
      }

      // Normalize Twitter API v2 response into RawPost format
      const posts: RawPost[] = data.data.map(
        (tweet: Record<string, unknown>, i: number) => {
          const content = (tweet.text as string) ?? "";
          const metrics = tweet.public_metrics as Record<string, number> | undefined;

          return {
            platformPostId: (tweet.id as string) ?? `tw_${Date.now()}_${i}`,
            platform: "twitter" as const,
            content,
            publishedAt: (tweet.created_at as string) ?? new Date().toISOString(),
            hashtags: this.extractHashtags(content),
            emojis: this.extractEmojis(content),
            likes: metrics?.like_count ?? 0,
            comments: metrics?.reply_count ?? 0,
            shares: metrics?.retweet_count ?? 0,
            media: [],
            language: "en",
          };
        },
      );

      logger.info("Twitter scrape completed via API v2", {
        socialAccountId: options.socialAccountId,
        postsRetrieved: posts.length,
      });

      return {
        posts,
        isMock: false,
        totalAvailable: posts.length,
      };
    } catch (error) {
      logger.error("Twitter real scrape failed, falling back to mock", {
        socialAccountId: options.socialAccountId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Graceful fallback to mock data on API errors
      const posts = this.generateMockPosts(options.maxPosts ?? 50);
      return { posts, isMock: true, totalAvailable: posts.length };
    }
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
