/**
 * Inngest webhook receiver — /api/inngest
 *
 * Exposes all Inngest functions to the Inngest Dev Server and Cloud.
 * The `serve` handler automatically handles:
 *   - GET:  Introspection (returns registered functions)
 *   - POST: Event receipt + function invocation
 *   - PUT:  Registration with Inngest Cloud
 *
 * @see https://www.inngest.com/docs/reference/serve
 */

import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import {
  publishPost,
  retryPost,
  checkScheduledPosts,
} from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [publishPost, retryPost, checkScheduledPosts],
});
