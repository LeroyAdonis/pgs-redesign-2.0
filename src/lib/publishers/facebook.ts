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
 * Facebook Pages API publisher adapter.
 *
 * Posts to /{page-id}/feed for text posts and
 * /{page-id}/photos for image posts.
 */
export class FacebookPublisher extends BasePublisherAdapter {
  readonly platform = "facebook" as const;

  readonly constraints: PlatformConstraints = {
    maxCharacters: 63206,
    allowedMediaTypes: ["image", "video", "gif"],
  };

  readonly rateLimit: RateLimitConfig = {
    maxRequests: 50,
    windowMs: 60 * 60 * 1000, // 50 per hour
  };

  protected async doPublish(options: PublishOptions): Promise<PublishResult> {
    const pageId = options.pageId ?? "me";

    const hasMedia = options.media && options.media.length > 0;

    if (hasMedia && options.media![0].type === "image") {
      return this.publishPhoto(pageId, options);
    }

    return this.publishFeedPost(pageId, options);
  }

  /** Publish a text post (or video link) to the page feed */
  private async publishFeedPost(
    pageId: string,
    options: PublishOptions,
  ): Promise<PublishResult> {
    const body: Record<string, string> = {
      message: options.content,
      access_token: options.accessToken,
    };

    // Attach video URL as a link if provided
    if (options.media?.length && options.media[0].type === "video") {
      body.link = options.media[0].url;
    }

    const response = await fetch(`${GRAPH_API_BASE}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await this.handleApiResponse(response)) as { id: string };

    return {
      success: true,
      platformPostId: data.id,
      platformUrl: `https://www.facebook.com/${data.id}`,
      retryable: false,
    };
  }

  /** Publish a photo post to the page */
  private async publishPhoto(
    pageId: string,
    options: PublishOptions,
  ): Promise<PublishResult> {
    const photo = options.media![0];

    const response = await fetch(`${GRAPH_API_BASE}/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: photo.url,
        caption: options.content,
        access_token: options.accessToken,
      }),
    });

    const data = (await this.handleApiResponse(response)) as { id: string };

    return {
      success: true,
      platformPostId: data.id,
      platformUrl: `https://www.facebook.com/${data.id}`,
      retryable: false,
    };
  }

  protected async doFetchMetrics(
    options: FetchMetricsOptions,
  ): Promise<EngagementMetrics> {
    const url = `${GRAPH_API_BASE}/${options.platformPostId}?fields=insights.metric(post_impressions,post_impressions_unique,post_reactions_by_type_total),likes.summary(true),comments.summary(true),shares&access_token=${options.accessToken}`;

    const response = await fetch(url);
    const data = (await this.handleApiResponse(response)) as {
      insights?: {
        data: Array<{
          name: string;
          values: Array<{ value: number | Record<string, number> }>;
        }>;
      };
      likes?: { summary: { total_count: number } };
      comments?: { summary: { total_count: number } };
      shares?: { count: number };
    };

    let impressions = 0;
    let reach = 0;

    if (data.insights?.data) {
      for (const metric of data.insights.data) {
        const value = metric.values?.[0]?.value;
        if (metric.name === "post_impressions" && typeof value === "number") {
          impressions = value;
        } else if (metric.name === "post_impressions_unique" && typeof value === "number") {
          reach = value;
        }
      }
    }

    return {
      impressions,
      reach,
      likes: data.likes?.summary?.total_count ?? 0,
      shares: data.shares?.count ?? 0,
      comments: data.comments?.summary?.total_count ?? 0,
      clicks: 0, // Requires post_insights with post_clicks_by_type
    };
  }
}
