/**
 * Tests for ApiHealthStatus component
 *
 * Validates that:
 * - All five platforms are rendered
 * - Correct status labels and colors appear
 * - Response times are displayed
 * - Auto-refresh timer is set up and cleaned up
 * - Manual refresh button triggers fetch
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiHealthStatus } from "../ApiHealthStatus";
import type { PlatformHealth } from "@/types/admin-system";

// ─── Mock data ───

function makePlatformData(
  overrides?: Partial<PlatformHealth>[],
): PlatformHealth[] {
  const defaults: PlatformHealth[] = [
    {
      platform: "instagram",
      status: "healthy",
      responseTimeMs: 120,
      lastChecked: new Date().toISOString(),
    },
    {
      platform: "facebook",
      status: "healthy",
      responseTimeMs: 95,
      lastChecked: new Date().toISOString(),
    },
    {
      platform: "twitter",
      status: "degraded",
      responseTimeMs: 220,
      lastChecked: new Date().toISOString(),
      message: "Elevated response times detected",
    },
    {
      platform: "linkedin",
      status: "healthy",
      responseTimeMs: 140,
      lastChecked: new Date().toISOString(),
    },
    {
      platform: "tiktok",
      status: "down",
      responseTimeMs: 0,
      lastChecked: new Date().toISOString(),
    },
  ];

  if (overrides) {
    return defaults.map((d, i) => ({ ...d, ...overrides[i] }));
  }
  return defaults;
}

// ─── Tests ───

describe("ApiHealthStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { platforms: makePlatformData() },
          }),
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders all five platforms", () => {
    render(<ApiHealthStatus initialData={makePlatformData()} />);

    expect(screen.getByTestId("platform-health-instagram")).toBeInTheDocument();
    expect(screen.getByTestId("platform-health-facebook")).toBeInTheDocument();
    expect(screen.getByTestId("platform-health-twitter")).toBeInTheDocument();
    expect(screen.getByTestId("platform-health-linkedin")).toBeInTheDocument();
    expect(screen.getByTestId("platform-health-tiktok")).toBeInTheDocument();
  });

  it("displays correct status labels", () => {
    render(<ApiHealthStatus initialData={makePlatformData()} />);

    expect(screen.getByTestId("status-label-instagram")).toHaveTextContent(
      "Healthy",
    );
    expect(screen.getByTestId("status-label-twitter")).toHaveTextContent(
      "Degraded",
    );
    expect(screen.getByTestId("status-label-tiktok")).toHaveTextContent(
      "Down",
    );
  });

  it("shows response times in milliseconds", () => {
    render(<ApiHealthStatus initialData={makePlatformData()} />);

    const instagramRow = screen.getByTestId("platform-health-instagram");
    expect(within(instagramRow).getByText("120ms")).toBeInTheDocument();

    const twitterRow = screen.getByTestId("platform-health-twitter");
    expect(within(twitterRow).getByText("220ms")).toBeInTheDocument();
  });

  it("shows platform display names", () => {
    render(<ApiHealthStatus initialData={makePlatformData()} />);

    expect(screen.getByText("Instagram")).toBeInTheDocument();
    expect(screen.getByText("Facebook")).toBeInTheDocument();
    expect(screen.getByText("Twitter / X")).toBeInTheDocument();
    expect(screen.getByText("LinkedIn")).toBeInTheDocument();
    expect(screen.getByText("TikTok")).toBeInTheDocument();
  });

  it("auto-refreshes every 60 seconds", async () => {
    render(<ApiHealthStatus initialData={makePlatformData()} />);

    expect(fetch).not.toHaveBeenCalled();

    // Advance 60 seconds
    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("/api/admin/system");

    // Advance another 60 seconds
    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("manual refresh button triggers fetch", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ApiHealthStatus initialData={makePlatformData()} />);

    const refreshButton = screen.getByRole("button", {
      name: /refresh health status/i,
    });

    await user.click(refreshButton);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("/api/admin/system");
  });

  it("cleans up interval on unmount", () => {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    const { unmount } = render(
      <ApiHealthStatus initialData={makePlatformData()} />,
    );

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it("handles all-healthy data correctly", () => {
    const allHealthy = makePlatformData().map((p) => ({
      ...p,
      status: "healthy" as const,
      responseTimeMs: 100,
    }));

    render(<ApiHealthStatus initialData={allHealthy} />);

    const healthyLabels = screen.getAllByText("Healthy");
    expect(healthyLabels).toHaveLength(5);
  });
});
