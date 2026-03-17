import type { Platform } from "@/lib/social/types";
import type { PublisherAdapter } from "./types";
import { InstagramPublisher } from "./instagram";
import { FacebookPublisher } from "./facebook";
import { TwitterPublisher } from "./twitter";
import { LinkedInPublisher } from "./linkedin";
import { TikTokPublisher } from "./tiktok";
import { WhatsAppPublisher } from "./whatsapp";
import { GoogleBusinessPublisher } from "./google-business";

/**
 * Cached adapter instances — adapters are stateless so a single
 * instance per platform is safe to reuse across requests.
 */
const adapterInstances = new Map<Platform, PublisherAdapter>();

/**
 * Return the correct publisher adapter for a given platform.
 *
 * Adapters are cached; the same instance is returned for repeat calls.
 * Throws if an unsupported platform is passed (exhaustive check).
 */
export function getPublisher(platform: Platform): PublisherAdapter {
  const cached = adapterInstances.get(platform);
  if (cached) return cached;

  let adapter: PublisherAdapter;

  switch (platform) {
    case "instagram":
      adapter = new InstagramPublisher();
      break;
    case "facebook":
      adapter = new FacebookPublisher();
      break;
    case "twitter":
      adapter = new TwitterPublisher();
      break;
    case "linkedin":
      adapter = new LinkedInPublisher();
      break;
    case "tiktok":
      adapter = new TikTokPublisher();
      break;
    case "whatsapp":
      adapter = new WhatsAppPublisher();
      break;
    case "google_business":
      adapter = new GoogleBusinessPublisher();
      break;
    default: {
      const _exhaustive: never = platform;
      throw new Error(`Unsupported platform: ${_exhaustive}`);
    }
  }

  adapterInstances.set(platform, adapter);
  return adapter;
}
