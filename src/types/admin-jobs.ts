/**
 * Types for admin job monitoring
 *
 * Shared between the API route and client components.
 * Models Inngest function run data for display in the admin dashboard.
 */

export type JobStatus = "running" | "failed" | "queued" | "completed";

export interface JobRun {
  /** Unique run ID (e.g. Inngest run_id) */
  id: string;
  /** Inngest function ID (e.g. "post-publish") */
  functionId: string;
  /** Human-readable function name (e.g. "Publish Post") */
  functionName: string;
  /** Current status */
  status: JobStatus;
  /** When the run started (ISO string) */
  startedAt: string;
  /** When the run ended (ISO string, null if still running/queued) */
  endedAt: string | null;
  /** Current attempt number (1-based) */
  attempt: number;
  /** Error message if failed */
  error: string | null;
  /** Event that triggered the run */
  eventName: string;
}

export interface JobStats {
  total: number;
  running: number;
  failed: number;
  queued: number;
  completed: number;
}

export interface JobsApiResponse {
  success: boolean;
  jobs: JobRun[];
  stats: JobStats;
  error?: string;
}

export interface JobRetryRequest {
  runId: string;
  functionId: string;
}

export interface JobRetryResponse {
  success: boolean;
  message: string;
  error?: string;
}
