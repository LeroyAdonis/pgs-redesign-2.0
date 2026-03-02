import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { JobMonitorTable } from "@/components/admin/JobMonitorTable";
import type { JobRun } from "@/types/admin-jobs";

// ─── Fixtures ────────────────────────────────────────────────────

function createJob(overrides: Partial<JobRun> = {}): JobRun {
  return {
    id: "run_0001_post-publish",
    functionId: "post-publish",
    functionName: "Publish Post",
    status: "completed",
    startedAt: "2025-01-15T10:00:00.000Z",
    endedAt: "2025-01-15T10:02:30.000Z",
    attempt: 1,
    error: null,
    eventName: "post/publish",
    ...overrides,
  };
}

const sampleJobs: JobRun[] = [
  createJob({
    id: "run_0001",
    functionName: "Publish Post",
    functionId: "post-publish",
    status: "completed",
  }),
  createJob({
    id: "run_0002",
    functionName: "Check Scheduled Posts",
    functionId: "schedule-check",
    status: "running",
    endedAt: null,
  }),
  createJob({
    id: "run_0003",
    functionName: "Publish Post",
    functionId: "post-publish",
    status: "failed",
    attempt: 3,
    error:
      "Platform API rate limit exceeded: 429 Too Many Requests. Retry after 60s.",
  }),
  createJob({
    id: "run_0004",
    functionName: "Refresh Recent Metrics",
    functionId: "analytics-refresh-recent",
    status: "queued",
    endedAt: null,
  }),
  createJob({
    id: "run_0005",
    functionName: "Notify Post Published",
    functionId: "notify-post-published",
    status: "failed",
    attempt: 2,
    error: "OAuth token expired for account acc_xK9mL2.",
  }),
];

// ─── Mocks ───────────────────────────────────────────────────────

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true, jobs: sampleJobs }),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// ─── Tests ───────────────────────────────────────────────────────

describe("JobMonitorTable", () => {
  it("renders all job rows", () => {
    render(<JobMonitorTable initialJobs={sampleJobs} />);

    const rows = screen.getAllByTestId("job-row");
    expect(rows).toHaveLength(5);
  });

  it("displays function name and ID for each job", () => {
    render(<JobMonitorTable initialJobs={sampleJobs} />);

    expect(screen.getAllByText("Publish Post").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Check Scheduled Posts").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("post-publish").length).toBeGreaterThanOrEqual(1);
  });

  it("displays status badges with correct status text", () => {
    render(<JobMonitorTable initialJobs={sampleJobs} />);

    expect(screen.getByTestId("status-badge-completed")).toBeInTheDocument();
    expect(screen.getByTestId("status-badge-running")).toBeInTheDocument();
    expect(screen.getAllByTestId("status-badge-failed")).toHaveLength(2);
    expect(screen.getByTestId("status-badge-queued")).toBeInTheDocument();
  });

  it("shows empty state when no jobs match filters", async () => {
    const user = userEvent.setup();
    render(<JobMonitorTable initialJobs={sampleJobs} />);

    // Filter to "queued" then by a function that has no queued jobs
    const statusFilter = screen.getByTestId("status-filter");
    await user.selectOptions(statusFilter, "running");

    const functionFilter = screen.getByTestId("function-filter");
    await user.selectOptions(functionFilter, "Publish Post");

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(
      screen.getByText("No jobs match the current filters."),
    ).toBeInTheDocument();
  });

  // ─── Status filter ──────────────────────────────────────────

  describe("status filter", () => {
    it("filters jobs by selected status", async () => {
      const user = userEvent.setup();
      render(<JobMonitorTable initialJobs={sampleJobs} />);

      const statusFilter = screen.getByTestId("status-filter");
      await user.selectOptions(statusFilter, "failed");

      const rows = screen.getAllByTestId("job-row");
      expect(rows).toHaveLength(2);
    });

    it("shows all jobs when 'All statuses' is selected", async () => {
      const user = userEvent.setup();
      render(<JobMonitorTable initialJobs={sampleJobs} />);

      const statusFilter = screen.getByTestId("status-filter");
      await user.selectOptions(statusFilter, "failed");
      expect(screen.getAllByTestId("job-row")).toHaveLength(2);

      await user.selectOptions(statusFilter, "all");
      expect(screen.getAllByTestId("job-row")).toHaveLength(5);
    });
  });

  // ─── Function name filter ───────────────────────────────────

  describe("function name filter", () => {
    it("filters jobs by selected function name", async () => {
      const user = userEvent.setup();
      render(<JobMonitorTable initialJobs={sampleJobs} />);

      const functionFilter = screen.getByTestId("function-filter");
      await user.selectOptions(functionFilter, "Publish Post");

      const rows = screen.getAllByTestId("job-row");
      expect(rows).toHaveLength(2); // completed + failed
    });

    it("populates dropdown with unique function names", () => {
      render(<JobMonitorTable initialJobs={sampleJobs} />);

      const functionFilter = screen.getByTestId("function-filter");
      const options = within(functionFilter).getAllByRole("option");

      // "All functions" + 4 unique function names
      expect(options).toHaveLength(5);
      expect(options[0]).toHaveTextContent("All functions");
    });
  });

  // ─── Auto-refresh ───────────────────────────────────────────

  describe("auto-refresh", () => {
    it("starts disabled by default", () => {
      render(<JobMonitorTable initialJobs={sampleJobs} />);

      const toggle = screen.getByTestId("auto-refresh-toggle");
      expect(toggle).toHaveAttribute("aria-pressed", "false");
      expect(toggle).toHaveTextContent("Auto-refresh off");
    });

    it("toggles auto-refresh on click", async () => {
      const user = userEvent.setup();
      render(<JobMonitorTable initialJobs={sampleJobs} />);

      const toggle = screen.getByTestId("auto-refresh-toggle");
      await user.click(toggle);

      expect(toggle).toHaveAttribute("aria-pressed", "true");
      expect(toggle).toHaveTextContent("Auto-refresh on");
    });

    it("polls /api/admin/jobs every 30 seconds when enabled", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<JobMonitorTable initialJobs={sampleJobs} />);

      const toggle = screen.getByTestId("auto-refresh-toggle");
      await user.click(toggle);

      // No fetch yet at t=0
      expect(mockFetch).not.toHaveBeenCalled();

      // Advance 30 seconds
      await vi.advanceTimersByTimeAsync(30_000);
      expect(mockFetch).toHaveBeenCalledWith("/api/admin/jobs");
    });

    it("stops polling when auto-refresh is toggled off", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<JobMonitorTable initialJobs={sampleJobs} />);

      const toggle = screen.getByTestId("auto-refresh-toggle");
      await user.click(toggle); // enable
      await user.click(toggle); // disable

      // Reset call count after toggling — the enable click may have
      // triggered the interval setup but no tick yet.
      mockFetch.mockClear();

      await vi.advanceTimersByTimeAsync(60_000);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ─── Error expansion ───────────────────────────────────────

  describe("error details", () => {
    it("shows retry and expand buttons only for failed jobs", () => {
      render(<JobMonitorTable initialJobs={sampleJobs} />);

      const retryButtons = screen.getAllByTestId("retry-button");
      const expandButtons = screen.getAllByTestId("expand-error-button");

      // 2 failed jobs
      expect(retryButtons).toHaveLength(2);
      expect(expandButtons).toHaveLength(2);
    });

    it("expands error details when 'View error' is clicked", async () => {
      const user = userEvent.setup();
      render(<JobMonitorTable initialJobs={sampleJobs} />);

      const expandButtons = screen.getAllByTestId("expand-error-button");
      await user.click(expandButtons[0]);

      expect(screen.getByTestId("error-detail-row")).toBeInTheDocument();
      expect(
        screen.getByText(/Platform API rate limit exceeded/),
      ).toBeInTheDocument();
    });

    it("collapses error details when 'Hide error' is clicked", async () => {
      const user = userEvent.setup();
      render(<JobMonitorTable initialJobs={sampleJobs} />);

      const expandButtons = screen.getAllByTestId("expand-error-button");
      await user.click(expandButtons[0]); // expand
      expect(screen.getByTestId("error-detail-row")).toBeInTheDocument();

      await user.click(screen.getByText("Hide error")); // collapse
      expect(screen.queryByTestId("error-detail-row")).not.toBeInTheDocument();
    });

    it("renders error text in monospace font", async () => {
      const user = userEvent.setup();
      render(<JobMonitorTable initialJobs={sampleJobs} />);

      const expandButtons = screen.getAllByTestId("expand-error-button");
      await user.click(expandButtons[0]);

      const errorRow = screen.getByTestId("error-detail-row");
      const pre = errorRow.querySelector("pre");
      expect(pre).not.toBeNull();
      expect(pre?.className).toContain("font-mono");
    });
  });

  // ─── Retry button ──────────────────────────────────────────

  describe("retry button", () => {
    it("calls the retry API with correct payload on click", async () => {
      const user = userEvent.setup();
      render(<JobMonitorTable initialJobs={sampleJobs} />);

      const retryButtons = screen.getAllByTestId("retry-button");
      await user.click(retryButtons[0]);

      expect(mockFetch).toHaveBeenCalledWith("/api/admin/jobs/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: "run_0003",
          functionId: "post-publish",
        }),
      });
    });

    it("shows loading state while retrying", async () => {
      // Make the retry request hang
      let resolveRetry: (value: unknown) => void;
      mockFetch.mockImplementation((url: string) => {
        if (url === "/api/admin/jobs/retry") {
          return new Promise((resolve) => {
            resolveRetry = resolve;
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, jobs: sampleJobs }),
        });
      });

      const user = userEvent.setup();
      render(<JobMonitorTable initialJobs={sampleJobs} />);

      const retryButtons = screen.getAllByTestId("retry-button");
      await user.click(retryButtons[0]);

      // Should show loading state
      expect(screen.getByRole("status", { name: /loading/i })).toBeInTheDocument();
      expect(retryButtons[0]).toHaveAttribute("aria-busy", "true");

      // Resolve the request
      resolveRetry!({
        ok: true,
        json: () => Promise.resolve({ success: true, message: "Queued" }),
      });
    });

    it("updates job status to queued after successful retry", async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url === "/api/admin/jobs/retry") {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ success: true, message: "Retry queued" }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, jobs: sampleJobs }),
        });
      });

      const user = userEvent.setup();
      render(<JobMonitorTable initialJobs={sampleJobs} />);

      const retryButtons = screen.getAllByTestId("retry-button");
      await user.click(retryButtons[0]);

      // After retry, the first failed job should become queued
      // Wait for state update
      const queuedBadges = await screen.findAllByTestId("status-badge-queued");
      expect(queuedBadges.length).toBeGreaterThanOrEqual(2); // original queued + retried
    });
  });

  // ─── Duration formatting ───────────────────────────────────

  describe("duration display", () => {
    it("shows human-readable duration for completed jobs", () => {
      const job = createJob({
        id: "run_dur_1",
        startedAt: "2025-01-15T10:00:00.000Z",
        endedAt: "2025-01-15T10:02:30.000Z",
        status: "completed",
      });

      render(<JobMonitorTable initialJobs={[job]} />);
      expect(screen.getByText("2m 30s")).toBeInTheDocument();
    });
  });

  // ─── Attempt count ─────────────────────────────────────────

  describe("attempt display", () => {
    it("shows attempt count for failed jobs", () => {
      const job = createJob({
        id: "run_att_1",
        status: "failed",
        attempt: 3,
        error: "Some error",
      });

      render(<JobMonitorTable initialJobs={[job]} />);
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });
});
