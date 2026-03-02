export {
  recordMetrics,
  getPostAnalytics,
  getOrgAnalytics,
  getPlatformComparison,
  getBestPostingTimes,
  getContentPerformance,
  getEngagementTrends,
  getTopPosts,
} from "./analytics-service";

export type {
  EngagementMetrics,
  PostAnalytics,
  OrgAnalyticsSummary,
  PlatformComparison,
  BestPostingTime,
  ContentPerformance,
  EngagementTrend,
  DateRange,
} from "./types";
