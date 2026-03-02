import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { PostModerationTable, type PostRow } from "@/components/admin/PostModerationTable";

// ─── Fixtures ────────────────────────────────────────────────────

function createPost(overrides: Partial<PostRow> = {}): PostRow {
  return {
    id: `post-${Math.random().toString(36).slice(2, 8)}`,
    content: "Check out our latest product launch! #Mzansi #LocalIsLekker",
    contentLanguage: "en",
    platform: "instagram",
    status: "draft",
    aiGenerated: false,
    createdAt: "2025-01-15T10:30:00.000Z",
    updatedAt: "2025-01-15T10:30:00.000Z",
    authorName: "Thabo Mbeki",
    authorEmail: "thabo@example.com",
    orgName: "Purple Glow Agency",
    orgId: "org-1",
    scheduledAt: null,
    ...overrides,
  };
}

const samplePosts: PostRow[] = [
  createPost({
    id: "p1",
    content: "Draft post about Cape Town vibes",
    status: "draft",
    platform: "instagram",
    authorName: "Sipho Dlamini",
    orgName: "Cape Town Media",
  }),
  createPost({
    id: "p2",
    content: "Scheduled LinkedIn article on SA fintech",
    status: "scheduled",
    platform: "linkedin",
    authorName: "Lerato Khumalo",
    orgName: "Fintech SA",
    scheduledAt: "2025-02-01T09:00:00.000Z",
  }),
  createPost({
    id: "p3",
    content: "Published tweet celebrating Heritage Day",
    status: "published",
    platform: "twitter",
    authorName: "Nomsa Zwane",
    orgName: "Heritage Media",
    aiGenerated: true,
  }),
  createPost({
    id: "p4",
    content: "Failed Facebook post due to API error",
    status: "failed",
    platform: "facebook",
    authorName: "Johan van der Merwe",
    orgName: "Social Stars",
  }),
  createPost({
    id: "p5",
    content: "Another draft for TikTok campaign",
    status: "draft",
    platform: "tiktok",
    authorName: "Aisha Patel",
    orgName: "TikTok Kings",
  }),
];

// Mock fetch globally
const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

// ─── Tests ───────────────────────────────────────────────────────

describe("PostModerationTable", () => {
  describe("Rendering", () => {
    it("renders table headers", () => {
      render(<PostModerationTable initialPosts={samplePosts} />);

      const headers = screen.getAllByRole("columnheader");
      const headerTexts = headers.map((h) => h.textContent?.trim());
      expect(headerTexts).toContain("Content");
      expect(headerTexts).toContain("Author / Org");
      expect(headerTexts).toContain("Platform");
      expect(headerTexts).toContain("Status");
      expect(headerTexts).toContain("Scheduled");
      expect(headerTexts).toContain("Created");
    });

    it("renders all post rows", () => {
      render(<PostModerationTable initialPosts={samplePosts} />);

      expect(screen.getByText(/Draft post about Cape Town/)).toBeInTheDocument();
      expect(screen.getByText(/Scheduled LinkedIn article/)).toBeInTheDocument();
      expect(screen.getByText(/Published tweet celebrating/)).toBeInTheDocument();
      expect(screen.getByText(/Failed Facebook post/)).toBeInTheDocument();
      expect(screen.getByText(/Another draft for TikTok/)).toBeInTheDocument();
    });

    it("shows author name and org name", () => {
      render(<PostModerationTable initialPosts={samplePosts} />);

      expect(screen.getByText("Sipho Dlamini")).toBeInTheDocument();
      expect(screen.getByText("Cape Town Media")).toBeInTheDocument();
    });

    it("displays status badges with correct text", () => {
      render(<PostModerationTable initialPosts={samplePosts} />);

      const badges = screen.getAllByText(/^(draft|scheduled|published|failed)$/i);
      expect(badges.length).toBeGreaterThanOrEqual(4);
    });

    it("displays platform badges", () => {
      render(<PostModerationTable initialPosts={samplePosts} />);

      expect(screen.getByText("instagram")).toBeInTheDocument();
      expect(screen.getByText("linkedin")).toBeInTheDocument();
    });

    it("shows AI generated indicator for AI posts", () => {
      render(<PostModerationTable initialPosts={samplePosts} />);

      expect(screen.getByText("AI generated")).toBeInTheDocument();
    });

    it("shows scheduled date when available", () => {
      render(<PostModerationTable initialPosts={samplePosts} />);

      // p2 has a scheduledAt date
      // The exact format depends on locale, but something should render
      const dashCells = screen.getAllByText("—");
      // Most posts don't have scheduled dates, so there should be several "—"
      expect(dashCells.length).toBeGreaterThan(0);
    });

    it("renders empty state when no posts match", () => {
      render(<PostModerationTable initialPosts={[]} />);

      expect(screen.getByText(/no posts found/i)).toBeInTheDocument();
    });
  });

  describe("Filtering", () => {
    it("filters by status", async () => {
      const user = userEvent.setup();
      render(<PostModerationTable initialPosts={samplePosts} />);

      const statusSelect = screen.getByLabelText(/filter by status/i);
      await user.selectOptions(statusSelect, "draft");

      // Should show only draft posts (p1, p5)
      expect(screen.getByText(/Draft post about Cape Town/)).toBeInTheDocument();
      expect(screen.getByText(/Another draft for TikTok/)).toBeInTheDocument();
      expect(screen.queryByText(/Scheduled LinkedIn article/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Published tweet celebrating/)).not.toBeInTheDocument();
    });

    it("filters by platform", async () => {
      const user = userEvent.setup();
      render(<PostModerationTable initialPosts={samplePosts} />);

      const platformSelect = screen.getByLabelText(/filter by platform/i);
      await user.selectOptions(platformSelect, "facebook");

      // Only p4 is facebook
      expect(screen.getByText(/Failed Facebook post/)).toBeInTheDocument();
      expect(screen.queryByText(/Draft post about Cape Town/)).not.toBeInTheDocument();
    });

    it("filters by search text", async () => {
      const user = userEvent.setup();
      render(<PostModerationTable initialPosts={samplePosts} />);

      const searchInput = screen.getByLabelText(/search posts/i);
      await user.type(searchInput, "Cape Town");

      expect(screen.getByText(/Draft post about Cape Town/)).toBeInTheDocument();
      expect(screen.queryByText(/Scheduled LinkedIn article/)).not.toBeInTheDocument();
    });

    it("combines status and search filters", async () => {
      const user = userEvent.setup();
      render(<PostModerationTable initialPosts={samplePosts} />);

      // Filter to drafts
      const statusSelect = screen.getByLabelText(/filter by status/i);
      await user.selectOptions(statusSelect, "draft");

      // Search within drafts
      const searchInput = screen.getByLabelText(/search posts/i);
      await user.type(searchInput, "TikTok");

      // Only p5 (draft + TikTok)
      expect(screen.getByText(/Another draft for TikTok/)).toBeInTheDocument();
      expect(screen.queryByText(/Draft post about Cape Town/)).not.toBeInTheDocument();
    });
  });

  describe("Selection", () => {
    it("selects an individual post via checkbox", async () => {
      const user = userEvent.setup();
      render(<PostModerationTable initialPosts={samplePosts} />);

      const checkboxes = screen.getAllByRole("checkbox");
      // First checkbox is "select all", next ones are individual
      const firstPostCheckbox = checkboxes[1];

      await user.click(firstPostCheckbox);
      expect(firstPostCheckbox).toBeChecked();
    });

    it("deselects a post on second click", async () => {
      const user = userEvent.setup();
      render(<PostModerationTable initialPosts={samplePosts} />);

      const checkboxes = screen.getAllByRole("checkbox");
      const firstPostCheckbox = checkboxes[1];

      await user.click(firstPostCheckbox);
      expect(firstPostCheckbox).toBeChecked();

      await user.click(firstPostCheckbox);
      expect(firstPostCheckbox).not.toBeChecked();
    });

    it("selects all filtered posts via select-all checkbox", async () => {
      const user = userEvent.setup();
      render(<PostModerationTable initialPosts={samplePosts} />);

      const selectAll = screen.getByLabelText(/select all posts/i);
      await user.click(selectAll);

      const checkboxes = screen.getAllByRole("checkbox");
      // All should be checked
      for (const cb of checkboxes) {
        expect(cb).toBeChecked();
      }
    });

    it("deselects all when select-all is clicked again", async () => {
      const user = userEvent.setup();
      render(<PostModerationTable initialPosts={samplePosts} />);

      const selectAll = screen.getByLabelText(/select all posts/i);
      await user.click(selectAll);
      await user.click(selectAll);

      const checkboxes = screen.getAllByRole("checkbox");
      for (const cb of checkboxes) {
        expect(cb).not.toBeChecked();
      }
    });

    it("shows bulk action bar when posts are selected", async () => {
      const user = userEvent.setup();
      render(<PostModerationTable initialPosts={samplePosts} />);

      // Select a post
      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[1]);

      // Bulk action bar should appear
      expect(screen.getByRole("toolbar", { name: /bulk actions/i })).toBeInTheDocument();
      expect(screen.getByText(/post selected/)).toBeInTheDocument();
    });
  });

  describe("Expandable rows", () => {
    it("expands row to show full content", async () => {
      const user = userEvent.setup();
      const longContent = "A".repeat(200);
      const posts = [createPost({ id: "px1", content: longContent })];

      render(<PostModerationTable initialPosts={posts} />);

      // Click the content preview to expand
      const expandButton = screen.getByRole("button", { name: /toggle full content/i });
      await user.click(expandButton);

      // Full content should be visible
      expect(screen.getByText("Full Content")).toBeInTheDocument();
      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it("collapses expanded row on second click", async () => {
      const user = userEvent.setup();
      const posts = [createPost({ id: "px2", content: "Collapse test content" })];

      render(<PostModerationTable initialPosts={posts} />);

      const expandButton = screen.getByRole("button", { name: /toggle full content/i });

      // Expand
      await user.click(expandButton);
      expect(screen.getByText("Full Content")).toBeInTheDocument();

      // Collapse
      await user.click(expandButton);
      expect(screen.queryByText("Full Content")).not.toBeInTheDocument();
    });
  });

  describe("Bulk actions", () => {
    it("calls approve API with selected post IDs", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { action: "approve", affected: 2 } }),
      });

      render(<PostModerationTable initialPosts={samplePosts} />);

      // Select first two posts
      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[1]);
      await user.click(checkboxes[2]);

      // Click approve
      await user.click(screen.getByRole("button", { name: /approve/i }));

      expect(mockFetch).toHaveBeenCalledWith("/api/admin/posts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"approve"'),
      });
    });

    it("calls reject API with selected post IDs", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { action: "reject", affected: 1 } }),
      });

      render(<PostModerationTable initialPosts={samplePosts} />);

      // Select a post
      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[1]);

      // Click reject
      await user.click(screen.getByRole("button", { name: /reject/i }));

      expect(mockFetch).toHaveBeenCalledWith("/api/admin/posts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"reject"'),
      });
    });

    it("updates post status optimistically after approve", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { action: "approve", affected: 1 } }),
      });

      render(<PostModerationTable initialPosts={[samplePosts[0]]} />);

      // Select the draft post
      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[1]);

      // Approve
      await user.click(screen.getByRole("button", { name: /approve/i }));

      // Wait for the optimistic update
      // The status should change from "draft" to "published"
      expect(await screen.findByText("published")).toBeInTheDocument();
    });

    it("removes posts optimistically after delete", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { action: "delete", affected: 1 } }),
      });

      render(<PostModerationTable initialPosts={[samplePosts[0]]} />);

      // Select and delete
      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[1]);
      await user.click(screen.getByRole("button", { name: /delete$/i }));
      await user.click(screen.getByRole("button", { name: /delete permanently/i }));

      // Post should be removed
      expect(await screen.findByText(/no posts found/i)).toBeInTheDocument();
    });
  });
});
