"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/layout/Card";
import type { TransactionHistoryItem } from "@/lib/credits";

/* ─── Props ─── */

interface TransactionHistoryProps {
  transactions: TransactionHistoryItem[];
  orgId: string;
  className?: string;
}

/* ─── Type Badge Styling ─── */

const TYPE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  allocation: {
    label: "Allocation",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
  },
  deduction: {
    label: "Deduction",
    bg: "bg-red-500/10",
    text: "text-red-400",
  },
  purchase: {
    label: "Purchase",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
  },
  bonus: {
    label: "Bonus",
    bg: "bg-violet-500/10",
    text: "text-violet-400",
  },
};

function getTypeConfig(type: string) {
  return (
    TYPE_CONFIG[type] ?? {
      label: type,
      bg: "bg-surface-inset",
      text: "text-text-muted",
    }
  );
}

/* ─── Type Icons (inline SVGs, 16×16) ─── */

function TypeIcon({ type }: { type: string }) {
  const config = getTypeConfig(type);

  const icons: Record<string, React.ReactNode> = {
    allocation: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 2v12M2 8h12"
      />
    ),
    deduction: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 8h12" />
    ),
    purchase: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3h2l1.5 7H12l1.5-5H5M6.5 13a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1ZM11.5 13a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1Z"
      />
    ),
    bonus: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 1l1 3h3l-2.5 2 1 3L8 7 5.5 9l1-3L4 4h3l1-3Z"
      />
    ),
  };

  return (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={cn("shrink-0", config.text)}
      aria-hidden="true"
    >
      {icons[type] ?? (
        <circle cx="8" cy="8" r="4" />
      )}
    </svg>
  );
}

/* ─── Date Formatting ─── */

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(date));
}

/* ─── Amount Display ─── */

function AmountCell({ amount }: { amount: number }) {
  const isPositive = amount > 0;
  return (
    <span
      className={cn(
        "font-mono text-sm font-semibold",
        isPositive ? "text-emerald-400" : "text-red-400",
      )}
      data-testid="transaction-amount"
    >
      {isPositive ? "+" : ""}
      {amount}
    </span>
  );
}

/* ─── Main Component ─── */

const PAGE_SIZE = 10;

/**
 * Paginated transaction history table.
 *
 * Initially shows the first page of transactions passed via props.
 * "Load more" fetches additional pages from the API endpoint.
 */
export function TransactionHistory({
  transactions: initial,
  orgId,
  className,
}: TransactionHistoryProps) {
  const [transactions, setTransactions] =
    useState<TransactionHistoryItem[]>(initial);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initial.length >= PAGE_SIZE);

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const offset = transactions.length;
      const res = await fetch(
        `/api/credits/transactions?orgId=${encodeURIComponent(orgId)}&limit=${PAGE_SIZE}&offset=${offset}`,
      );
      if (!res.ok) throw new Error("Failed to fetch transactions");

      const next = (await res.json()) as TransactionHistoryItem[];
      setTransactions((prev) => [...prev, ...next]);
      if (next.length < PAGE_SIZE) setHasMore(false);
    } catch {
      // Silently fail — user can retry via the button
    } finally {
      setLoading(false);
    }
  }, [transactions.length, orgId]);

  return (
    <Card as="section" padding="lg" className={className}>
      <div data-testid="transaction-history">
      <h2 className="mb-5 font-display text-lg font-semibold text-text">
        Transaction History
      </h2>

      {transactions.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted" data-testid="empty-state">
          No transactions yet.
        </p>
      ) : (
        <>
          {/* ── Desktop table ── */}
          <div className="hidden md:block">
            <table className="w-full text-sm" data-testid="transaction-table">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Description</th>
                  <th className="pb-3 pr-4 text-right">Amount</th>
                  <th className="pb-3 pr-4 text-right">Balance</th>
                  <th className="pb-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => {
                  const config = getTypeConfig(tx.type);
                  return (
                    <tr key={tx.id} data-testid="transaction-row">
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                            config.bg,
                            config.text,
                          )}
                        >
                          <TypeIcon type={tx.type} />
                          {config.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-text-muted">
                        {tx.description ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <AmountCell amount={tx.amount} />
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-sm text-text-muted">
                        {tx.runningBalance}
                      </td>
                      <td className="py-3 text-right text-xs text-text-muted">
                        {formatDate(tx.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="space-y-3 md:hidden">
            {transactions.map((tx) => {
              const config = getTypeConfig(tx.type);
              return (
                <div
                  key={tx.id}
                  className="rounded-lg border border-border bg-surface p-3"
                  data-testid="transaction-row"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                        config.bg,
                        config.text,
                      )}
                    >
                      <TypeIcon type={tx.type} />
                      {config.label}
                    </span>
                    <AmountCell amount={tx.amount} />
                  </div>
                  <p className="mt-2 text-xs text-text-muted">
                    {tx.description ?? "—"}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
                    <span>Balance: {tx.runningBalance}</span>
                    <span>{formatDate(tx.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loading}
                className={cn(
                  "rounded-lg border border-border px-5 py-2 text-sm font-medium text-text-muted",
                  "transition-colors hover:border-brand hover:text-brand",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
                data-testid="load-more-button"
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
      </div>
    </Card>
  );
}
