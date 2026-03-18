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
    const pageId = options.pageId ?? "me"; // Use stored page ID or fall back to "me"

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

  protected async doFetchMetrics(
    options: FetchMetricsOptions,
  ): Promise<EngagementMetrics> {
    const metricsUrl = `${GRAPH_API_BASE}/${options.platformPostId}/insights?metric=impressions,reach,engagement,saved&access_token=${options.accessToken}`;

    const response = await fetch(metricsUrl);
    const data = (await this.handleApiResponse(response)) as {
      data: Array<{
        name: string;
        values: Array<{ value: number }>;
      }>;
    };

    const metricsMap: Record<string, number> = {};
    for (const item of data.data ?? []) {
      metricsMap[item.name] = item.values?.[0]?.value ?? 0;
    }

    return {
      impressions: metricsMap.impressions ?? 0,
      reach: metricsMap.reach ?? 0,
      likes: 0, // Requires separate /likes or engagement breakdown
      shares: 0, // Instagram doesn't expose share count via API
      comments: 0, // Requires separate /comments endpoint
      clicks: metricsMap.engagement ?? 0, // Engagement metric captures interactions
    };
  }
}
