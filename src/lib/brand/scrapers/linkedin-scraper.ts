/**
 * LinkedIn scraper — Marketing API post extraction
 *
 * In production: uses LinkedIn Marketing API to fetch company posts.
 * In development: generates realistic SA-themed LinkedIn posts.
 */

import { logger } from "@/lib/logger";
import { decrypt } from "@/lib/crypto";
import { db } from "@/db";
import { socialAccount } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { RawPost, ScrapeOptions, ScrapeResult } from "../types";
import { BaseScraper } from "./base-scraper";

const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";

const MOCK_POSTS = [
  "Thrilled to announce that our team has grown to 50 members across Johannesburg, Cape Town, and Durban! 🇿🇦\n\nWhen we started 3 years ago, it was just 3 of us in a Braamfontein co-working space. Today, we serve over 500 SA businesses.\n\nKey learnings:\n✅ Invest in your people\n✅ Stay close to your customers\n✅ Never stop innovating\n\n#SABusiness #Growth #ProudlySA #Entrepreneurship",
  "📊 New Research: The State of Digital Marketing in South Africa 2025\n\nKey findings:\n• 73% of SA SMEs now use social media for marketing\n• Instagram and Facebook remain the top platforms\n• 45% increase in digital ad spend year-on-year\n\nDownload the full report (link in comments)\n\n#DigitalMarketing #SouthAfrica #Research #Marketing",
  "We're hiring! 🚀\n\nLooking for a Senior Software Engineer to join our Cape Town office.\n\nWhat we offer:\n• Competitive salary in ZAR\n• Flexible hybrid working\n• Medical aid contribution\n• Team braais every Friday 🥩\n\nApply via the link below.\n\n#NowHiring #CapeTown #TechJobs #SoftwareEngineering",
  "Honoured to speak at the SA Tech Summit in Sandton last week. 🎤\n\nMy talk on 'Building AI-First Products for the African Market' resonated with so many founders.\n\nThe message is clear: Africa is ready for AI, and SA is leading the charge.\n\nThank you to everyone who attended! 🙏\n\n#TechSummit #AI #Africa #Innovation #Sandton",
  "Heritage Day reflection 🇿🇦\n\nAt our company, diversity isn't just a policy — it's our strength. Our team speaks 8 of SA's 11 official languages.\n\nToday we celebrate what makes us different and what brings us together.\n\nHappy Heritage Day, Mzansi! 🌍\n\n#HeritageDay #Diversity #Ubuntu #RainbowNation",
  "Lessons from scaling a SaaS business in Mzansi:\n\n1. Understand load shedding impacts on your customers\n2. Price in ZAR — don't make SA businesses pay in USD\n3. WhatsApp > Email for customer communication\n4. Build for mobile-first (80% of SA internet is mobile)\n5. Partner with local payment providers\n\nWhat would you add? 👇\n\n#SaaS #Startup #SouthAfrica #Lessons",
  "Proud to share: We've been named one of the Top 50 Startups in Africa by Disrupt Africa! 🏆\n\nThis wouldn't be possible without our incredible team and customers.\n\nFrom Soweto to Silicon Valley — SA innovation is going global. 🌍🚀\n\n#Award #Startup #Africa #ProudlySA",
];

export class LinkedInScraper extends BaseScraper {
  readonly platform = "linkedin" as const;

  protected async scrapeReal(options: ScrapeOptions): Promise<ScrapeResult> {
    try {
      // Look up the social account to get tokens and org URN
      const accounts = await db
        .select()
        .from(socialAccount)
        .where(eq(socialAccount.id, options.socialAccountId))
        .limit(1);

      const account = accounts[0];
      if (!account?.accessTokenEncrypted) {
        logger.warn("LinkedIn scrape: no access token, falling back to mock", {
          socialAccountId: options.socialAccountId,
        });
        const posts = this.generateMockPosts(options.maxPosts ?? 50);
        return { posts, isMock: true, totalAvailable: posts.length };
      }

      const accessToken = decrypt(account.accessTokenEncrypted);
      const orgUrn = `urn:li:organization:${account.platformUserId}`;
      const count = Math.min(options.maxPosts ?? 50, 100);

      // LinkedIn Marketing API: fetch organization posts
      const url =
        `${LINKEDIN_API_BASE}/posts?author=${encodeURIComponent(orgUrn)}&count=${count}&q=author`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "LinkedIn-Version": "202401",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Unknown error");
        throw new Error(`LinkedIn API error (${response.status}): ${errorBody}`);
      }

      const data = await response.json();
      const elements = data.elements ?? data.data ?? [];

      if (!Array.isArray(elements)) {
        throw new Error("LinkedIn API returned unexpected data format");
      }

      // Normalize LinkedIn API response into RawPost format
      const posts: RawPost[] = elements
        .filter((liPost: Record<string, unknown>) => liPost.commentary || liPost.text)
        .map((liPost: Record<string, unknown>, i: number) => {
          // LinkedIn v2 uses "commentary" for post text, older API used "text"
          const content =
            ((liPost.commentary as Record<string, unknown>)?.text as string) ??
            (liPost.commentary as string) ??
            (liPost.text as string) ??
            "";

          const socialDetail = liPost.socialDetail as Record<string, unknown> | undefined;

          return {
            platformPostId: (liPost.id as string) ?? `li_${Date.now()}_${i}`,
            platform: "linkedin" as const,
            content,
            publishedAt: liPost.createdAt
              ? new Date(liPost.createdAt as number).toISOString()
              : new Date().toISOString(),
            hashtags: this.extractHashtags(content),
            emojis: this.extractEmojis(content),
            likes: (socialDetail?.totalLikes as number) ?? 0,
            comments: (socialDetail?.totalComments as number) ?? 0,
            shares: (socialDetail?.totalShares as number) ?? 0,
            media: [],
            language: "en",
          };
        });

      logger.info("LinkedIn scrape completed via Marketing API", {
        socialAccountId: options.socialAccountId,
        postsRetrieved: posts.length,
      });

      return {
        posts,
        isMock: false,
        totalAvailable: posts.length,
      };
    } catch (error) {
      logger.error("LinkedIn real scrape failed, falling back to mock", {
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
        platformPostId: `li_${Date.now()}_${i}`,
        platform: "linkedin",
        content,
        publishedAt: this.randomDate(120),
        hashtags: this.extractHashtags(content),
        emojis: this.extractEmojis(content),
        likes: Math.floor(Math.random() * 150) + 5,
        comments: Math.floor(Math.random() * 40),
        shares: Math.floor(Math.random() * 25),
        media: Math.random() > 0.4
          ? [
              {
                type: "image" as const,
                url: `https://placeholder.test/li/${i}.jpg`,
                dominantColors: [
                  this.randomPick(["#0a66c2", "#8b5cf6", "#ffffff"]),
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
