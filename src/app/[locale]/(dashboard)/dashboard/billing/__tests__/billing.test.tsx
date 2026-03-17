/**
 * Tests for the Billing page widgets: CreditBalance and TransactionHistory.
 *
 * Mocks next-intl, i18n navigation, and the credit service.
 * Uses @testing-library/react with vitest + happy-dom.
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

/* ─── Mocks ─── */

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => "/dashboard/billing",
}));

vi.mock("@/lib/auth-session", () => ({
  requireServerSession: vi.fn().mockResolvedValue({
    user: { id: "user_1", name: "Test User", email: "test@example.com" },
  }),
}));

vi.mock("@/lib/credits", () => ({
  getBalance: vi.fn(),
  getTransactionHistory: vi.fn(),
}));

/* ─── Imports (after mocks) ─── */

import { CreditBalance } from "@/components/dashboard/widgets/CreditBalance";
import { TransactionHistory } from "@/components/dashboard/widgets/TransactionHistory";
import type {
  CreditBalance as CreditBalanceType,
  TransactionHistoryItem,
} from "@/lib/credits";

/* ─── Fixtures ─── */

const healthyBalance: CreditBalanceType = {
  balance: 80,
  monthlyAllocation: 100,
  rolloverBalance: 20,
  rolloverExpiresAt: null,
  usagePercentage: 33.33,
  isLowBalance: false,
};

const lowBalance: CreditBalanceType = {
  balance: 5,
  monthlyAllocation: 100,
  rolloverBalance: 0,
  rolloverExpiresAt: null,
  usagePercentage: 95,
  isLowBalance: true,
};

const mockTransactions: TransactionHistoryItem[] = [
  {
    id: "tx_1",
    type: "allocation",
    amount: 100,
    runningBalance: 100,
    description: "Monthly allocation",
    postId: null,
    createdAt: new Date("2025-06-01T08:00:00Z"),
  },
  {
    id: "tx_2",
    type: "deduction",
    amount: -1,
    runningBalance: 99,
    description: "Credit deduction for post post_1",
    postId: "post_1",
    createdAt: new Date("2025-06-02T10:30:00Z"),
  },
  {
    id: "tx_3",
    type: "purchase",
    amount: 50,
    runningBalance: 149,
    description: "Credit pack purchase",
    postId: null,
    createdAt: new Date("2025-06-03T14:00:00Z"),
  },
  {
    id: "tx_4",
    type: "bonus",
    amount: 10,
    runningBalance: 159,
    description: "Referral bonus",
    postId: null,
    createdAt: new Date("2025-06-04T09:00:00Z"),
  },
];

/* ─── CreditBalance Widget ─── */

describe("CreditBalance", () => {
  it("renders the credit balance value", () => {
    render(<CreditBalance balance={healthyBalance} />);

    expect(screen.getByTestId("balance-value")).toHaveTextContent("80");
  });

  it("renders usage percentage", () => {
    render(<CreditBalance balance={healthyBalance} />);

    expect(screen.getByText("33.33%")).toBeInTheDocument();
  });

  it("renders monthly allocation and rollover", () => {
    render(<CreditBalance balance={healthyBalance} />);

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("shows 'Healthy' status when remaining > 50%", () => {
    render(<CreditBalance balance={healthyBalance} />);

    expect(screen.getByTestId("status-label")).toHaveTextContent("Healthy");
  });

  it("shows 'Low' status when remaining < 25%", () => {
    render(<CreditBalance balance={lowBalance} />);

    expect(screen.getByTestId("status-label")).toHaveTextContent("Low");
  });

  it("shows 'Getting low' status when remaining 25-50%", () => {
    const mediumBalance: CreditBalanceType = {
      ...healthyBalance,
      usagePercentage: 65,
      isLowBalance: false,
    };
    render(<CreditBalance balance={mediumBalance} />);

    expect(screen.getByTestId("status-label")).toHaveTextContent("Getting low");
  });

  it("does NOT show low-balance warning when balance is healthy", () => {
    render(<CreditBalance balance={healthyBalance} />);

    expect(screen.queryByTestId("low-balance-warning")).not.toBeInTheDocument();
  });

  it("shows low-balance warning when isLowBalance is true", () => {
    render(<CreditBalance balance={lowBalance} />);

    const warning = screen.getByTestId("low-balance-warning");
    expect(warning).toBeInTheDocument();
    expect(warning).toHaveAttribute("role", "alert");
    expect(warning).toHaveTextContent(/credit balance is running low/i);
  });

  it("renders a circular progress indicator (SVG)", () => {
    render(<CreditBalance balance={healthyBalance} />);

    const widget = screen.getByTestId("credit-balance-widget");
    const svgs = widget.querySelectorAll("svg");
    // At least 1 SVG for the circular progress
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });
});

/* ─── TransactionHistory Widget ─── */

describe("TransactionHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all transaction rows", () => {
    render(
      <TransactionHistory transactions={mockTransactions} orgId="org_1" />,
    );

    const rows = screen.getAllByTestId("transaction-row");
    // Desktop table rows + mobile card rows
    expect(rows.length).toBe(mockTransactions.length * 2);
  });

  it("renders type badges with correct labels", () => {
    render(
      <TransactionHistory transactions={mockTransactions} orgId="org_1" />,
    );

    expect(screen.getAllByText("Allocation").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Deduction").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Purchase").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Bonus").length).toBeGreaterThanOrEqual(1);
  });

  it("renders positive amounts with + prefix", () => {
    render(
      <TransactionHistory transactions={mockTransactions} orgId="org_1" />,
    );

    const amounts = screen.getAllByTestId("transaction-amount");
    // tx_1 (allocation +100) should appear with "+"
    const positiveAmounts = amounts.filter((el) =>
      el.textContent?.startsWith("+"),
    );
    expect(positiveAmounts.length).toBeGreaterThanOrEqual(1);
  });

  it("renders negative amounts without + prefix", () => {
    render(
      <TransactionHistory transactions={mockTransactions} orgId="org_1" />,
    );

    const amounts = screen.getAllByTestId("transaction-amount");
    const negativeAmounts = amounts.filter((el) =>
      el.textContent?.startsWith("-"),
    );
    expect(negativeAmounts.length).toBeGreaterThanOrEqual(1);
  });

  it("renders transaction descriptions", () => {
    render(
      <TransactionHistory transactions={mockTransactions} orgId="org_1" />,
    );

    expect(
      screen.getAllByText("Monthly allocation").length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText("Credit pack purchase").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state when no transactions exist", () => {
    render(<TransactionHistory transactions={[]} orgId="org_1" />);

    expect(screen.getByTestId("empty-state")).toHaveTextContent(
      /no transactions yet/i,
    );
  });

  it("renders load-more button when transactions fill a page", () => {
    // Create 10 transactions (PAGE_SIZE) to trigger hasMore
    const fullPage: TransactionHistoryItem[] = Array.from({ length: 10 }, (_, i) => ({
      id: `tx_${i}`,
      type: "deduction",
      amount: -1,
      runningBalance: 100 - i,
      description: `Transaction ${i}`,
      postId: null,
      createdAt: new Date(`2025-06-${String(i + 1).padStart(2, "0")}`),
    }));

    render(
      <TransactionHistory transactions={fullPage} orgId="org_1" />,
    );

    expect(screen.getByTestId("load-more-button")).toBeInTheDocument();
    expect(screen.getByTestId("load-more-button")).toHaveTextContent(
      "Load more",
    );
  });

  it("does NOT render load-more button when transactions are less than page size", () => {
    render(
      <TransactionHistory
        transactions={mockTransactions.slice(0, 3)}
        orgId="org_1"
      />,
    );

    expect(screen.queryByTestId("load-more-button")).not.toBeInTheDocument();
  });

  it("calls fetch with correct URL when load-more is clicked", async () => {
    const user = userEvent.setup();
    const fullPage: TransactionHistoryItem[] = Array.from({ length: 10 }, (_, i) => ({
      id: `tx_${i}`,
      type: "deduction",
      amount: -1,
      runningBalance: 100 - i,
      description: `Transaction ${i}`,
      postId: null,
      createdAt: new Date(`2025-06-${String(i + 1).padStart(2, "0")}`),
    }));

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    globalThis.fetch = fetchSpy;

    render(
      <TransactionHistory transactions={fullPage} orgId="org_test" />,
    );

    await user.click(screen.getByTestId("load-more-button"));

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/credits/transactions?orgId=org_test"),
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("offset=10"),
    );
  });

  it("has an accessible table with correct headers", () => {
    render(
      <TransactionHistory transactions={mockTransactions} orgId="org_1" />,
    );

    const table = screen.getByTestId("transaction-table");
    expect(table).toBeInTheDocument();

    const headers = within(table).getAllByRole("columnheader");
    const headerTexts = headers.map((h) => h.textContent);
    expect(headerTexts).toEqual(["Type", "Description", "Amount", "Balance", "Date"]);
  });
});
