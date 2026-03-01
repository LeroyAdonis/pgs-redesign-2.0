import type { Platform } from "@/lib/social/types";
import { logger } from "@/lib/logger";
import type {
  PublisherAdapter,
  PublishOptions,
  PublishResult,
  ContentValidation,
  RateLimitConfig,
  PlatformConstraints,
} from "./types";

/**
 * Abstract base class for all platform publisher adapters.
 *
 * Provides common logic for content validation, error normalisation,
 * and rate-limit awareness. Concrete adapters implement `doPublish()`
 * with platform-specific HTTP calls.
 */
export abstract class BasePublisherAdapter implements PublisherAdapter {
  abstract readonly platform: Platform;
  abstract readonly constraints: PlatformConstraints;
  abstract readonly rateLimit: RateLimitConfig;

  /**
   * Platform-specific publish implementation.
   * Called by `publish()` after content validation.
   */
  protected abstract doPublish(options: PublishOptions): Promise<PublishResult>;

  /** Publish a post to this platform with validation and error handling */
  async publish(options: PublishOptions): Promise<PublishResult> {
    const validation = this.validateContent(options.content);
    if (!validation.valid) {
      return {
        success: false,
        error: `Content validation failed: ${validation.errors.join("; ")}`,
        errorCode: "VALIDATION_ERROR",
        retryable: false,
      };
    }

    try {
      logger.info(`Publishing to ${this.platform}`, {
        postId: options.postId,
        hasMedia: Boolean(options.media?.length),
      });

      const result = await this.doPublish(options);

      if (result.success) {
        logger.info(`Published to ${this.platform}`, {
          postId: options.postId,
          platformPostId: result.platformPostId,
        });
      } else {
        logger.warn(`Publish failed on ${this.platform}`, {
          postId: options.postId,
          error: result.error,
          errorCode: result.errorCode,
          retryable: result.retryable,
        });
      }

      return result;
    } catch (err) {
      return this.normalizeError(err);
    }
  }

  /** Default content validation — checks character limit and emptiness */
  validateContent(content: string): ContentValidation {
    const errors: string[] = [];

    if (!content || content.trim().length === 0) {
      errors.push("Content must not be empty");
    }

    if (content.length > this.constraints.maxCharacters) {
      errors.push(
        `Content exceeds ${this.constraints.maxCharacters} character limit (got ${content.length})`,
      );
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Normalise an unknown error into a standardized PublishResult.
   * Detects rate-limit responses, auth failures, and generic errors.
   */
  protected normalizeError(err: unknown): PublishResult {
    if (err instanceof PlatformApiError) {
      return {
        success: false,
        error: err.message,
        errorCode: err.code,
        retryable: err.retryable,
      };
    }

    const message = err instanceof Error ? err.message : String(err);

    logger.error(`Unexpected error publishing to ${this.platform}`, {
      error: message,
    });

    return {
      success: false,
      error: message,
      errorCode: "UNKNOWN_ERROR",
      retryable: false,
    };
  }

  /**
   * Helper to parse a platform API JSON response, detect common errors,
   * and throw a PlatformApiError when appropriate.
   */
  protected async handleApiResponse(response: Response): Promise<unknown> {
    const body = (await response.json().catch(() => null)) as unknown;

    if (response.ok) {
      return body;
    }

    // Rate limit detection (standard HTTP 429)
    if (response.status === 429) {
      throw new PlatformApiError(
        "Rate limit exceeded — try again later",
        "RATE_LIMIT",
        true,
      );
    }

    // Auth errors (401/403) are not retryable
    if (response.status === 401 || response.status === 403) {
      throw new PlatformApiError(
        "Authentication failed — token may be expired or revoked",
        "AUTH_ERROR",
        false,
      );
    }

    // Extract error message from body if possible
    const errorMessage = extractErrorMessage(body, response.status);

    // Server errors (5xx) are generally retryable
    const retryable = response.status >= 500;

    throw new PlatformApiError(
      errorMessage,
      `HTTP_${response.status}`,
      retryable,
    );
  }
}

/**
 * Typed error representing a failure from a platform API.
 * Carries a machine-readable code and retryable flag.
 */
export class PlatformApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = "PlatformApiError";
  }
}

/** Best-effort extraction of an error message from an API response body */
function extractErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>;

    // Facebook / Instagram style
    if (obj.error && typeof obj.error === "object") {
      const fbErr = obj.error as Record<string, unknown>;
      if (typeof fbErr.message === "string") return fbErr.message;
    }

    // Twitter v2 style
    if (typeof obj.detail === "string") return obj.detail;

    // LinkedIn / generic style
    if (typeof obj.message === "string") return obj.message;

    // TikTok style
    if (obj.error && typeof obj.error === "object") {
      const tikErr = obj.error as Record<string, unknown>;
      if (typeof tikErr.message === "string") return tikErr.message;
    }
  }

  return `Platform API returned HTTP ${status}`;
}
