/**
 * Admin system health data generators
 *
 * Generates realistic mock/simulated system health data for the admin
 * dashboard. Used by both the server component (direct import) and
 * the API route to keep responses consistent.
 *
 * Replace individual generators with real platform API checks once
 * social media integrations are connected.
 */

import type {
  SystemHealthData,
  PlatformHealth,
  RateLimitInfo,
  ErrorEntry,
  UptimeRecord,
  HealthStatus,
  Platform,
} from "@/types/admin-system";

/** Simulate realistic platform health data */
function generatePlatformHealth(): PlatformHealth[] {
  const now = new Date();
  const platforms: { platform: Platform; baseMs: number }[] = [
    { platform: "instagram", baseMs: 120 },
    { platform: "facebook", baseMs: 95 },
    { platform: "twitter", baseMs: 180 },
    { platform: "linkedin", baseMs: 140 },
    { platform: "tiktok", baseMs: 200 },
  ];

  return platforms.map(({ platform, baseMs }) => {
    const isDegraded = platform === "twitter" && now.getMinutes() % 7 === 0;
    const jitter = Math.floor(Math.random() * 60) - 30;
    const responseTimeMs = Math.max(40, baseMs + jitter);

    let status: HealthStatus = "healthy";
    if (isDegraded) status = "degraded";
    if (responseTimeMs > 250) status = "degraded";

    return {
      platform,
      status,
      responseTimeMs,
      lastChecked: new Date(now.getTime() - Math.random() * 60_000).toISOString(),
      ...(isDegraded && { message: "Elevated response times detected" }),
    };
  });
}

/** Simulate rate limit usage data */
function generateRateLimits(): RateLimitInfo[] {
  const now = new Date();
  const resetTime = new Date(now.getTime() + 15 * 60_000).toISOString();

  const entries: Omit<RateLimitInfo, "resetsAt">[] = [
    { platform: "instagram", endpoint: "POST /media", used: 18, limit: 25 },
    { platform: "instagram", endpoint: "GET /insights", used: 150, limit: 200 },
    { platform: "facebook", endpoint: "POST /feed", used: 42, limit: 200 },
    { platform: "facebook", endpoint: "GET /page/insights", used: 180, limit: 200 },
    { platform: "twitter", endpoint: "POST /tweets", used: 280, limit: 300 },
    { platform: "twitter", endpoint: "GET /users/me", used: 890, limit: 900 },
    { platform: "linkedin", endpoint: "POST /ugcPosts", used: 85, limit: 100 },
    { platform: "tiktok", endpoint: "POST /video/upload", used: 8, limit: 50 },
  ];

  return entries.map((entry) => ({ ...entry, resetsAt: resetTime }));
}

/** Simulate recent error log entries */
function generateErrors(): ErrorEntry[] {
  const now = Date.now();

  const entries: Omit<ErrorEntry, "id" | "timestamp">[] = [
    {
      source: "Twitter/X OAuth",
      message: "Rate limit exceeded for user token refresh",
      severity: "warning",
      stackTrace: `Error: Rate limit exceeded\n    at TwitterClient.refreshToken (src/lib/publishers/twitter.ts:142:11)\n    at async publishPost (src/lib/publishers/index.ts:58:5)\n    at async Worker.process (src/lib/queue/worker.ts:23:7)`,
    },
    {
      source: "Image Processor",
      message: "Failed to resize image: unsupported format WebP",
      severity: "error",
      stackTrace: `TypeError: Unsupported image format: webp\n    at ImageProcessor.resize (src/lib/ai/image-processor.ts:87:13)\n    at async processMedia (src/lib/publishers/media.ts:34:9)`,
    },
    {
      source: "Database",
      message: "Connection pool exhausted, waiting for available connection",
      severity: "critical",
      stackTrace: `Error: Connection pool exhausted (max: 20)\n    at Pool.acquire (node_modules/@neondatabase/serverless/dist/index.js:412:15)\n    at async query (src/db/index.ts:18:20)`,
    },
    {
      source: "Instagram Publisher",
      message: "Media upload timed out after 30s",
      severity: "error",
    },
    {
      source: "Facebook API",
      message: "Page access token expired for page 'TechStartupZA'",
      severity: "warning",
    },
    {
      source: "Queue Worker",
      message: "Job retry scheduled: publish-post-abc123 (attempt 2/3)",
      severity: "info",
    },
    {
      source: "LinkedIn Scheduler",
      message: "Optimal time calculation used fallback timezone UTC+2",
      severity: "info",
    },
    {
      source: "TikTok Upload",
      message: "Video transcoding failed: duration exceeds 3 minutes",
      severity: "error",
      stackTrace: `Error: Video duration 214s exceeds maximum 180s\n    at TikTokClient.uploadVideo (src/lib/publishers/tiktok.ts:95:11)\n    at async publishPost (src/lib/publishers/index.ts:62:5)`,
    },
    {
      source: "Twitter/X OAuth",
      message: "Successfully refreshed 12 user tokens in batch",
      severity: "info",
    },
    {
      source: "Image Processor",
      message: "Sharp library fallback: using jimp for PNG processing",
      severity: "warning",
    },
  ];

  return entries.map((entry, index) => ({
    ...entry,
    id: `err-${now}-${index}`,
    timestamp: new Date(now - index * 3_600_000 * Math.random() * 5).toISOString(),
  }));
}

/** Simulate uptime records for core services */
function generateUptime(): UptimeRecord[] {
  const services = [
    { service: "API Server", uptimePercent: 99.97, streakDays: 42 },
    { service: "Database (Neon)", uptimePercent: 99.99, streakDays: 90 },
    { service: "Queue (Inngest)", uptimePercent: 99.92, streakDays: 28 },
    { service: "CDN / Media", uptimePercent: 99.85, streakDays: 14 },
    { service: "Auth (Better Auth)", uptimePercent: 100.0, streakDays: 90 },
  ];

  return services.map(({ service, uptimePercent, streakDays }) => {
    const dailyStatus = Array.from({ length: 90 }, (_, i) => {
      if (i >= 90 - streakDays) return true;
      return Math.random() > 0.03;
    });

    return { service, uptimePercent, currentStreakDays: streakDays, dailyStatus };
  });
}

/** Generate full system health data payload */
export function generateSystemHealthData(): SystemHealthData {
  const platforms = generatePlatformHealth();

  const hasDown = platforms.some((p) => p.status === "down");
  const hasDegraded = platforms.some((p) => p.status === "degraded");
  let overallStatus: HealthStatus = "healthy";
  if (hasDown) overallStatus = "down";
  else if (hasDegraded) overallStatus = "degraded";

  return {
    overallStatus,
    platforms,
    rateLimits: generateRateLimits(),
    errors: generateErrors(),
    uptime: generateUptime(),
    generatedAt: new Date().toISOString(),
  };
}
