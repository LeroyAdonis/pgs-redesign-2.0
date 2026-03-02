import type {
  PublishOptions,
  PublishResult,
  PlatformConstraints,
  RateLimitConfig,
  FetchMetricsOptions,
  EngagementMetrics,
} from "./types";
import { BasePublisherAdapter } from "./base-adapter";

const LINKEDIN_API_BASE = "https://api.linkedin.com";

/**
 * LinkedIn UGC Posts API publisher adapter.
 *
 * Creates user-generated content posts via POST /v2/ugcPosts.
 * Supports text-only and text+image posts. Image assets must be
 * pre-registered and uploaded via the LinkedIn asset API before
 * being referenced in the post.
 */
export class LinkedInPublisher extends BasePublisherAdapter {
  readonly platform = "linkedin" as const;

  readonly constraints: PlatformConstraints = {
    maxCharacters: 3000,
    allowedMediaTypes: ["image", "video"],
  };

  readonly rateLimit: RateLimitConfig = {
    maxRequests: 100,
    windowMs: 24 * 60 * 60 * 1000, // 100 per day
  };

  protected async doPublish(options: PublishOptions): Promise<PublishResult> {
    const ugcPost = this.buildUgcPost(options);

    const response = await fetch(`${LINKEDIN_API_BASE}/v2/ugcPosts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(ugcPost),
    });

    const data = (await this.handleApiResponse(response)) as {
      id: string;
    };

    // LinkedIn post IDs are URNs like "urn:li:share:123456"
    const shareId = data.id.split(":").pop() ?? data.id;

    return {
      success: true,
      platformPostId: data.id,
      platformUrl: `https://www.linkedin.com/feed/update/${data.id}`,
      retryable: false,
    };
  }

  /** Build the UGC post payload for the LinkedIn API */
  private buildUgcPost(options: PublishOptions): Record<string, unknown> {
    const mediaContent: unknown[] = [];

    if (options.media?.length) {
      for (const media of options.media) {
        mediaContent.push({
          status: "READY",
          media: media.url,
          title: { text: media.altText ?? "" },
        });
      }
    }

    return {
      author: "urn:li:person:me",
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: options.content },
          shareMediaCategory:
            mediaContent.length > 0 ? "IMAGE" : "NONE",
          media: mediaContent.length > 0 ? mediaContent : undefined,
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };
  }

  // TODO: Replace with real platform API call
  protected async doFetchMetrics(
    options: FetchMetricsOptions,
  ): Promise<EngagementMetrics> {
    const seed = this.hashSeed(options.platformPostId);

    return {
      impressions: this.mockRange(seed, 500, 5000),
      reach: this.mockRange(seed * 2, 300, 3000),
      likes: this.mockRange(seed * 3, 20, 200),
      shares: this.mockRange(seed * 4, 5, 50),
      comments: this.mockRange(seed * 5, 10, 100),
      clicks: this.mockRange(seed * 6, 40, 400),
    };
  }
}
