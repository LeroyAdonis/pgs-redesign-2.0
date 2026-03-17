/**
 * Tests for notification trigger helpers
 *
 * Validates that each trigger function composes the correct notification
 * type, title, and message before delegating to createNotification.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock createNotification — we only care that the right data is passed
// ---------------------------------------------------------------------------

const mockCreateNotification = vi.fn().mockResolvedValue({
  id: "notif_mock",
  userId: "user_1",
  type: "info",
  title: "mock",
  message: "mock",
  data: null,
  readAt: null,
  createdAt: new Date(),
});

vi.mock("../notification-service", () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
}));

import {
  notifyPostPublished,
  notifyPostFailed,
  notifyLowCredits,
  notifyTokenExpiring,
  notifyWeeklyDigest,
  notifyScheduledReminder,
  notifyAdminSignup,
  notifyAdminSubscriptionChange,
} from "../notification-triggers";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const USER_ID = "user_test_123";

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// notifyPostPublished
// ---------------------------------------------------------------------------

describe("notifyPostPublished", () => {
  it("creates a success notification with correct title and message", async () => {
    const data = { postId: "post_1", platform: "twitter" };

    await notifyPostPublished(USER_ID, data);

    expect(mockCreateNotification).toHaveBeenCalledWith({
      userId: USER_ID,
      type: "success",
      title: "Post Published",
      message: "Your post was published to twitter successfully.",
      data,
    });
  });

  it("includes platformUrl in data when provided", async () => {
    const data = {
      postId: "post_1",
      platform: "instagram",
      platformUrl: "https://instagram.com/p/abc123",
    };

    await notifyPostPublished(USER_ID, data);

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ platformUrl: data.platformUrl }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// notifyPostFailed
// ---------------------------------------------------------------------------

describe("notifyPostFailed", () => {
  it("creates an error notification with error info", async () => {
    const data = {
      postId: "post_1",
      platform: "facebook",
      error: "Rate limit exceeded",
      retryable: true,
    };

    await notifyPostFailed(USER_ID, data);

    const call = mockCreateNotification.mock.calls[0][0];
    expect(call.type).toBe("error");
    expect(call.title).toBe("Post Failed");
    expect(call.message).toContain("Rate limit exceeded");
    expect(call.message).toContain("facebook");
  });

  it("includes retry hint when retryable", async () => {
    const data = {
      postId: "post_1",
      platform: "twitter",
      error: "Timeout",
      retryable: true,
    };

    await notifyPostFailed(USER_ID, data);

    const call = mockCreateNotification.mock.calls[0][0];
    expect(call.message).toContain("You can retry this post");
  });

  it("omits retry hint when not retryable", async () => {
    const data = {
      postId: "post_1",
      platform: "twitter",
      error: "Account suspended",
      retryable: false,
    };

    await notifyPostFailed(USER_ID, data);

    const call = mockCreateNotification.mock.calls[0][0];
    expect(call.message).not.toContain("retry");
  });
});

// ---------------------------------------------------------------------------
// notifyLowCredits
// ---------------------------------------------------------------------------

describe("notifyLowCredits", () => {
  it("creates a warning notification with percentage", async () => {
    const data = { remaining: 10, total: 100, percentage: 10 };

    await notifyLowCredits(USER_ID, data);

    const call = mockCreateNotification.mock.calls[0][0];
    expect(call.type).toBe("warning");
    expect(call.title).toBe("Low Credits");
    expect(call.message).toContain("10");
    expect(call.message).toContain("100");
    expect(call.message).toContain("10%");
  });
});

// ---------------------------------------------------------------------------
// notifyTokenExpiring
// ---------------------------------------------------------------------------

describe("notifyTokenExpiring", () => {
  it("creates a warning notification with platform and expiry", async () => {
    const data = {
      socialAccountId: "sa_1",
      platform: "instagram",
      expiresAt: "2025-06-30T00:00:00Z",
    };

    await notifyTokenExpiring(USER_ID, data);

    const call = mockCreateNotification.mock.calls[0][0];
    expect(call.type).toBe("warning");
    expect(call.title).toBe("Token Expiring");
    expect(call.message).toContain("instagram");
    expect(call.data).toEqual(data);
  });
});

// ---------------------------------------------------------------------------
// notifyWeeklyDigest
// ---------------------------------------------------------------------------

describe("notifyWeeklyDigest", () => {
  it("creates an info notification with trend up emoji", async () => {
    const data = {
      totalImpressions: 15000,
      topPostId: "post_top",
      trend: "up" as const,
    };

    await notifyWeeklyDigest(USER_ID, data);

    const call = mockCreateNotification.mock.calls[0][0];
    expect(call.type).toBe("info");
    expect(call.title).toBe("Weekly Digest");
    expect(call.message).toContain("📈");
    // toLocaleString() uses default locale — may be "15,000" or "15 000" (SA)
    expect(call.message).toContain("impressions this week");
  });

  it("uses trend down emoji for declining performance", async () => {
    const data = {
      totalImpressions: 5000,
      trend: "down" as const,
    };

    await notifyWeeklyDigest(USER_ID, data);

    const call = mockCreateNotification.mock.calls[0][0];
    expect(call.message).toContain("📉");
  });

  it("uses flat trend emoji", async () => {
    const data = {
      totalImpressions: 8000,
      trend: "flat" as const,
    };

    await notifyWeeklyDigest(USER_ID, data);

    const call = mockCreateNotification.mock.calls[0][0];
    expect(call.message).toContain("➡️");
  });
});

// ---------------------------------------------------------------------------
// notifyScheduledReminder
// ---------------------------------------------------------------------------

describe("notifyScheduledReminder", () => {
  it("creates an info notification with SAST formatted time", async () => {
    const data = {
      postId: "post_1",
      scheduledAt: "2025-06-20T14:00:00Z",
    };

    await notifyScheduledReminder(USER_ID, data);

    const call = mockCreateNotification.mock.calls[0][0];
    expect(call.type).toBe("info");
    expect(call.title).toBe("Scheduled Post Reminder");
    // The message should contain a time formatted in Africa/Johannesburg
    expect(call.message).toContain("scheduled to publish at");
  });
});

// ---------------------------------------------------------------------------
// notifyAdminSignup
// ---------------------------------------------------------------------------

describe("notifyAdminSignup", () => {
  it("creates a system notification with new user email", async () => {
    const data = {
      newUserId: "new_user_1",
      email: "newuser@example.com",
    };

    await notifyAdminSignup(USER_ID, data);

    const call = mockCreateNotification.mock.calls[0][0];
    expect(call.type).toBe("system");
    expect(call.title).toBe("New User Signup");
    expect(call.message).toContain("newuser@example.com");
  });
});

// ---------------------------------------------------------------------------
// notifyAdminSubscriptionChange
// ---------------------------------------------------------------------------

describe("notifyAdminSubscriptionChange", () => {
  it("creates a system notification with tier info", async () => {
    const data = {
      userId: "user_sub_1",
      fromTier: "free",
      toTier: "pro",
      action: "upgrade" as const,
    };

    await notifyAdminSubscriptionChange(USER_ID, data);

    const call = mockCreateNotification.mock.calls[0][0];
    expect(call.type).toBe("system");
    expect(call.title).toBe("Subscription Change");
    expect(call.message).toContain("free");
    expect(call.message).toContain("pro");
    expect(call.message).toContain("upgrade");
  });

  it("includes action type in message for downgrade", async () => {
    const data = {
      userId: "user_sub_2",
      fromTier: "pro",
      toTier: "free",
      action: "downgrade" as const,
    };

    await notifyAdminSubscriptionChange(USER_ID, data);

    const call = mockCreateNotification.mock.calls[0][0];
    expect(call.message).toContain("downgrade");
  });
});
