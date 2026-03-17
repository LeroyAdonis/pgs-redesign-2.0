import type {
  PublishOptions,
  PublishResult,
  PlatformConstraints,
  RateLimitConfig,
  FetchMetricsOptions,
  EngagementMetrics,
} from "./types";
import { BasePublisherAdapter } from "./base-adapter";

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

/**
 * Instagram Graph API publisher adapter.
 *
 * Publishing flow (two-step):
 *   1. POST /{page-id}/media — create a media container
 *   2. POST /{page-id}/media_publish — publish the container
 *
 * Text-only posts are not supported by the Instagram API;
 * at least one image or video is required.
 */
export class InstagramPublisher extends BasePublisherAdapter {
  readonly platform = "instagram" as const;

  readonly constraints: PlatformConstraints = {
    maxCharacters: 2200,
    mediaRequired: true,
    allowedMediaTypes: ["image", "video"],
  };

  readonly rateLimit: RateLimitConfig = {
    maxRequests: 25,
    windowMs: 60 * 60 * 1000, // 25 posts per hour
  };

  protected async doPublish(options: PublishOptions): Promise<PublishResult> {
    if (!options.media?.length) {
      return {
        success: false,
        error: "Instagram requires at least one image or video",
        errorCode: "MEDIA_REQUIRED",
        retryable: false,
      };
    }

    const firstMedia = options.media[0];
    const pageId = "me"; // Resolved by access token scope

    // Step 1 — Create media container
    const containerParams: Record<string, string> = {
      access_token: options.accessToken,
      caption: options.content,
    };

    if (firstMedia.type === "video") {
      containerParams.media_type = "VIDEO";
      containerParams.video_url = firstMedia.url;
    } else {
      containerParams.image_url = firstMedia.url;
    }

    const containerResponse = await fetch(
      `${GRAPH_API_BASE}/${pageId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(containerParams),
      },
    );

    const containerData = (await this.handleApiResponse(
      containerResponse,
    )) as { id: string };

    // Step 2 — Publish the container
    const publishResponse = await fetch(
      `${GRAPH_API_BASE}/${pageId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: options.accessToken,
        }),
      },
    );

    const publishData = (await this.handleApiResponse(publishResponse)) as {
      id: string;
    };

    return {
      success: true,
      platformPostId: publishData.id,
      platformUrl: `https://www.instagram.com/p/${publishData.id}`,
      retryable: false,
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
      likes: this.mockRange(seed * 3, 50, 500),
      shares: this.mockRange(seed * 4, 10, 100),
      comments: this.mockRange(seed * 5, 5, 50),
      clicks: this.mockRange(seed * 6, 20, 200),
    };
  }
}
