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
 * WhatsApp Business API publisher adapter.
 *
 * Sends template-based messages via POST /{phone-number-id}/messages.
 * WhatsApp Business API does not support free-form broadcast — all
 * outbound messages must use pre-approved message templates.
 *
 * The `content` field is used as the template body text parameter.
 */
export class WhatsAppPublisher extends BasePublisherAdapter {
  readonly platform = "whatsapp" as const;

  readonly constraints: PlatformConstraints = {
    maxCharacters: 1024,
    allowedMediaTypes: ["image", "video"],
  };

  readonly rateLimit: RateLimitConfig = {
    maxRequests: 80,
    windowMs: 60 * 1000, // 80 messages per second tier
  };

  protected async doPublish(options: PublishOptions): Promise<PublishResult> {
    const phoneNumberId = "me"; // Resolved by access token scope

    const messagePayload = this.buildTemplateMessage(options);

    const response = await fetch(
      `${GRAPH_API_BASE}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${options.accessToken}`,
        },
        body: JSON.stringify(messagePayload),
      },
    );

    const data = (await this.handleApiResponse(response)) as {
      messages: Array<{ id: string }>;
    };

    const messageId = data.messages?.[0]?.id ?? "unknown";

    return {
      success: true,
      platformPostId: messageId,
      // WhatsApp messages don't have public URLs
      platformUrl: undefined,
      retryable: false,
    };
  }

  /** Build a template-based message payload for the WhatsApp API */
  private buildTemplateMessage(
    options: PublishOptions,
  ): Record<string, unknown> {
    const components: unknown[] = [
      {
        type: "body",
        parameters: [{ type: "text", text: options.content }],
      },
    ];

    // Attach media as header component if provided
    if (options.media?.length) {
      const media = options.media[0];
      components.unshift({
        type: "header",
        parameters: [
          {
            type: media.type === "video" ? "video" : "image",
            [media.type === "video" ? "video" : "image"]: {
              link: media.url,
            },
          },
        ],
      });
    }

    return {
      messaging_product: "whatsapp",
      type: "template",
      template: {
        name: "social_post_broadcast",
        language: { code: "en" },
        components,
      },
    };
  }

  // TODO: Replace with real platform API call
  protected async doFetchMetrics(
    options: FetchMetricsOptions,
  ): Promise<EngagementMetrics> {
    const seed = this.hashSeed(options.platformPostId);

    return {
      impressions: this.mockRange(seed, 10, 100),
      reach: this.mockRange(seed * 2, 10, 100),
      likes: 0,
      shares: this.mockRange(seed * 4, 1, 10),
      comments: 0,
      clicks: 0,
    };
  }
}
