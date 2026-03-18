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

  protected async doFetchMetrics(
    options: FetchMetricsOptions,
  ): Promise<EngagementMetrics> {
    // LinkedIn socialActions endpoint returns likes, comments, and shares
    // The platformPostId is a URN like "urn:li:share:123456" or "urn:li:ugcPost:123456"
    const encodedUrn = encodeURIComponent(options.platformPostId);
    const response = await fetch(
      `${LINKEDIN_API_BASE}/v2/socialActions/${encodedUrn}`,
      {
        headers: {
          Authorization: `Bearer ${options.accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      },
    );

    const data = (await this.handleApiResponse(response)) as {
      likesSummary?: { totalLikes: number; likedByCurrentUser: boolean };
      commentsSummary?: { totalFirstLevelComments: number };
      shareStatistics?: {
        shareCount: number;
        commentCount: number;
        reactionCount: number;
      };
    };

    return {
      impressions: 0, // Requires LinkedIn Marketing API with organization scope
      reach: 0, // Not available via standard UGC API
      likes: data.likesSummary?.totalLikes ?? data.shareStatistics?.reactionCount ?? 0,
      shares: data.shareStatistics?.shareCount ?? 0,
      comments: data.commentsSummary?.totalFirstLevelComments ?? data.shareStatistics?.commentCount ?? 0,
      clicks: 0, // Requires Analytics API with org authorization
    };
  }
}
