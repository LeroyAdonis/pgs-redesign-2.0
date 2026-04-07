/**
 * Instagram scraper — Graph API post extraction
 *
 * In production: uses Instagram Graph API to fetch recent media.
 * In development: generates realistic SA-themed Instagram posts.
 */

import { logger } from "@/lib/logger";
import { decrypt } from "@/lib/crypto";
import { db } from "@/db";
import { socialAccount } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { RawPost, ScrapeOptions, ScrapeResult } from "../types";
import { BaseScraper } from "./base-scraper";

const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

/** Sample SA-themed Instagram captions for mock data */
const MOCK_CAPTIONS = [
  "Starting this beautiful Monday in Joburg with a flat white and big dreams ☕🌄 #JoziLife #MondayMotivation #Mzansi",
  "Our new range just dropped! 🔥 Handcrafted with love in Cape Town. Support local, support lekker design 🇿🇦 #LocalIsLekker #CapeTown #ProudlySA",
  "Heritage Day braai vibes 🥩🔥 Nothing beats a good shisa nyama with the fam! #BraaiDay #HeritageDay #ShisaNyama #SAFood",
  "Team building in Durban 🏖️ Work hard, play hard at the beach! eThekwini knows how to do it right 💪 #DurbanLife #TeamVibes #eThekwini",
  "Tip of the day: 5 ways to grow your SA small business on social media 📈 Link in bio! #SABusiness #GrowthTips #Entrepreneur",
  "Good morning from Table Mountain! 🏔️ Every sunrise here reminds us why we love the Mother City ❤️ #TableMountain #CapeTownLife #MotherCity",
  "Just launched our new Amapiano playlist for the store 🎵🕺 The vibes are immaculate! #Amapiano #SAMusic #Vibes",
  "Friday feels in Sandton! 🎉 Pop into our store this weekend for exclusive deals 🛍️ #Sandton #WeekendVibes #ShopLocal",
  "Ubuntu means 'I am because we are' 🤝 Building community one connection at a time #Ubuntu #Community #Together",
  "Eish, Mondays! But this bobotie is making it all better 😋 Best comfort food in Mzansi #Bobotie #SAFood #ComfortFood",
  "New collection inspired by the Jacaranda blooms of Pretoria 💜🌸 Available now! #JacarandaCity #Pretoria #NewCollection",
  "Howzit! We're hiring! Join our growing team in Johannesburg 🚀 DM us for details #Joburg #NowHiring #SAJobs",
  "Customer spotlight: Thandiwe from Soweto absolutely rocking our summer range! 🌟 #CustomerLove #Soweto #ProudlySA",
  "Wellness Wednesday 🧘‍♀️ Taking a moment to breathe in the Winelands. Self-care is lekker! #WellnessWednesday #Stellenbosch #SelfCare",
  "Flash sale! 30% off everything this Freedom Day weekend 🇿🇦🎊 Use code FREEDOM27 #FreedomDay #Sale #MadeinSA",
];

export class InstagramScraper extends BaseScraper {
  readonly platform = "instagram" as const;

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
        logger.warn("Instagram scrape: no access token, falling back to mock", {
          socialAccountId: options.socialAccountId,
        });
        const posts = this.generateMockPosts(options.maxPosts ?? 50);
        return { posts, isMock: true, totalAvailable: posts.length };
      }

      const accessToken = decrypt(account.accessTokenEncrypted);
      const igUserId = account.pageId ?? account.platformUserId;
      const limit = Math.min(options.maxPosts ?? 50, 100);

      // Instagram Graph API: fetch recent media with engagement metrics
      const fields = "caption,timestamp,like_count,comments_count,media_type,media_url,permalink";
      const url = `${GRAPH_API_BASE}/${igUserId}/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`;

      const response = await fetch(url, {
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Unknown error");
        throw new Error(`Instagram API error (${response.status}): ${errorBody}`);
      }

      const data = await response.json();

      if (!data.data || !Array.isArray(data.data)) {
        throw new Error("Instagram API returned unexpected data format");
      }

      // Normalize Instagram API response into RawPost format
      const posts: RawPost[] = data.data
        .filter((igPost: Record<string, unknown>) => igPost.caption)
        .map((igPost: Record<string, unknown>, i: number) => {
          const content = (igPost.caption as string) ?? "";
          const mediaType = igPost.media_type as string | undefined;

          return {
            platformPostId: (igPost.id as string) ?? `ig_${Date.now()}_${i}`,
            platform: "instagram" as const,
            content,
            publishedAt: (igPost.timestamp as string) ?? new Date().toISOString(),
            hashtags: this.extractHashtags(content),
            emojis: this.extractEmojis(content),
            likes: (igPost.like_count as number) ?? 0,
            comments: (igPost.comments_count as number) ?? 0,
            shares: 0, // Instagram API doesn't expose share count
            media: igPost.media_url
              ? [
                  {
                    type: mediaType === "VIDEO" ? "video" as const : "image" as const,
                    url: igPost.media_url as string,
                  },
                ]
              : [],
            language: "en",
          };
        });

      logger.info("Instagram scrape completed via Graph API", {
        socialAccountId: options.socialAccountId,
        postsRetrieved: posts.length,
      });

      return {
        posts,
        isMock: false,
        totalAvailable: posts.length,
      };
    } catch (error) {
      logger.error("Instagram real scrape failed, falling back to mock", {
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
      const caption = this.randomPick(MOCK_CAPTIONS);
      posts.push({
        platformPostId: `ig_${Date.now()}_${i}`,
        platform: "instagram",
        content: caption,
        publishedAt: this.randomDate(90),
        hashtags: this.extractHashtags(caption),
        emojis: this.extractEmojis(caption),
        likes: Math.floor(Math.random() * 500) + 10,
        comments: Math.floor(Math.random() * 50),
        shares: Math.floor(Math.random() * 20),
        media: [
          {
            type: "image",
            url: `https://placeholder.test/ig/${i}.jpg`,
            dominantColors: [
              this.randomPick(["#8b5cf6", "#f472b6", "#22c55e", "#3b82f6", "#eab308"]),
              this.randomPick(["#ffffff", "#000000", "#f8fafc", "#1e293b"]),
            ],
            filter: this.randomPick(["none", "clarendon", "gingham", "moon", "lark"]),
          },
        ],
        language: "en",
      });
    }

    return posts;
  }
}
