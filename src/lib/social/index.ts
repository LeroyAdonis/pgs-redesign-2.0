export type {
  Platform,
  PlatformDisplayInfo,
  OAuthProviderConfig,
  OAuthState,
  OAuthTokenResponse,
  OAuthUserProfile,
  SocialAccountDTO,
} from "./types";

export { PLATFORMS } from "./types";

export {
  OAUTH_PROVIDERS,
  PLATFORM_DISPLAY,
  getRedirectUri,
  getClientCredentials,
} from "./providers";

export {
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  fetchUserProfile,
  generateCsrfToken,
  generateCodeVerifier,
  generateCodeChallenge,
} from "./oauth";

export {
  requireOrgMembership,
  listAccountsForOrg,
  getAccountById,
  upsertSocialAccount,
  disconnectAccount,
  refreshAccountToken,
  getDecryptedAccessToken,
} from "./account-service";
