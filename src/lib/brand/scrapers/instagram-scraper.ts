/**
 * Instagram scraper — Graph API post extraction
 *
 * In production: uses Instagram Graph API to fetch recent media.
 * In development: generates realistic SA-themed Instagram posts.
 */

import { logger } from "@/lib/logger";
import type { RawPost, ScrapeOptions, ScrapeResult } from "../types";
import { BaseScraper } from "./base-scraper";

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
    logger.info("Instagram scrape: real API not yet implemented, falling back to mock", {
      socialAccountId: options.socialAccountId,
    });
    // Real implementation would use Instagram Graph API:
    // GET /{user-id}/media?fields=caption,timestamp,like_count,...
    const posts = this.generateMockPosts(options.maxPosts ?? 50);
    return { posts, isMock: true, totalAvailable: posts.length };
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
