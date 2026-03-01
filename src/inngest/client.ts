/**
 * Inngest client — background job processing
 *
 * Single Inngest client instance shared across all functions.
 * The client ID identifies this application in the Inngest dashboard.
 */

import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "purple-glow-social" });
