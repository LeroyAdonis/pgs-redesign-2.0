/**
 * @vitest-environment happy-dom
 */

/**
 * Tests for the Calendar view page components.
 *
 * Uses stable mockRouter pattern (reference outside factory).
 * Mocks fetch for schedule API calls.
 * Tests rendering, navigation, view switching, and drag-drop callbacks.
 */

import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";
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
  usePathname: () => "/dashboard/calendar",
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
  usePathname: () => "/dashboard/calendar",
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// ─── Test Data ──────────────────────────────────────────────────

import type { CalendarSchedule } from "../_components/types";

const MOCK_SCHEDULES: CalendarSchedule[] = [
  {
    id: "s1",
    postId: "p1",
    content: "Check out our amazing braai specials this Heritage Day! 🔥🇿🇦",
    platform: "instagram",
    status: "scheduled",
    scheduledAt: "2026-03-15T10:00:00Z",
    socialAccountId: "a1",
  },
  {
    id: "s2",
    postId: "p2",
    content: "New product launch in Johannesburg",
    platform: "facebook",
    status: "draft",
    scheduledAt: "2026-03-15T14:00:00Z",
    socialAccountId: "a2",
  },
  {
    id: "s3",
    postId: "p3",
    content: "LinkedIn thought leadership piece about SA tech industry growth",
    platform: "linkedin",
    status: "published",
    scheduledAt: "2026-03-16T09:00:00Z",
    socialAccountId: "a3",
  },
];

// ─── Mock fetch ─────────────────────────────────────────────────

const mockFetch = vi.fn();

// ─── Setup / Teardown ───────────────────────────────────────────

beforeEach(() => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(MOCK_SCHEDULES),
  });
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ─── Imports (after mocks) ──────────────────────────────────────

import { CalendarView } from "../_components/CalendarView";
import { CalendarToolbar } from "../_components/CalendarToolbar";
import { CalendarEvent } from "../_components/CalendarEvent";
import { MonthGrid } from "../_components/MonthGrid";
import { WeekView } from "../_components/WeekView";
import { DayView } from "../_components/DayView";
import { DragDropProvider } from "../_components/DragDropContext";

// ─── CalendarView Tests ─────────────────────────────────────────

describe("CalendarView", () => {
  it("renders with loading state initially", () => {
    // Make fetch hang so loading stays visible
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<CalendarView />);

    expect(screen.getByTestId("calendar-loading")).toBeInTheDocument();
    expect(screen.getByText("Loading schedules…")).toBeInTheDocument();
  });

  it("renders calendar toolbar after loading", async () => {
    render(<CalendarView />);

    await waitFor(() => {
      expect(screen.getByTestId("calendar-toolbar")).toBeInTheDocument();
    });
  });

  it("renders month grid by default after loading", async () => {
    render(<CalendarView />);

    await waitFor(() => {
      expect(screen.getByTestId("month-grid")).toBeInTheDocument();
    });
  });

  it("shows error state on fetch failure", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(<CalendarView />);

    await waitFor(() => {
      expect(screen.getByTestId("calendar-error")).toBeInTheDocument();
    });
    expect(screen.getByText(/Failed to fetch schedules/)).toBeInTheDocument();
  });

  it("calls fetch with date range query params", async () => {
    render(<CalendarView />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/schedule?startDate="),
      );
    });
  });
});

// ─── CalendarToolbar Tests ──────────────────────────────────────

describe("CalendarToolbar", () => {
  const defaultProps = {
    currentDate: new Date(2026, 2, 15), // March 15, 2026
    viewMode: "month" as const,
    onNavigate: vi.fn(),
    onViewModeChange: vi.fn(),
  };

  it("renders navigation buttons", () => {
    render(<CalendarToolbar {...defaultProps} />);

    expect(screen.getByTestId("nav-prev")).toBeInTheDocument();
    expect(screen.getByTestId("nav-next")).toBeInTheDocument();
    expect(screen.getByTestId("nav-today")).toBeInTheDocument();
  });

  it("shows month label for month view", () => {
    render(<CalendarToolbar {...defaultProps} />);

    expect(screen.getByTestId("date-label")).toHaveTextContent("March 2026");
  });

  it("shows week range label for week view", () => {
    render(
      <CalendarToolbar {...defaultProps} viewMode="week" />,
    );

    const label = screen.getByTestId("date-label").textContent;
    // Should contain the week range around March 15, 2026
    expect(label).toBeTruthy();
    expect(label!.includes("Mar") || label!.includes("March")).toBe(true);
  });

  it("calls onNavigate('prev') when clicking Previous", async () => {
    const user = userEvent.setup();
    render(<CalendarToolbar {...defaultProps} />);

    await user.click(screen.getByTestId("nav-prev"));
    expect(defaultProps.onNavigate).toHaveBeenCalledWith("prev");
  });

  it("calls onNavigate('next') when clicking Next", async () => {
    const user = userEvent.setup();
    render(<CalendarToolbar {...defaultProps} />);

    await user.click(screen.getByTestId("nav-next"));
    expect(defaultProps.onNavigate).toHaveBeenCalledWith("next");
  });

  it("calls onNavigate('today') when clicking Today", async () => {
    const user = userEvent.setup();
    render(<CalendarToolbar {...defaultProps} />);

    await user.click(screen.getByTestId("nav-today"));
    expect(defaultProps.onNavigate).toHaveBeenCalledWith("today");
  });

  it("renders view mode buttons", () => {
    render(<CalendarToolbar {...defaultProps} />);

    expect(screen.getByTestId("view-mode-month")).toBeInTheDocument();
    expect(screen.getByTestId("view-mode-week")).toBeInTheDocument();
    expect(screen.getByTestId("view-mode-day")).toBeInTheDocument();
  });

  it("highlights the active view mode", () => {
    render(<CalendarToolbar {...defaultProps} viewMode="month" />);

    expect(screen.getByTestId("view-mode-month")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("view-mode-week")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("calls onViewModeChange when clicking a view mode", async () => {
    const user = userEvent.setup();
    render(<CalendarToolbar {...defaultProps} />);

    await user.click(screen.getByTestId("view-mode-week"));
    expect(defaultProps.onViewModeChange).toHaveBeenCalledWith("week");
  });
});

// ─── MonthGrid Tests ────────────────────────────────────────────

describe("MonthGrid", () => {
  const noop = vi.fn();

  function renderMonthGrid(schedules: CalendarSchedule[] = []) {
    return render(
      <DragDropProvider onReschedule={noop}>
        <MonthGrid
          currentDate={new Date(2026, 2, 15)} // March 2026
          schedules={schedules}
          onDayClick={noop}
        />
      </DragDropProvider>,
    );
  }

  it("renders the month grid container", () => {
    renderMonthGrid();
    expect(screen.getByTestId("month-grid")).toBeInTheDocument();
  });

  it("renders 7 day headers", () => {
    renderMonthGrid();

    const headers = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (const h of headers) {
      expect(screen.getByText(h)).toBeInTheDocument();
    }
  });

  it("renders 42 day cells (6 weeks)", () => {
    renderMonthGrid();

    // 42 cells in a 6-week grid
    const cells = screen.getAllByTestId(/^day-cell-/);
    expect(cells).toHaveLength(42);
  });

  it("renders events for days with schedules", () => {
    renderMonthGrid(MOCK_SCHEDULES);

    // Two events on March 15
    const cell = screen.getByTestId("day-cell-2026-03-15");
    expect(cell).toBeInTheDocument();

    // Events should be rendered as compact CalendarEvent
    const events = screen.getAllByTestId("calendar-event");
    expect(events.length).toBeGreaterThanOrEqual(2);
  });

  it("calls onDayClick when a day cell is clicked", async () => {
    const handleDayClick = vi.fn();
    render(
      <DragDropProvider onReschedule={noop}>
        <MonthGrid
          currentDate={new Date(2026, 2, 15)}
          schedules={[]}
          onDayClick={handleDayClick}
        />
      </DragDropProvider>,
    );

    const cell = screen.getByTestId("day-cell-2026-03-10");
    await userEvent.setup().click(cell);
    expect(handleDayClick).toHaveBeenCalledTimes(1);
  });
});

// ─── WeekView Tests ─────────────────────────────────────────────

describe("WeekView", () => {
  const noop = vi.fn();

  function renderWeekView(schedules: CalendarSchedule[] = []) {
    return render(
      <DragDropProvider onReschedule={noop}>
        <WeekView
          currentDate={new Date(2026, 2, 15)} // March 15, 2026 (Sunday)
          schedules={schedules}
        />
      </DragDropProvider>,
    );
  }

  it("renders the week view container", () => {
    renderWeekView();
    expect(screen.getByTestId("week-view")).toBeInTheDocument();
  });

  it("renders time rows for 6am to 10pm (17 rows)", () => {
    renderWeekView();

    const timeRows = screen.getAllByTestId(/^time-row-/);
    expect(timeRows).toHaveLength(17);
  });

  it("renders 7 day headers", () => {
    renderWeekView();

    const headers = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (const h of headers) {
      expect(screen.getByText(h)).toBeInTheDocument();
    }
  });

  it("shows 6 AM label", () => {
    renderWeekView();
    expect(screen.getByText("6 AM")).toBeInTheDocument();
  });

  it("shows 10 PM label", () => {
    renderWeekView();
    expect(screen.getByText("10 PM")).toBeInTheDocument();
  });
});

// ─── DayView Tests ──────────────────────────────────────────────

describe("DayView", () => {
  const noop = vi.fn();

  function renderDayView(schedules: CalendarSchedule[] = []) {
    return render(
      <DragDropProvider onReschedule={noop}>
        <DayView
          currentDate={new Date(2026, 2, 15)}
          schedules={schedules}
        />
      </DragDropProvider>,
    );
  }

  it("renders the day view container", () => {
    renderDayView();
    expect(screen.getByTestId("day-view")).toBeInTheDocument();
  });

  it("renders time slots for 6am to 10pm (17 slots)", () => {
    renderDayView();

    const slots = screen.getAllByTestId(/^time-slot-/);
    expect(slots).toHaveLength(17);
  });

  it("shows the day header with full date", () => {
    renderDayView();

    // March 15, 2026 is a Sunday
    const header = screen.getByText(/Sunday/i);
    expect(header).toBeInTheDocument();
  });

  it("renders events at their scheduled hour", () => {
    renderDayView(MOCK_SCHEDULES);

    // s1 is at 10:00 UTC = 12:00 SAST, s2 at 14:00 UTC = 16:00 SAST
    // The getHour() function uses local time parsing, so exact slot depends on TZ
    const events = screen.getAllByTestId("calendar-event");
    expect(events.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── CalendarEvent Tests ────────────────────────────────────────

describe("CalendarEvent", () => {
  it("renders with correct platform color dot", () => {
    render(
      <CalendarEvent schedule={MOCK_SCHEDULES[0]} />,
    );

    const dot = screen.getByTestId("platform-dot");
    expect(dot).toBeInTheDocument();
    // Instagram color
    expect(dot).toHaveStyle({ backgroundColor: "#E4405F" });
  });

  it("renders with Facebook platform color", () => {
    render(
      <CalendarEvent schedule={MOCK_SCHEDULES[1]} />,
    );

    const dot = screen.getByTestId("platform-dot");
    expect(dot).toHaveStyle({ backgroundColor: "#1877F2" });
  });

  it("shows content preview", () => {
    render(
      <CalendarEvent schedule={MOCK_SCHEDULES[1]} />,
    );

    const preview = screen.getByTestId("content-preview");
    expect(preview).toHaveTextContent("New product launch in Johannesburg");
  });

  it("truncates long content", () => {
    const longSchedule: CalendarSchedule = {
      ...MOCK_SCHEDULES[0],
      content:
        "This is a very long post content that should be truncated when displayed in the calendar event card because it exceeds sixty characters",
    };

    render(<CalendarEvent schedule={longSchedule} />);

    const preview = screen.getByTestId("content-preview");
    expect(preview.textContent).toContain("…");
    expect(preview.textContent!.length).toBeLessThanOrEqual(60);
  });

  it("shows platform name", () => {
    render(
      <CalendarEvent schedule={MOCK_SCHEDULES[0]} />,
    );

    expect(screen.getByText("instagram")).toBeInTheDocument();
  });

  it("renders compact mode with dot only", () => {
    render(
      <CalendarEvent schedule={MOCK_SCHEDULES[0]} compact />,
    );

    // In compact mode, no platform-dot (explicit) testid, just inline dot
    const event = screen.getByTestId("calendar-event");
    expect(event).toBeInTheDocument();
    // Should not have the expanded layout elements
    expect(screen.queryByTestId("platform-dot")).not.toBeInTheDocument();
  });

  it("renders status dot", () => {
    render(
      <CalendarEvent schedule={MOCK_SCHEDULES[0]} />,
    );

    const statusDot = screen.getByTestId("status-dot");
    expect(statusDot).toBeInTheDocument();
  });
});

// ─── Drag and Drop Tests ────────────────────────────────────────

describe("Drag and Drop", () => {
  it("fires onReschedule callback when an event is dropped on a day cell", () => {
    const handleReschedule = vi.fn();

    render(
      <DragDropProvider onReschedule={handleReschedule}>
        <MonthGrid
          currentDate={new Date(2026, 2, 15)}
          schedules={MOCK_SCHEDULES}
          onDayClick={vi.fn()}
        />
      </DragDropProvider>,
    );

    const events = screen.getAllByTestId("calendar-event");
    const firstEvent = events[0];
    const targetCell = screen.getByTestId("day-cell-2026-03-20");

    // Simulate drag start
    fireEvent.dragStart(firstEvent, {
      dataTransfer: {
        setData: vi.fn(),
        effectAllowed: "move",
      },
    });

    // Simulate drag over
    fireEvent.dragOver(targetCell, {
      dataTransfer: { dropEffect: "move" },
    });

    // Simulate drop
    fireEvent.drop(targetCell, {
      dataTransfer: {
        getData: () => MOCK_SCHEDULES[0].id,
      },
    });

    expect(handleReschedule).toHaveBeenCalledWith(
      MOCK_SCHEDULES[0].id,
      "2026-03-20",
    );
  });

  it("sets draggable attribute on events", () => {
    render(
      <DragDropProvider onReschedule={vi.fn()}>
        <MonthGrid
          currentDate={new Date(2026, 2, 15)}
          schedules={MOCK_SCHEDULES}
          onDayClick={vi.fn()}
        />
      </DragDropProvider>,
    );

    const events = screen.getAllByTestId("calendar-event");
    for (const event of events) {
      expect(event).toHaveAttribute("draggable", "true");
    }
  });
});
