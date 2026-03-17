import type {
  PublishOptions,
  PublishResult,
  ContentValidation,
  PlatformConstraints,
  RateLimitConfig,
  FetchMetricsOptions,
  EngagementMetrics,
} from "./types";
import { BasePublisherAdapter } from "./base-adapter";

const TIKTOK_API_BASE = "https://open.tiktokapis.com";

/**
 * TikTok Business API publisher adapter.
 *
 * Publishing flow (two-step):
 *   1. POST /v2/post/publish/video/init — initialise a video upload
 *   2. TikTok processes the video asynchronously
 *
 * Video is required — TikTok does not support text-only or image posts.
 */
export class TikTokPublisher extends BasePublisherAdapter {
  readonly platform = "tiktok" as const;

  readonly constraints: PlatformConstraints = {
    maxCharacters: 2200,
    mediaRequired: true,
    allowedMediaTypes: ["video"],
  };

  readonly rateLimit: RateLimitConfig = {
    maxRequests: 20,
    windowMs: 24 * 60 * 60 * 1000, // 20 per day
  };

  /** TikTok requires video — override to enforce that constraint */
  override validateContent(content: string): ContentValidation {
    const base = super.validateContent(content);
    // Note: media validation happens in doPublish since validateContent
    // only receives the text content, not the full options
    return base;
  }

  protected async doPublish(options: PublishOptions): Promise<PublishResult> {
    const video = options.media?.find((m) => m.type === "video");

    if (!video) {
      return {
        success: false,
        error: "TikTok requires a video attachment",
        errorCode: "VIDEO_REQUIRED",
        retryable: false,
      };
    }

    const response = await fetch(
      `${TIKTOK_API_BASE}/v2/post/publish/video/init/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${options.accessToken}`,
        },
        body: JSON.stringify({
          post_info: {
            title: options.content,
            privacy_level: "PUBLIC_TO_EVERYONE",
            disable_duet: false,
            disable_stitch: false,
            disable_comment: false,
          },
          source_info: {
            source: "PULL_FROM_URL",
            video_url: video.url,
          },
        }),
      },
    );

    const data = (await this.handleApiResponse(response)) as {
      data: { publish_id: string };
    };

    return {
      success: true,
      platformPostId: data.data.publish_id,
      // TikTok doesn't return a direct URL; the video is processed async
      platformUrl: undefined,
      retryable: false,
    };
  }

  // TODO: Replace with real platform API call
  protected async doFetchMetrics(
    options: FetchMetricsOptions,
  ): Promise<EngagementMetrics> {
    const seed = this.hashSeed(options.platformPostId);

    return {
      impressions: this.mockRange(seed, 5000, 50000),
      reach: this.mockRange(seed * 2, 3000, 30000),
      likes: this.mockRange(seed * 3, 100, 1000),
      shares: this.mockRange(seed * 4, 50, 500),
      comments: this.mockRange(seed * 5, 20, 200),
      clicks: this.mockRange(seed * 6, 10, 100),
    };
  }
}
