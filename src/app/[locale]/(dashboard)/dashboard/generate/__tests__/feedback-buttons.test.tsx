/**
 * @vitest-environment happy-dom
 */

/**
 * Tests for the FeedbackButtons component.
 *
 * Verifies rendering, API call on click, and disabled state after rating.
 */

import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { FeedbackButtons } from "../_components/FeedbackButtons";

// ─── Mock fetch ─────────────────────────────────────────────────

const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ success: true }),
});

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ─── Default props ──────────────────────────────────────────────

const defaultProps = {
  originalContent: "Test content with #Mzansi hashtag",
  aiModel: "puter-ai",
  aiPrompt: "Write a post about Joburg",
  platform: "instagram",
  contentType: "text" as const,
};

// ─── Tests ──────────────────────────────────────────────────────

describe("FeedbackButtons", () => {
  it("renders thumbs up and thumbs down buttons", () => {
    render(<FeedbackButtons {...defaultProps} />);

    expect(screen.getByLabelText("Thumbs up")).toBeInTheDocument();
    expect(screen.getByLabelText("Thumbs down")).toBeInTheDocument();
    expect(screen.getByText("Rate this:")).toBeInTheDocument();
  });

  it("calls POST /api/ai/feedback on thumbs up click", async () => {
    const user = userEvent.setup();
    render(<FeedbackButtons {...defaultProps} />);

    await user.click(screen.getByLabelText("Thumbs up"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"thumbs_up"'),
      });
    });
  });

  it("calls POST /api/ai/feedback on thumbs down click", async () => {
    const user = userEvent.setup();
    render(<FeedbackButtons {...defaultProps} />);

    await user.click(screen.getByLabelText("Thumbs down"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"thumbs_down"'),
      });
    });
  });

  it("shows thanks message and disables after rating", async () => {
    const user = userEvent.setup();
    render(<FeedbackButtons {...defaultProps} />);

    await user.click(screen.getByLabelText("Thumbs up"));

    await waitFor(() => {
      expect(screen.getByTestId("feedback-thanks")).toBeInTheDocument();
      expect(screen.getByText(/Thanks for your feedback/)).toBeInTheDocument();
    });

    // Buttons should be gone
    expect(screen.queryByLabelText("Thumbs up")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Thumbs down")).not.toBeInTheDocument();
  });
});
