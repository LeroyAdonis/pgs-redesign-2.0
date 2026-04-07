/**
 * Facebook scraper — Pages API post extraction
 *
 * In production: uses Facebook Graph API to fetch page posts.
 * In development: generates realistic SA-themed Facebook posts.
 */

import { logger } from "@/lib/logger";
import { decrypt } from "@/lib/crypto";
import { db } from "@/db";
import { socialAccount } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { RawPost, ScrapeOptions, ScrapeResult } from "../types";
import { BaseScraper } from "./base-scraper";

const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

const MOCK_POSTS = [
  "🎉 Exciting news Mzansi! We're opening our new branch in Sandton City this Saturday! Come celebrate with us — first 50 customers get a free gift! #Sandton #GrandOpening #ProudlySA",
  "Thank you to all our loyal customers in Johannesburg! We've just hit 10,000 followers 🙌 To celebrate, enjoy 20% off your next order. Use code THANKYOU10K #Joburg #Milestone",
  "Heritage Day is around the corner! 🇿🇦 Share your favourite braai recipe in the comments and you could win a R500 voucher! #HeritageDay #BraaiDay #SAFood",
  "Did you know? Our products are 100% locally sourced from small businesses across KwaZulu-Natal. When you buy from us, you support local communities 🤝 #SupportLocal #KZN #Ubuntu",
  "Monday motivation from our founder: 'Every great business starts with a dream and a lot of hard work. Keep pushing, SA entrepreneurs!' 💪🚀 #MondayMotivation #SABusiness",
  "📢 Important update: Our Cape Town store will be closed on Workers' Day (1 May). Online orders will still be processed as usual! #CapeTown #WorkersDay",
  "Check out our latest blog post: '7 Social Media Tips for SA Small Businesses' — link in comments! 📱💡 #DigitalMarketing #SmallBusiness #Mzansi",
  "Friday vibes from our Durban office! 🏖️ Wishing everyone a lekker weekend ahead. What are your plans? #FridayFeels #Durban #Weekend",
  "We're proud to announce our partnership with a local Soweto youth initiative! Together, we're training the next generation of digital entrepreneurs 🌟 #YouthEmpowerment #Soweto",
  "Customer review: 'Best service I've ever received! The team is so friendly and professional. Definitely recommending to all my friends.' — Themba from Pretoria ⭐⭐⭐⭐⭐ #CustomerLove",
];

export class FacebookScraper extends BaseScraper {
  readonly platform = "facebook" as const;

  protected async scrapeReal(options: ScrapeOptions): Promise<ScrapeResult> {
    try {
      // Look up the social account to get tokens and page ID
      const accounts = await db
        .select()
        .from(socialAccount)
        .where(eq(socialAccount.id, options.socialAccountId))
        .limit(1);

      const account = accounts[0];
      if (!account?.accessTokenEncrypted) {
        logger.warn("Facebook scrape: no access token, falling back to mock", {
          socialAccountId: options.socialAccountId,
        });
        const posts = this.generateMockPosts(options.maxPosts ?? 50);
        return { posts, isMock: true, totalAvailable: posts.length };
      }

      const accessToken = decrypt(account.accessTokenEncrypted);
      const pageId = account.pageId ?? account.platformUserId;
      const limit = Math.min(options.maxPosts ?? 50, 100);

      // Facebook Graph API: fetch page posts with engagement metrics
      const fields = "message,created_time,likes.summary(true),comments.summary(true),shares";
      const url = `${GRAPH_API_BASE}/${pageId}/posts?fields=${fields}&limit=${limit}&access_token=${accessToken}`;

      const response = await fetch(url, {
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Unknown error");
        throw new Error(`Facebook API error (${response.status}): ${errorBody}`);
      }

      const data = await response.json();

      if (!data.data || !Array.isArray(data.data)) {
        throw new Error("Facebook API returned unexpected data format");
      }

      // Normalize Facebook API response into RawPost format
      const posts: RawPost[] = data.data
        .filter((fbPost: Record<string, unknown>) => fbPost.message)
        .map((fbPost: Record<string, unknown>, i: number) => {
          const content = fbPost.message as string;
          const likesData = fbPost.likes as Record<string, unknown> | undefined;
          const likesSummary = likesData?.summary as Record<string, unknown> | undefined;
          const commentsData = fbPost.comments as Record<string, unknown> | undefined;
          const commentsSummary = commentsData?.summary as Record<string, unknown> | undefined;
          const sharesData = fbPost.shares as Record<string, unknown> | undefined;

          return {
            platformPostId: (fbPost.id as string) ?? `fb_${Date.now()}_${i}`,
            platform: "facebook" as const,
            content,
            publishedAt: (fbPost.created_time as string) ?? new Date().toISOString(),
            hashtags: this.extractHashtags(content),
            emojis: this.extractEmojis(content),
            likes: (likesSummary?.total_count as number) ?? 0,
            comments: (commentsSummary?.total_count as number) ?? 0,
            shares: (sharesData?.count as number) ?? 0,
            media: [],
            language: "en",
          };
        });

      logger.info("Facebook scrape completed via Graph API", {
        socialAccountId: options.socialAccountId,
        postsRetrieved: posts.length,
      });

      return {
        posts,
        isMock: false,
        totalAvailable: posts.length,
      };
    } catch (error) {
      logger.error("Facebook real scrape failed, falling back to mock", {
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
      const content = this.randomPick(MOCK_POSTS);
      posts.push({
        platformPostId: `fb_${Date.now()}_${i}`,
        platform: "facebook",
        content,
        publishedAt: this.randomDate(90),
        hashtags: this.extractHashtags(content),
        emojis: this.extractEmojis(content),
        likes: Math.floor(Math.random() * 300) + 5,
        comments: Math.floor(Math.random() * 80) + 1,
        shares: Math.floor(Math.random() * 40),
        media: Math.random() > 0.3
          ? [
              {
                type: "image" as const,
                url: `https://placeholder.test/fb/${i}.jpg`,
                dominantColors: [
                  this.randomPick(["#1877f2", "#8b5cf6", "#22c55e"]),
                ],
              },
            ]
          : [],
        language: "en",
      });
    }

    return posts;
  }
}
