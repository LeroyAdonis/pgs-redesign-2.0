/**
 * Database schema — Drizzle ORM on Neon PostgreSQL
 *
 * Conventions:
 * - cuid2 for all primary keys (application tables)
 * - timestamptz for all timestamps
 * - singular table names (user, not users)
 * - snake_case for column names
 *
 * Table ownership:
 * - Better-auth managed: user, session, account, verification
 *   (defined here for type safety + Drizzle relations; managed by Better-auth at runtime)
 * - Application managed: everything else
 */

import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

// ============================================================
// TypeScript types for JSONB columns
// ============================================================

/** Tone analysis scores (0–1 range) */
export interface ToneFingerprint {
  formal: number;
  casual: number;
  humorous: number;
  professional: number;
  inspirational: number;
  educational: number;
}

/** Grouped vocabulary with frequency data */
export interface VocabularyCluster {
  category: string;
  words: string[];
  frequency: number;
}

/** Hashtag usage pattern */
export interface HashtagPattern {
  hashtag: string;
  frequency: number;
  category: string;
}

/** Weekly posting cadence */
export interface PostingCadence {
  dayOfWeek: number; // 0=Sun, 6=Sat
  hourOfDay: number; // 0–23
  postsPerWeek: number;
}

/** Emoji usage frequency */
export interface EmojiUsage {
  emoji: string;
  frequency: number;
}

/** Visual style preferences */
export interface VisualStyle {
  colorPalette: string[];
  filterPreferences: string[];
  imageTypes: string[];
}

/** Notification payload */
export interface NotificationData {
  [key: string]: unknown;
}

// ============================================================
// PostgreSQL enums
// ============================================================

export const platformEnum = pgEnum("platform", [
  "instagram",
  "facebook",
  "twitter",
  "linkedin",
  "tiktok",
  "whatsapp",
  "google_business",
]);

export const postStatusEnum = pgEnum("post_status", [
  "draft",
  "scheduled",
  "publishing",
  "published",
  "failed",
]);

export const tierEnum = pgEnum("tier", [
  "seedling",
  "hustler",
  "grower",
  "mogul",
]);

export const creditTransactionTypeEnum = pgEnum("credit_transaction_type", [
  "allocation",
  "deduction",
  "purchase",
  "rollover",
  "expiry",
  "bonus",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "past_due",
  "canceled",
  "trialing",
]);

export const mediaTypeEnum = pgEnum("media_type", [
  "image",
  "video",
  "gif",
]);

export const orgMemberRoleEnum = pgEnum("org_member_role", [
  "owner",
  "admin",
  "member",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "info",
  "warning",
  "success",
  "error",
  "system",
]);

export const contentRatingEnum = pgEnum("content_rating", [
  "thumbs_up",
  "thumbs_down",
  "edited",
]);

export const contentTypeEnum = pgEnum("content_type", [
  "text",
  "image",
  "video",
]);
// ============================================================
// Helper: cuid2 primary key default
// ============================================================

function cuid2Id(name = "id") {
  return text(name)
    .primaryKey()
    .$defaultFn(() => createId());
}

function timestamps() {
  return {
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  } as const;
}

// ============================================================
// Better-auth managed tables
// ------------------------------------------------------------
// These tables match Better-auth's expected schema for
// PostgreSQL with the Drizzle adapter. They are defined here
// so we can set up Drizzle relations and get type safety.
//
// DO NOT add application columns here — extend via Better-auth
// plugins or custom fields in the auth config (task 1.3).
//
// The `role` field is a Better-auth custom field for RBAC.
// ============================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").default("user"),
  ...timestamps(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  ...timestamps(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
    mode: "date",
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
    mode: "date",
  }),
  scope: text("scope"),
  password: text("password"),
  ...timestamps(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  ...timestamps(),
});

// ============================================================
// Application tables
// ============================================================

// --- Organizations ---

export const organization = pgTable(
  "organization",
  {
    id: cuid2Id(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tier: tierEnum("tier").notNull().default("seedling"),
    logoUrl: text("logo_url"),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("organization_slug_idx").on(table.slug),
    index("organization_owner_id_idx").on(table.ownerId),
  ],
);

export const organizationMember = pgTable(
  "organization_member",
  {
    id: cuid2Id(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: orgMemberRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("org_member_unique_idx").on(table.orgId, table.userId),
    index("org_member_user_id_idx").on(table.userId),
  ],
);

// --- Social accounts ---

export const socialAccount = pgTable(
  "social_account",
  {
    id: cuid2Id(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    platform: platformEnum("platform").notNull(),
    platformUserId: text("platform_user_id").notNull(),
    displayName: text("display_name"),
    /**
     * OAuth tokens are encrypted with AES-256-GCM before storage.
     * Encryption/decryption is handled by lib/crypto/.
     * Values are stored as base64-encoded ciphertext.
     */
    accessTokenEncrypted: text("access_token_encrypted"),
    refreshTokenEncrypted: text("refresh_token_encrypted"),
    tokenExpiresAt: timestamp("token_expires_at", {
      withTimezone: true,
      mode: "date",
    }),
    isActive: boolean("is_active").notNull().default(true),
    connectedAt: timestamp("connected_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("social_account_platform_unique_idx").on(
      table.orgId,
      table.platform,
      table.platformUserId,
    ),
    index("social_account_org_id_idx").on(table.orgId),
  ],
);

// --- Brand profiles ---

export const brandProfile = pgTable(
  "brand_profile",
  {
    id: cuid2Id(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    socialAccountId: text("social_account_id").references(
      () => socialAccount.id,
      { onDelete: "set null" },
    ),
    language: text("language").notNull().default("en"),
    toneFingerprint: jsonb("tone_fingerprint").$type<ToneFingerprint>(),
    vocabularyClusters:
      jsonb("vocabulary_clusters").$type<VocabularyCluster[]>(),
    hashtagPatterns: jsonb("hashtag_patterns").$type<HashtagPattern[]>(),
    postingCadence: jsonb("posting_cadence").$type<PostingCadence>(),
    emojiUsage: jsonb("emoji_usage").$type<EmojiUsage[]>(),
    avgContentLength: integer("avg_content_length"),
    visualStyle: jsonb("visual_style").$type<VisualStyle>(),
    ...timestamps(),
  },
  (table) => [index("brand_profile_org_id_idx").on(table.orgId)],
);

// --- Posts ---

export const post = pgTable(
  "post",
  {
    id: cuid2Id(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    contentLanguage: text("content_language").notNull().default("en"),
    platform: platformEnum("platform").notNull(),
    status: postStatusEnum("status").notNull().default("draft"),
    aiGenerated: boolean("ai_generated").notNull().default(false),
    aiPrompt: text("ai_prompt"),
    aiModel: text("ai_model"),
    ...timestamps(),
  },
  (table) => [
    index("post_org_status_idx").on(table.orgId, table.status),
    index("post_org_created_idx").on(table.orgId, table.createdAt),
    index("post_created_by_idx").on(table.createdById),
  ],
);

export const postMedia = pgTable(
  "post_media",
  {
    id: cuid2Id(),
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    mediaType: mediaTypeEnum("media_type").notNull(),
    url: text("url").notNull(),
    altText: text("alt_text"),
    width: integer("width"),
    height: integer("height"),
    sizeBytes: integer("size_bytes"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("post_media_post_id_idx").on(table.postId)],
);

export const postSchedule = pgTable(
  "post_schedule",
  {
    id: cuid2Id(),
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    socialAccountId: text("social_account_id")
      .notNull()
      .references(() => socialAccount.id, { onDelete: "cascade" }),
    scheduledAt: timestamp("scheduled_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    publishedAt: timestamp("published_at", {
      withTimezone: true,
      mode: "date",
    }),
    /** Platform-assigned post ID returned after successful publish (needed for metrics fetching) */
    platformPostId: text("platform_post_id"),
    failedAt: timestamp("failed_at", { withTimezone: true, mode: "date" }),
    retryCount: integer("retry_count").notNull().default(0),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("post_schedule_post_id_idx").on(table.postId),
    index("post_schedule_scheduled_at_idx").on(table.scheduledAt),
    index("post_schedule_social_account_idx").on(table.socialAccountId),
  ],
);

// --- Credits & billing ---

export const credit = pgTable(
  "credit",
  {
    id: cuid2Id(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    /** Current spendable balance (denormalized for fast reads) */
    balance: integer("balance").notNull().default(0),
    /** Monthly credit allocation based on subscription tier */
    monthlyAllocation: integer("monthly_allocation").notNull().default(0),
    /** Unused credits rolled over from previous month */
    rolloverBalance: integer("rollover_balance").notNull().default(0),
    /** When rollover credits expire */
    rolloverExpiresAt: timestamp("rollover_expires_at", {
      withTimezone: true,
      mode: "date",
    }),
    /** Last time the monthly allocation was applied */
    lastResetAt: timestamp("last_reset_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (table) => [uniqueIndex("credit_org_id_idx").on(table.orgId)],
);

export const creditTransaction = pgTable(
  "credit_transaction",
  {
    id: cuid2Id(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    type: creditTransactionTypeEnum("type").notNull(),
    /** Positive = credit added, negative = credit spent */
    amount: integer("amount").notNull(),
    /** Balance after this transaction (audit trail) */
    runningBalance: integer("running_balance").notNull(),
    description: text("description"),
    /** Links to the post that consumed credits (if applicable) */
    postId: text("post_id").references(() => post.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("credit_tx_org_created_idx").on(table.orgId, table.createdAt),
  ],
);

// --- Subscriptions ---

export const subscription = pgTable(
  "subscription",
  {
    id: cuid2Id(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    tier: tierEnum("tier").notNull().default("seedling"),
    /** Polar.sh subscription ID for webhook reconciliation */
    polarSubscriptionId: text("polar_subscription_id"),
    status: subscriptionStatusEnum("status").notNull().default("trialing"),
    currentPeriodStart: timestamp("current_period_start", {
      withTimezone: true,
      mode: "date",
    }),
    currentPeriodEnd: timestamp("current_period_end", {
      withTimezone: true,
      mode: "date",
    }),
    canceledAt: timestamp("canceled_at", {
      withTimezone: true,
      mode: "date",
    }),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("subscription_org_id_idx").on(table.orgId),
    uniqueIndex("subscription_polar_id_idx").on(table.polarSubscriptionId),
  ],
);

// --- Analytics ---

export const analytic = pgTable(
  "analytic",
  {
    id: cuid2Id(),
    postScheduleId: text("post_schedule_id")
      .notNull()
      .references(() => postSchedule.id, { onDelete: "cascade" }),
    impressions: integer("impressions").notNull().default(0),
    reach: integer("reach").notNull().default(0),
    likes: integer("likes").notNull().default(0),
    shares: integer("shares").notNull().default(0),
    comments: integer("comments").notNull().default(0),
    clicks: integer("clicks").notNull().default(0),
    engagementRate: real("engagement_rate"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("analytic_post_schedule_id_idx").on(table.postScheduleId),
  ],
);

// --- Notifications ---

export const notification = pgTable(
  "notification",
  {
    id: cuid2Id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    orgId: text("org_id").references(() => organization.id, {
      onDelete: "cascade",
    }),
    type: notificationTypeEnum("type").notNull().default("info"),
    title: text("title").notNull(),
    message: text("message").notNull(),
    data: jsonb("data").$type<NotificationData>(),
    readAt: timestamp("read_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notification_user_unread_idx").on(table.userId, table.readAt),
    index("notification_org_id_idx").on(table.orgId),
  ],
);

// --- AI Feedback ---

export const aiFeedback = pgTable(
  "ai_feedback",
  {
    id: cuid2Id(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    postId: text("post_id").references(() => post.id, {
      onDelete: "set null",
    }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    rating: contentRatingEnum("rating").notNull(),
    originalContent: text("original_content").notNull(),
    editedContent: text("edited_content"),
    aiModel: text("ai_model").notNull(),
    aiPrompt: text("ai_prompt").notNull(),
    platform: platformEnum("platform").notNull(),
    contentType: contentTypeEnum("content_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ai_feedback_org_id_idx").on(table.orgId),
    index("ai_feedback_user_id_idx").on(table.userId),
    index("ai_feedback_post_id_idx").on(table.postId),
    index("ai_feedback_created_at_idx").on(table.createdAt),
  ],
);

// ============================================================
// Drizzle relations
// ============================================================

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  ownedOrganizations: many(organization),
  organizationMemberships: many(organizationMember),
  posts: many(post),
  notifications: many(notification),
  aiFeedbacks: many(aiFeedback),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const organizationRelations = relations(
  organization,
  ({ one, many }) => ({
    owner: one(user, {
      fields: [organization.ownerId],
      references: [user.id],
    }),
    members: many(organizationMember),
    socialAccounts: many(socialAccount),
    brandProfiles: many(brandProfile),
    posts: many(post),
    credit: one(credit, {
      fields: [organization.id],
      references: [credit.orgId],
    }),
    creditTransactions: many(creditTransaction),
    subscription: one(subscription, {
      fields: [organization.id],
      references: [subscription.orgId],
    }),
    notifications: many(notification),
    aiFeedbacks: many(aiFeedback),
  }),
);

export const organizationMemberRelations = relations(
  organizationMember,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationMember.orgId],
      references: [organization.id],
    }),
    user: one(user, {
      fields: [organizationMember.userId],
      references: [user.id],
    }),
  }),
);

export const socialAccountRelations = relations(
  socialAccount,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [socialAccount.orgId],
      references: [organization.id],
    }),
    brandProfiles: many(brandProfile),
    postSchedules: many(postSchedule),
  }),
);

export const brandProfileRelations = relations(brandProfile, ({ one }) => ({
  organization: one(organization, {
    fields: [brandProfile.orgId],
    references: [organization.id],
  }),
  socialAccount: one(socialAccount, {
    fields: [brandProfile.socialAccountId],
    references: [socialAccount.id],
  }),
}));

export const postRelations = relations(post, ({ one, many }) => ({
  organization: one(organization, {
    fields: [post.orgId],
    references: [organization.id],
  }),
  createdBy: one(user, {
    fields: [post.createdById],
    references: [user.id],
  }),
  media: many(postMedia),
  schedules: many(postSchedule),
  creditTransactions: many(creditTransaction),
}));

export const postMediaRelations = relations(postMedia, ({ one }) => ({
  post: one(post, { fields: [postMedia.postId], references: [post.id] }),
}));

export const postScheduleRelations = relations(
  postSchedule,
  ({ one, many }) => ({
    post: one(post, {
      fields: [postSchedule.postId],
      references: [post.id],
    }),
    socialAccount: one(socialAccount, {
      fields: [postSchedule.socialAccountId],
      references: [socialAccount.id],
    }),
    analytics: many(analytic),
  }),
);

export const creditRelations = relations(credit, ({ one }) => ({
  organization: one(organization, {
    fields: [credit.orgId],
    references: [organization.id],
  }),
}));

export const creditTransactionRelations = relations(
  creditTransaction,
  ({ one }) => ({
    organization: one(organization, {
      fields: [creditTransaction.orgId],
      references: [organization.id],
    }),
    post: one(post, {
      fields: [creditTransaction.postId],
      references: [post.id],
    }),
  }),
);

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  organization: one(organization, {
    fields: [subscription.orgId],
    references: [organization.id],
  }),
}));

export const analyticRelations = relations(analytic, ({ one }) => ({
  postSchedule: one(postSchedule, {
    fields: [analytic.postScheduleId],
    references: [postSchedule.id],
  }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [notification.orgId],
    references: [organization.id],
  }),
}));

export const aiFeedbackRelations = relations(aiFeedback, ({ one }) => ({
  organization: one(organization, {
    fields: [aiFeedback.orgId],
    references: [organization.id],
  }),
  post: one(post, {
    fields: [aiFeedback.postId],
    references: [post.id],
  }),
  user: one(user, {
    fields: [aiFeedback.userId],
    references: [user.id],
  }),
}));
