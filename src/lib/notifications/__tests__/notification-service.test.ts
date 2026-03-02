/**
 * Tests for the notification service
 *
 * Mocks the Drizzle `db` object and validates CRUD operations:
 * create, read (paginated + unread count), mark as read,
 * mark all as read, and delete — including ownership checks.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../notification-service";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/db/schema", () => ({
  notification: {
    id: "notification.id",
    userId: "notification.userId",
    orgId: "notification.orgId",
    type: "notification.type",
    title: "notification.title",
    message: "notification.message",
    data: "notification.data",
    readAt: "notification.readAt",
    createdAt: "notification.createdAt",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  isNull: vi.fn((...args: unknown[]) => ({ type: "isNull", args })),
  isNotNull: vi.fn((...args: unknown[]) => ({ type: "isNotNull", args })),
  desc: vi.fn((...args: unknown[]) => ({ type: "desc", args })),
  count: vi.fn(() => "count(*)"),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let db: { select: Mock; update: Mock; insert: Mock; delete: Mock };

beforeEach(async () => {
  vi.clearAllMocks();
  const dbMod = await import("@/db");
  db = dbMod.db as unknown as typeof db;
});

// ---------------------------------------------------------------------------
// Helpers — fluent chain mocks mirroring Drizzle's builder API
// ---------------------------------------------------------------------------

/** Chain for db.select().from().where().orderBy().limit().offset() */
function selectChain<T>(result: T[]) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.from = vi.fn(self);
  chain.where = vi.fn(self);
  chain.limit = vi.fn(self);
  chain.offset = vi.fn(self);
  chain.orderBy = vi.fn(self);
  chain.then = (resolve: (v: T[]) => void) => Promise.resolve(result).then(resolve);
  return chain;
}

/** Chain for db.insert().values().returning() */
function insertChain<T>(result: T[]) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.values = vi.fn(self);
  chain.returning = vi.fn(() => Promise.resolve(result));
  chain.then = (resolve: (v: T[]) => void) => Promise.resolve(result).then(resolve);
  return chain;
}

/** Chain for db.update().set().where().returning() */
function updateChain<T>(result: T[]) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.set = vi.fn(self);
  chain.where = vi.fn(self);
  chain.returning = vi.fn(() => Promise.resolve(result));
  chain.then = (resolve: (v: T[]) => void) => Promise.resolve(result).then(resolve);
  return chain;
}

/** Chain for db.delete().where().returning() */
function deleteChain<T>(result: T[]) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.where = vi.fn(self);
  chain.returning = vi.fn(() => Promise.resolve(result));
  chain.then = (resolve: (v: T[]) => void) => Promise.resolve(result).then(resolve);
  return chain;
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const USER_ID = "user_test_123";
const OTHER_USER_ID = "user_other_456";

const mockNotification = {
  id: "notif_1",
  userId: USER_ID,
  orgId: null,
  type: "info" as const,
  title: "Test Notification",
  message: "This is a test.",
  data: null,
  readAt: null,
  createdAt: new Date("2025-06-15T10:00:00Z"),
};

// ---------------------------------------------------------------------------
// createNotification
// ---------------------------------------------------------------------------

describe("createNotification", () => {
  it("creates a notification successfully", async () => {
    db.insert.mockReturnValue(insertChain([mockNotification]));

    const result = await createNotification({
      userId: USER_ID,
      type: "info",
      title: "Test Notification",
      message: "This is a test.",
    });

    expect(result).toEqual(mockNotification);
    expect(db.insert).toHaveBeenCalled();
  });

  it("creates a notification with optional data and orgId", async () => {
    const withData = {
      ...mockNotification,
      orgId: "org_1",
      data: { postId: "post_1", platform: "twitter" },
    };
    db.insert.mockReturnValue(insertChain([withData]));

    const result = await createNotification({
      userId: USER_ID,
      orgId: "org_1",
      type: "success",
      title: "Post Published",
      message: "Your post was published.",
      data: { postId: "post_1", platform: "twitter" },
    });

    expect(result).toEqual(withData);
    expect(result.orgId).toBe("org_1");
  });

  it("throws and logs on DB error", async () => {
    const dbError = new Error("Connection refused");
    db.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(dbError),
      }),
    });

    await expect(
      createNotification({
        userId: USER_ID,
        type: "info",
        title: "Fail",
        message: "Will fail",
      }),
    ).rejects.toThrow("Connection refused");

    const { logger } = await import("@/lib/logger");
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to create notification",
      expect.objectContaining({ userId: USER_ID }),
    );
  });
});

// ---------------------------------------------------------------------------
// getUserNotifications
// ---------------------------------------------------------------------------

describe("getUserNotifications", () => {
  it("returns paginated results with defaults", async () => {
    const notifications = [mockNotification];
    db.select.mockReturnValue(selectChain(notifications));

    const result = await getUserNotifications(USER_ID);

    expect(result).toEqual(notifications);
    expect(db.select).toHaveBeenCalled();
  });

  it("applies custom limit and offset", async () => {
    db.select.mockReturnValue(selectChain([]));

    await getUserNotifications(USER_ID, { limit: 5, offset: 10 });

    const chain = db.select.mock.results[0].value;
    expect(chain.limit).toHaveBeenCalledWith(5);
    expect(chain.offset).toHaveBeenCalledWith(10);
  });

  it("filters by unread status (read=false)", async () => {
    db.select.mockReturnValue(selectChain([]));

    await getUserNotifications(USER_ID, { read: false });

    const chain = db.select.mock.results[0].value;
    expect(chain.where).toHaveBeenCalled();
  });

  it("filters by read status (read=true)", async () => {
    db.select.mockReturnValue(selectChain([]));

    await getUserNotifications(USER_ID, { read: true });

    const chain = db.select.mock.results[0].value;
    expect(chain.where).toHaveBeenCalled();
  });

  it("returns empty array when no notifications exist", async () => {
    db.select.mockReturnValue(selectChain([]));

    const result = await getUserNotifications(USER_ID);

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getUnreadCount
// ---------------------------------------------------------------------------

describe("getUnreadCount", () => {
  it("returns correct count", async () => {
    db.select.mockReturnValue(selectChain([{ value: 7 }]));

    const result = await getUnreadCount(USER_ID);

    expect(result).toBe(7);
  });

  it("returns 0 when no unread notifications", async () => {
    db.select.mockReturnValue(selectChain([{ value: 0 }]));

    const result = await getUnreadCount(USER_ID);

    expect(result).toBe(0);
  });

  it("returns 0 when result is empty", async () => {
    db.select.mockReturnValue(selectChain([]));

    const result = await getUnreadCount(USER_ID);

    expect(result).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// markAsRead
// ---------------------------------------------------------------------------

describe("markAsRead", () => {
  it("marks a notification as read successfully", async () => {
    db.update.mockReturnValue(updateChain([{ id: "notif_1" }]));

    const result = await markAsRead("notif_1", USER_ID);

    expect(result).toEqual({ success: true });
    expect(db.update).toHaveBeenCalled();
  });

  it("fails for wrong user (ownership check)", async () => {
    db.update.mockReturnValue(updateChain([]));

    const result = await markAsRead("notif_1", OTHER_USER_ID);

    expect(result).toEqual({
      success: false,
      error: "Notification not found or access denied",
    });
  });

  it("returns error for non-existent notification", async () => {
    db.update.mockReturnValue(updateChain([]));

    const result = await markAsRead("notif_nonexistent", USER_ID);

    expect(result).toEqual({
      success: false,
      error: "Notification not found or access denied",
    });
  });
});

// ---------------------------------------------------------------------------
// markAllAsRead
// ---------------------------------------------------------------------------

describe("markAllAsRead", () => {
  it("marks all unread notifications for user", async () => {
    db.update.mockReturnValue(
      updateChain([{ id: "notif_1" }, { id: "notif_2" }, { id: "notif_3" }]),
    );

    const result = await markAllAsRead(USER_ID);

    expect(result).toEqual({ updatedCount: 3 });
    expect(db.update).toHaveBeenCalled();
  });

  it("returns count of 0 when no unread notifications", async () => {
    db.update.mockReturnValue(updateChain([]));

    const result = await markAllAsRead(USER_ID);

    expect(result).toEqual({ updatedCount: 0 });
  });
});

// ---------------------------------------------------------------------------
// deleteNotification
// ---------------------------------------------------------------------------

describe("deleteNotification", () => {
  it("deletes a notification successfully", async () => {
    db.delete.mockReturnValue(deleteChain([{ id: "notif_1" }]));

    const result = await deleteNotification("notif_1", USER_ID);

    expect(result).toEqual({ success: true });
    expect(db.delete).toHaveBeenCalled();
  });

  it("fails for wrong user (ownership check)", async () => {
    db.delete.mockReturnValue(deleteChain([]));

    const result = await deleteNotification("notif_1", OTHER_USER_ID);

    expect(result).toEqual({
      success: false,
      error: "Notification not found or access denied",
    });
  });

  it("returns error for non-existent notification", async () => {
    db.delete.mockReturnValue(deleteChain([]));

    const result = await deleteNotification("notif_nonexistent", USER_ID);

    expect(result).toEqual({
      success: false,
      error: "Notification not found or access denied",
    });
  });
});
