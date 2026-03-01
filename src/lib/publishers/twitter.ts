import type {
  PublishOptions,
  PublishResult,
  PlatformConstraints,
  RateLimitConfig,
} from "./types";
import { BasePublisherAdapter } from "./base-adapter";

const TWITTER_API_BASE = "https://api.twitter.com";

/**
 * Twitter/X API v2 publisher adapter.
 *
 * Posts tweets via POST /2/tweets using OAuth 2.0 Bearer token.
 * Media uploads use the v1.1 upload endpoint first, then attach
 * media_ids to the v2 tweet creation call.
 */
export class TwitterPublisher extends BasePublisherAdapter {
  readonly platform = "twitter" as const;

  readonly constraints: PlatformConstraints = {
    maxCharacters: 280,
    allowedMediaTypes: ["image", "video", "gif"],
  };

  readonly rateLimit: RateLimitConfig = {
    maxRequests: 300,
    windowMs: 15 * 60 * 1000, // 300 per 15 minutes (app-level)
  };

  protected async doPublish(options: PublishOptions): Promise<PublishResult> {
    const tweetBody: Record<string, unknown> = {
      text: options.content,
    };

    // Attach media if provided (assumes media already uploaded and we have IDs)
    if (options.media?.length) {
      const mediaIds = await this.uploadMedia(options);
      if (mediaIds.length > 0) {
        tweetBody.media = { media_ids: mediaIds };
      }
    }

    const response = await fetch(`${TWITTER_API_BASE}/2/tweets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.accessToken}`,
      },
      body: JSON.stringify(tweetBody),
    });

    const data = (await this.handleApiResponse(response)) as {
      data: { id: string };
    };

    const tweetId = data.data.id;

    return {
      success: true,
      platformPostId: tweetId,
      platformUrl: `https://x.com/i/status/${tweetId}`,
      retryable: false,
    };
  }

  /**
   * Upload media to Twitter's v1.1 media upload endpoint.
   * Returns an array of media ID strings to attach to the tweet.
   */
  private async uploadMedia(options: PublishOptions): Promise<string[]> {
    if (!options.media?.length) return [];

    const mediaIds: string[] = [];

    for (const media of options.media) {
      const response = await fetch(
        `${TWITTER_API_BASE}/1.1/media/upload.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${options.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            media_url: media.url,
            media_category:
              media.type === "video" ? "tweet_video" : "tweet_image",
          }),
        },
      );

      const data = (await this.handleApiResponse(response)) as {
        media_id_string: string;
      };

      mediaIds.push(data.media_id_string);
    }

    return mediaIds;
  }
}
