/**
 * Brand module barrel exports
 */

// Types
export type {
  RawPost,
  RawPostMedia,
  ScrapeOptions,
  ScrapeResult,
  ScrapePlatform,
  BrandAnalysisResult,
  BrandProfileUpdate,
  ScanRequest,
  ScanPreviewRequest,
  ScanResponse,
  ToneFingerprint,
  VocabularyCluster,
  HashtagPattern,
  PostingCadence,
  EmojiUsage,
  VisualStyle,
} from "./types";

// Analyzer
export { analyzeBrandPosts } from "./analyzer";
export {
  analyzeTone,
  extractVocabularyClusters,
  analyzeHashtags,
  analyzePostingCadence,
  analyzeEmojis,
  calculateAvgContentLength,
  analyzeVisualStyle,
} from "./analyzer";

// SA Context
export {
  isSAHashtag,
  getSAHashtagCategory,
  countSASlang,
  findSASlang,
  mentionsSACity,
  findSACities,
  getUpcomingSAHoliday,
  calculateSACulturalScore,
  suggestSAHashtags,
  SA_HASHTAGS,
  SA_SLANG,
  SA_CITIES,
  SA_HOLIDAYS,
  SA_LANGUAGES,
} from "./sa-context";

// Profile Service
export {
  getProfilesForOrg,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
  analyzeBrand,
  previewBrandAnalysis,
  mergeProfiles,
} from "./profile-service";
export type { BrandProfileRow } from "./profile-service";

// Scrapers
export {
  getScraperForPlatform,
  getSupportedPlatforms,
} from "./scrapers";
