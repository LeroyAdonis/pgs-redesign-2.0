"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn, formatZAR } from "@/lib/utils";
import { Card } from "@/components/layout/Card";
import { TOP_UP_PACKAGES } from "@/lib/payments/tier-config";

/* ─── Props ─── */

interface TopUpWidgetProps {
  currentBalance: number;
}

/* ─── Component ─── */

/**
 * Credit top-up widget showing available packages as selectable cards.
 *
 * Each package creates a Polar checkout session via the `/api/credits/topup`
 * API route and redirects the user to the checkout page.
 */
export function TopUpWidget({ currentBalance }: TopUpWidgetProps) {
  const [loadingPkg, setLoadingPkg] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("billing");

  async function handleBuy(creditAmount: number) {
    setLoadingPkg(creditAmount);
    setError(null);

    try {
      const res = await fetch("/api/credits/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditAmount }),
      });

      const data = (await res.json()) as {
        success: boolean;
        checkoutUrl?: string;
        error?: string;
      };

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Failed to create checkout");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create checkout",
      );
    } finally {
      setLoadingPkg(null);
    }
  }

  return (
    <Card as="section" padding="lg">
      <div data-testid="topup-widget">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-text">
            {t("topUp")}
          </h2>
          <span className="text-sm text-text-muted">
            {t("currentBalance")}{" "}
            <span className="font-mono font-semibold text-text">
              {currentBalance}
            </span>
          </span>
        </div>

        {/* Package grid */}
        <div className="grid grid-cols-2 gap-4" data-testid="topup-packages">
          {TOP_UP_PACKAGES.map((pkg) => {
            const isLoading = loadingPkg === pkg.creditAmount;

            return (
              <div
                key={pkg.creditAmount}
                className="flex flex-col items-center rounded-lg border border-border bg-surface p-4 text-center transition-colors hover:border-brand/30"
                data-testid={`topup-package-${pkg.creditAmount}`}
              >
                <span className="font-display text-2xl font-bold text-text">
                  {pkg.creditAmount}
                </span>
                <span className="mt-1 text-xs text-text-muted">{t("credits")}</span>

                <span
                  className="mt-3 font-mono text-sm font-semibold text-text"
                  data-testid={`topup-price-${pkg.creditAmount}`}
                >
                  {formatZAR(pkg.priceZAR)}
                </span>

                <button
                  type="button"
                  disabled={isLoading || loadingPkg !== null}
                  onClick={() => handleBuy(pkg.creditAmount)}
                  className={cn(
                    "mt-3 w-full rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                    "bg-brand text-white shadow-sm hover:bg-brand-vivid",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                  data-testid={`topup-buy-${pkg.creditAmount}`}
                >
                  {isLoading ? t("processing") : t("buy")}
                </button>
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div
            className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            role="alert"
            data-testid="topup-error"
          >
            {error}
          </div>
        )}
      </div>
    </Card>
  );
}
