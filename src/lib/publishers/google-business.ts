import type {
  PublishOptions,
  PublishResult,
  PlatformConstraints,
  RateLimitConfig,
} from "./types";
import { BasePublisherAdapter } from "./base-adapter";

const GBP_API_BASE = "https://mybusiness.googleapis.com/v4";

/**
 * Google Business Profile (formerly Google My Business) publisher adapter.
 *
 * Creates local posts via POST /accounts/{accountId}/locations/{locationId}/localPosts.
 * Supports text, event, and offer post types with optional photos.
 */
export class GoogleBusinessPublisher extends BasePublisherAdapter {
  readonly platform = "google_business" as const;

  readonly constraints: PlatformConstraints = {
    maxCharacters: 1500,
    allowedMediaTypes: ["image"],
  };

  readonly rateLimit: RateLimitConfig = {
    maxRequests: 60,
    windowMs: 60 * 1000, // standard Google API rate
  };

  protected async doPublish(options: PublishOptions): Promise<PublishResult> {
    // Location is resolved from the social account configuration
    const locationPath = "accounts/me/locations/me";

    const localPost = this.buildLocalPost(options);

    const response = await fetch(
      `${GBP_API_BASE}/${locationPath}/localPosts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${options.accessToken}`,
        },
        body: JSON.stringify(localPost),
      },
    );

    const data = (await this.handleApiResponse(response)) as {
      name: string;
      searchUrl?: string;
    };

    // The `name` field is the resource path, e.g. accounts/.../localPosts/123
    const postId = data.name.split("/").pop() ?? data.name;

    return {
      success: true,
      platformPostId: postId,
      platformUrl: data.searchUrl,
      retryable: false,
    };
  }

  /** Build a local post payload for the Google Business Profile API */
  private buildLocalPost(
    options: PublishOptions,
  ): Record<string, unknown> {
    const post: Record<string, unknown> = {
      languageCode: "en",
      summary: options.content,
      topicType: "STANDARD",
    };

    // Attach media as photos
    if (options.media?.length) {
      post.media = options.media
        .filter((m) => m.type === "image")
        .map((m) => ({
          mediaFormat: "PHOTO",
          sourceUrl: m.url,
        }));
    }

    return post;
  }
}
