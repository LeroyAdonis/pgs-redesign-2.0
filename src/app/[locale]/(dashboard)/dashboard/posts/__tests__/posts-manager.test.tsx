/**
 * @vitest-environment happy-dom
 */

/**
 * Tests for the Posts management page components.
 *
 * Covers PostsManager, PostFilters, PostCard, BulkActions,
 * BulkGenerator, AutonomousToggle, and ScheduleModal.
 *
 * Uses stable mockRouter pattern (reference outside factory)
 * to prevent infinite re-render loops in React 19.
 */

import { render, screen, cleanup, waitFor, within } from "@testing-library/react";
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
  usePathname: () => "/dashboard/posts",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => mockRouter,
  usePathname: () => "/dashboard/posts",
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock logger to avoid console output in tests
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ─── Test data ──────────────────────────────────────────────────

const MOCK_POST = {
  id: "post-1",
  content:
    "Eish, what a lekker day! Check out our new product launch in Joburg! #Mzansi #LocalIsLekker",
  platform: "instagram",
  status: "draft",
  aiGenerated: true,
  createdAt: "2025-01-15T10:00:00Z",
  schedules: [],
};

const MOCK_SCHEDULED_POST = {
  id: "post-2",
  content: "Big news from Cape Town! Join us for our launch event tomorrow 🎉",
  platform: "facebook",
  status: "scheduled",
  aiGenerated: false,
  createdAt: "2025-01-14T08:00:00Z",
  schedules: [
    {
      id: "sched-1",
      scheduledAt: "2025-01-20T14:00:00Z",
      publishedAt: null,
      failedAt: null,
      socialAccountId: "acc-1",
    },
  ],
};

const MOCK_POSTS_RESPONSE = {
  posts: [MOCK_POST, MOCK_SCHEDULED_POST],
  totalPages: 1,
};

// ─── Mock fetch ─────────────────────────────────────────────────

const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve(MOCK_POSTS_RESPONSE),
});

// ─── Imports (after mocks) ──────────────────────────────────────

import { PostsManager } from "../_components/PostsManager";
import { PostFilters } from "../_components/PostFilters";
import { PostCard } from "../_components/PostCard";
import { BulkActions } from "../_components/BulkActions";
import { BulkGenerator } from "../_components/BulkGenerator";
import { AutonomousToggle } from "../_components/AutonomousToggle";
import { ScheduleModal } from "../_components/ScheduleModal";
import type { PostFiltersState } from "../_components/types";

// ─── Setup / Teardown ───────────────────────────────────────────

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(MOCK_POSTS_RESPONSE),
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ─── PostsManager ───────────────────────────────────────────────

describe("PostsManager", () => {
  it("renders with loading state initially", () => {
    // Make fetch hang so we can see loading
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<PostsManager />);

    expect(screen.getByTestId("loading-state")).toBeInTheDocument();
    expect(screen.getByText("Loading posts…")).toBeInTheDocument();
  });

  it("renders post cards after data loads", async () => {
    render(<PostsManager />);

    await waitFor(() => {
      expect(screen.getByTestId("post-card-post-1")).toBeInTheDocument();
      expect(screen.getByTestId("post-card-post-2")).toBeInTheDocument();
    });
  });

  it("renders page title and description", async () => {
    render(<PostsManager />);

    expect(screen.getByText("Posts")).toBeInTheDocument();
    expect(
      screen.getByText("Manage and schedule your social media posts"),
    ).toBeInTheDocument();
  });

  it("renders Generate Batch button", () => {
    render(<PostsManager />);

    expect(screen.getByText("Generate Batch")).toBeInTheDocument();
  });

  it("shows empty state when no posts returned", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ posts: [], totalPages: 0 }),
    });

    render(<PostsManager />);

    await waitFor(() => {
      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
      expect(screen.getByText("No posts found")).toBeInTheDocument();
    });
  });
});

// ─── PostFilters ────────────────────────────────────────────────

describe("PostFilters", () => {
  const defaultFilters: PostFiltersState = {
    platform: null,
    status: null,
    dateFrom: null,
    dateTo: null,
  };

  it("renders all filter dropdowns", () => {
    const onFilterChange = vi.fn();
    render(
      <PostFilters filters={defaultFilters} onFilterChange={onFilterChange} />,
    );

    expect(screen.getByLabelText("Platform")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    expect(screen.getByLabelText("From")).toBeInTheDocument();
    expect(screen.getByLabelText("To")).toBeInTheDocument();
  });

  it("calls onFilterChange when platform changes", async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    render(
      <PostFilters filters={defaultFilters} onFilterChange={onFilterChange} />,
    );

    await user.selectOptions(screen.getByLabelText("Platform"), "instagram");

    expect(onFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      platform: "instagram",
    });
  });

  it("calls onFilterChange when status changes", async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    render(
      <PostFilters filters={defaultFilters} onFilterChange={onFilterChange} />,
    );

    await user.selectOptions(screen.getByLabelText("Status"), "scheduled");

    expect(onFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      status: "scheduled",
    });
  });

  it("shows Clear filters button when filters are active", () => {
    const onFilterChange = vi.fn();
    render(
      <PostFilters
        filters={{ ...defaultFilters, platform: "instagram" }}
        onFilterChange={onFilterChange}
      />,
    );

    expect(screen.getByText("Clear filters")).toBeInTheDocument();
  });

  it("does not show Clear filters when no filters active", () => {
    const onFilterChange = vi.fn();
    render(
      <PostFilters filters={defaultFilters} onFilterChange={onFilterChange} />,
    );

    expect(screen.queryByText("Clear filters")).not.toBeInTheDocument();
  });
});

// ─── PostCard ───────────────────────────────────────────────────

describe("PostCard", () => {
  const defaultProps = {
    post: MOCK_POST,
    isSelected: false,
    onSelect: vi.fn(),
    onEdit: vi.fn(),
    onSchedule: vi.fn(),
    onDelete: vi.fn(),
  };

  it("renders content preview", () => {
    render(<PostCard {...defaultProps} />);

    expect(screen.getByText(/lekker day/)).toBeInTheDocument();
  });

  it("renders platform badge", () => {
    render(<PostCard {...defaultProps} />);

    expect(screen.getByText("Instagram")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<PostCard {...defaultProps} />);

    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("renders AI badge for ai-generated posts", () => {
    render(<PostCard {...defaultProps} />);

    expect(screen.getByText("AI")).toBeInTheDocument();
  });

  it("renders checkbox for selection", () => {
    render(<PostCard {...defaultProps} />);

    const checkbox = screen.getByRole("checkbox", {
      name: /select post/i,
    });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it("calls onSelect when checkbox toggled", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PostCard {...defaultProps} onSelect={onSelect} />);

    const checkbox = screen.getByRole("checkbox", { name: /select post/i });
    await user.click(checkbox);

    expect(onSelect).toHaveBeenCalledWith("post-1", true);
  });

  it("renders scheduled date when post has schedule", () => {
    render(
      <PostCard
        {...defaultProps}
        post={MOCK_SCHEDULED_POST}
      />,
    );

    // Use getAllByText since "Scheduled" appears in both the status badge and the date
    const scheduledElements = screen.getAllByText(/Scheduled/);
    expect(scheduledElements.length).toBeGreaterThanOrEqual(2);
    // Verify the schedule date is shown
    expect(screen.getByText(/20 Jan/)).toBeInTheDocument();
  });

  it("shows selected state when isSelected is true", () => {
    render(<PostCard {...defaultProps} isSelected />);

    const checkbox = screen.getByRole("checkbox", { name: /select post/i });
    expect(checkbox).toBeChecked();
  });

  it("truncates content longer than 140 chars", () => {
    const longPost = {
      ...MOCK_POST,
      content: "A".repeat(200),
    };
    render(<PostCard {...defaultProps} post={longPost} />);

    const preview = screen.getByText(/A+…/);
    expect(preview.textContent!.length).toBeLessThanOrEqual(141); // 140 + ellipsis
  });
});

// ─── BulkActions ────────────────────────────────────────────────

describe("BulkActions", () => {
  const defaultProps = {
    selectedIds: ["post-1", "post-2"],
    onApprove: vi.fn(),
    onReschedule: vi.fn(),
    onDelete: vi.fn(),
    onClearSelection: vi.fn(),
  };

  it("appears when posts are selected", () => {
    render(<BulkActions {...defaultProps} />);

    expect(screen.getByTestId("bulk-actions")).toBeInTheDocument();
    expect(screen.getByText("2 posts selected")).toBeInTheDocument();
  });

  it("does not render when no posts selected", () => {
    render(<BulkActions {...defaultProps} selectedIds={[]} />);

    expect(screen.queryByTestId("bulk-actions")).not.toBeInTheDocument();
  });

  it("shows singular text for one post", () => {
    render(<BulkActions {...defaultProps} selectedIds={["post-1"]} />);

    expect(screen.getByText("1 post selected")).toBeInTheDocument();
  });

  it("calls onApprove when Approve All clicked", async () => {
    const user = userEvent.setup();
    render(<BulkActions {...defaultProps} />);

    await user.click(screen.getByText("Approve All"));

    expect(defaultProps.onApprove).toHaveBeenCalledWith(["post-1", "post-2"]);
  });

  it("calls onReschedule when Reschedule clicked", async () => {
    const user = userEvent.setup();
    render(<BulkActions {...defaultProps} />);

    await user.click(screen.getByText("Reschedule"));

    expect(defaultProps.onReschedule).toHaveBeenCalledWith([
      "post-1",
      "post-2",
    ]);
  });

  it("shows confirmation before delete", async () => {
    const user = userEvent.setup();
    render(<BulkActions {...defaultProps} />);

    await user.click(screen.getByText("Delete"));

    // Should show confirmation, not delete immediately
    expect(defaultProps.onDelete).not.toHaveBeenCalled();
    expect(screen.getByText("Confirm?")).toBeInTheDocument();
    expect(screen.getByText("Yes, Delete")).toBeInTheDocument();
  });

  it("deletes on confirmation", async () => {
    const user = userEvent.setup();
    render(<BulkActions {...defaultProps} />);

    await user.click(screen.getByText("Delete"));
    await user.click(screen.getByText("Yes, Delete"));

    expect(defaultProps.onDelete).toHaveBeenCalledWith(["post-1", "post-2"]);
  });
});

// ─── BulkGenerator ──────────────────────────────────────────────

describe("BulkGenerator", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onComplete: vi.fn(),
  };

  it("renders when open", () => {
    render(<BulkGenerator {...defaultProps} />);

    expect(screen.getByTestId("bulk-generator")).toBeInTheDocument();
    expect(screen.getByText("Generate Batch Content")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<BulkGenerator {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId("bulk-generator")).not.toBeInTheDocument();
  });

  it("shows step 1 (Configuration) by default", () => {
    render(<BulkGenerator {...defaultProps} />);

    expect(screen.getByTestId("step-1")).toBeInTheDocument();
    expect(screen.getByText("Configure")).toBeInTheDocument();
  });

  it("shows post count slider", () => {
    render(<BulkGenerator {...defaultProps} />);

    expect(screen.getByLabelText(/Number of posts/)).toBeInTheDocument();
  });

  it("shows platform selection buttons", () => {
    render(<BulkGenerator {...defaultProps} />);

    expect(screen.getByText("Instagram")).toBeInTheDocument();
    expect(screen.getByText("Facebook")).toBeInTheDocument();
  });

  it("shows language selector with SA languages", () => {
    render(<BulkGenerator {...defaultProps} />);

    const select = screen.getByLabelText("Content Language");
    expect(select).toBeInTheDocument();

    // Check SA languages are present
    expect(within(select).getByText(/English/)).toBeInTheDocument();
    expect(within(select).getByText(/isiZulu/)).toBeInTheDocument();
  });

  it("shows SA cultural references checkbox", () => {
    render(<BulkGenerator {...defaultProps} />);

    expect(
      screen.getByLabelText("Include SA cultural references"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Include SA cultural references")).toBeChecked();
  });

  it("navigates to step 2 after generate", async () => {
    const user = userEvent.setup();
    render(<BulkGenerator {...defaultProps} />);

    // Fill in topic
    const topicInput = screen.getByLabelText("Topic / Theme");
    await user.type(topicInput, "Heritage Day");

    // Click generate
    await user.click(screen.getByText(/Generate \d+ Posts/));

    // Wait for the 1500ms mock generation delay + state update
    await waitFor(
      () => {
        expect(screen.getByTestId("step-2")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  }, 10000);

  it("navigates to step 3 from step 2", async () => {
    const user = userEvent.setup();
    render(<BulkGenerator {...defaultProps} />);

    // Go to step 2
    const topicInput = screen.getByLabelText("Topic / Theme");
    await user.type(topicInput, "Heritage Day");
    await user.click(screen.getByText(/Generate \d+ Posts/));

    await waitFor(
      () => {
        expect(screen.getByTestId("step-2")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Go to step 3
    await user.click(screen.getByText("Next: Schedule"));

    expect(screen.getByTestId("step-3")).toBeInTheDocument();
  }, 10000);
});

// ─── AutonomousToggle ───────────────────────────────────────────

describe("AutonomousToggle", () => {
  it("renders manual mode", () => {
    render(
      <AutonomousToggle
        currentMode="manual"
        onModeChange={vi.fn()}
        tier="grower"
      />,
    );

    expect(screen.getByText("Manual")).toBeInTheDocument();
    expect(
      screen.getByText("Review and approve each post before publishing"),
    ).toBeInTheDocument();
  });

  it("renders autonomous mode", () => {
    render(
      <AutonomousToggle
        currentMode="autonomous"
        onModeChange={vi.fn()}
        tier="grower"
      />,
    );

    expect(screen.getByText("Autonomous")).toBeInTheDocument();
    expect(
      screen.getByText("AI schedules and publishes automatically"),
    ).toBeInTheDocument();
  });

  it("shows tier restriction for seedling tier", () => {
    render(
      <AutonomousToggle
        currentMode="manual"
        onModeChange={vi.fn()}
        tier="seedling"
      />,
    );

    expect(screen.getByTestId("tier-restriction")).toBeInTheDocument();
    expect(
      screen.getByText("Upgrade to Grower for autonomous scheduling"),
    ).toBeInTheDocument();
  });

  it("shows tier restriction for hustler tier", () => {
    render(
      <AutonomousToggle
        currentMode="manual"
        onModeChange={vi.fn()}
        tier="hustler"
      />,
    );

    expect(screen.getByTestId("tier-restriction")).toBeInTheDocument();
  });

  it("allows toggle for grower tier", () => {
    render(
      <AutonomousToggle
        currentMode="manual"
        onModeChange={vi.fn()}
        tier="grower"
      />,
    );

    const toggle = screen.getByRole("switch");
    expect(toggle).not.toBeDisabled();
    expect(screen.queryByTestId("tier-restriction")).not.toBeInTheDocument();
  });

  it("calls onModeChange when toggled", async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    render(
      <AutonomousToggle
        currentMode="manual"
        onModeChange={onModeChange}
        tier="grower"
      />,
    );

    await user.click(screen.getByRole("switch"));

    expect(onModeChange).toHaveBeenCalledWith("autonomous");
  });

  it("disables toggle for restricted tiers", () => {
    render(
      <AutonomousToggle
        currentMode="manual"
        onModeChange={vi.fn()}
        tier="seedling"
      />,
    );

    expect(screen.getByRole("switch")).toBeDisabled();
  });
});

// ─── ScheduleModal ──────────────────────────────────────────────

describe("ScheduleModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSchedule: vi.fn(),
  };

  it("renders when open", () => {
    render(<ScheduleModal {...defaultProps} />);

    expect(screen.getByTestId("schedule-modal")).toBeInTheDocument();
    expect(screen.getByText("Schedule Post")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<ScheduleModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId("schedule-modal")).not.toBeInTheDocument();
  });

  it("renders date/time picker", () => {
    render(<ScheduleModal {...defaultProps} />);

    expect(screen.getByLabelText("Date & Time")).toBeInTheDocument();
  });

  it("shows Reschedule title when existingDate provided", () => {
    render(
      <ScheduleModal {...defaultProps} existingDate="2025-01-20T14:00" />,
    );

    expect(screen.getByText("Reschedule Post")).toBeInTheDocument();
  });

  it("shows optimal time button", () => {
    render(<ScheduleModal {...defaultProps} />);

    expect(screen.getByText(/Use optimal time/)).toBeInTheDocument();
  });

  it("disables Schedule button when no datetime selected", () => {
    render(<ScheduleModal {...defaultProps} />);

    const submitButton = screen.getByRole("button", { name: "Schedule" });
    expect(submitButton).toBeDisabled();
  });

  it("shows platform selection pills", () => {
    render(<ScheduleModal {...defaultProps} />);

    expect(screen.getByText("Instagram")).toBeInTheDocument();
    expect(screen.getByText("Facebook")).toBeInTheDocument();
  });
});
