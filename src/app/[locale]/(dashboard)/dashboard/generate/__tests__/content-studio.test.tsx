/**
 * @vitest-environment happy-dom
 */

/**
 * Tests for the ContentStudio component.
 *
 * Uses stable mockRouter pattern (reference outside factory).
 * Mocks fetch for /api/ai/generate calls instead of window.puter.
 * All tests verify observable outcomes of the content studio UI.
 */

import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// ─── Mocks (stable references OUTSIDE factory) ─────────────────

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/dashboard/generate",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// ─── Imports (after mocks) ──────────────────────────────────────

import { ContentStudio } from "../_components/ContentStudio";

// ─── Setup / Teardown ───────────────────────────────────────────

beforeEach(() => {
  // Mock fetch globally — respond to /api/ai/generate with generated text
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (typeof url === "string" && url.includes("/api/ai/generate")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              content:
                "Eish, what a lekker day! 🇿🇦 Check out our new product launch in Joburg! #Mzansi #LocalIsLekker #ProudlySA",
              model: "xiaomi/mimo-v2-pro",
            }),
        });
      }
      // Default: success for other endpoints (draft save, etc.)
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ─── Tests ──────────────────────────────────────────────────────

describe("ContentStudio", () => {
  describe("initial render", () => {
    it("renders without crashing", () => {
      render(<ContentStudio />);
      expect(screen.getByText("Content Studio")).toBeInTheDocument();
    });

    it("shows platform selector with Instagram pre-selected", () => {
      render(<ContentStudio />);

      expect(screen.getByText("Instagram")).toBeInTheDocument();
      expect(screen.getByText("Facebook")).toBeInTheDocument();

      const igButton = screen.getByText("Instagram").closest("button");
      expect(igButton).toHaveAttribute("aria-pressed", "true");
    });

    it("shows language selector defaulting to English", () => {
      render(<ContentStudio />);

      const select = screen.getByLabelText("Language");
      expect(select).toBeInTheDocument();
      expect(select).toHaveValue("en");
    });

    it("shows content type tabs with Text active", () => {
      render(<ContentStudio />);

      const textTab = screen.getByRole("tab", { name: /Text/i });
      expect(textTab).toHaveAttribute("aria-selected", "true");
    });

    it("shows prompt textarea", () => {
      render(<ContentStudio />);

      expect(
        screen.getByPlaceholderText(/Describe the content/i),
      ).toBeInTheDocument();
    });

    it("shows SA context checkbox checked by default", () => {
      render(<ContentStudio />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();
    });

    it("shows generate button disabled when prompt is empty", () => {
      render(<ContentStudio />);

      const button = screen.getByTestId("generate-button");
      expect(button).toBeDisabled();
    });

    it("shows idle state in preview area", () => {
      render(<ContentStudio />);

      expect(
        screen.getByText(/Your generated content will appear here/),
      ).toBeInTheDocument();
    });
  });

  describe("content type switching", () => {
    it("switches to Image tab", async () => {
      const user = userEvent.setup();
      render(<ContentStudio />);

      await user.click(screen.getByRole("tab", { name: /Image/i }));

      const imageTab = screen.getByRole("tab", { name: /Image/i });
      expect(imageTab).toHaveAttribute("aria-selected", "true");
    });

    it("switches to Video tab", async () => {
      const user = userEvent.setup();
      render(<ContentStudio />);

      await user.click(screen.getByRole("tab", { name: /Video/i }));

      const videoTab = screen.getByRole("tab", { name: /Video/i });
      expect(videoTab).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("text generation", () => {
    it("enables generate button when prompt has text", async () => {
      const user = userEvent.setup();
      render(<ContentStudio />);

      const textarea = screen.getByPlaceholderText(/Describe the content/i);
      await user.type(textarea, "Write a post about braai day");

      const button = screen.getByTestId("generate-button");
      expect(button).not.toBeDisabled();
    });

    it("shows loading state during generation", async () => {
      // Make fetch hang
      vi.stubGlobal(
        "fetch",
        vi.fn(() => new Promise(() => {})), // never resolves
      );

      const user = userEvent.setup();
      render(<ContentStudio />);

      const textarea = screen.getByPlaceholderText(/Describe the content/i);
      await user.type(textarea, "Write a post about braai day");
      await user.click(screen.getByTestId("generate-button"));

      expect(screen.getByTestId("generation-loading")).toBeInTheDocument();
      expect(screen.getByText(/Generating text content/)).toBeInTheDocument();
    });

    it("shows generated text content on success", async () => {
      const user = userEvent.setup();
      render(<ContentStudio />);

      const textarea = screen.getByPlaceholderText(/Describe the content/i);
      await user.type(textarea, "Write a post about braai day");
      await user.click(screen.getByTestId("generate-button"));

      await waitFor(() => {
        expect(screen.getByTestId("generation-text-result")).toBeInTheDocument();
      });

      expect(screen.getByText(/lekker/)).toBeInTheDocument();
    });

    it("shows feedback buttons after successful generation", async () => {
      const user = userEvent.setup();
      render(<ContentStudio />);

      const textarea = screen.getByPlaceholderText(/Describe the content/i);
      await user.type(textarea, "Write a post about braai day");
      await user.click(screen.getByTestId("generate-button"));

      await waitFor(() => {
        expect(screen.getByLabelText("Thumbs up")).toBeInTheDocument();
        expect(screen.getByLabelText("Thumbs down")).toBeInTheDocument();
      });
    });
  });

  describe("API error handling", () => {
    it("shows error message when API fails", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve({ error: "API rate limited" }),
        }),
      );

      const user = userEvent.setup();
      render(<ContentStudio />);

      const textarea = screen.getByPlaceholderText(/Describe the content/i);
      await user.type(textarea, "Write a post");
      await user.click(screen.getByTestId("generate-button"));

      await waitFor(() => {
        expect(screen.getByText(/API rate limited/)).toBeInTheDocument();
      });
    });
  });

  describe("character count", () => {
    it("shows character count updating as user types", async () => {
      const user = userEvent.setup();
      render(<ContentStudio />);

      expect(screen.getByText("0/1000")).toBeInTheDocument();

      const textarea = screen.getByPlaceholderText(/Describe the content/i);
      await user.type(textarea, "Hello");

      expect(screen.getByText("5/1000")).toBeInTheDocument();
    });
  });
});
