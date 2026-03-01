/**
 * LinkedIn scraper — Marketing API post extraction
 *
 * In production: uses LinkedIn Marketing API to fetch company posts.
 * In development: generates realistic SA-themed LinkedIn posts.
 */

import { logger } from "@/lib/logger";
import type { RawPost, ScrapeOptions, ScrapeResult } from "../types";
import { BaseScraper } from "./base-scraper";

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
    logger.info("LinkedIn scrape: real API not yet implemented, falling back to mock", {
      socialAccountId: options.socialAccountId,
    });
    // Real implementation would use LinkedIn Marketing API:
    // GET /v2/posts?author=urn:li:organization:{id}
    const posts = this.generateMockPosts(options.maxPosts ?? 50);
    return { posts, isMock: true, totalAvailable: posts.length };
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
