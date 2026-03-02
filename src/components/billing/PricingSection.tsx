"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { PricingCards } from "@/components/billing/PricingCards";
import { TierChangeModal } from "@/components/billing/TierChangeModal";
import type { Tier, BillingInterval } from "@/lib/payments/tier-config";

/* ─── Props ─── */

interface PricingSectionProps {
  currentTier?: Tier;
}

/* ─── Types ─── */

interface PendingChange {
  tier: Tier;
  interval: BillingInterval;
}

/* ─── Component ─── */

/**
 * Client wrapper for PricingCards that handles checkout and tier-change flows.
 *
 * - **New users** (no currentTier): calls `/api/subscriptions/checkout` directly.
 * - **Existing subscribers**: opens a TierChangeModal for confirmation,
 *   then calls `/api/subscriptions/change-tier` on confirm.
 *
 * Both flows redirect to the Polar checkout URL on success.
 */
export function PricingSection({ currentTier }: PricingSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const t = useTranslations("billing");

  /** Direct checkout for new subscriptions (no current tier). */
  async function handleNewCheckout(tier: Tier, interval: BillingInterval) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, billingInterval: interval }),
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
      setIsLoading(false);
    }
  }

  /** Tier change for existing subscribers — called from modal confirmation. */
  async function handleTierChange(tier: Tier, interval: BillingInterval) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/subscriptions/change-tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newTier: tier, billingInterval: interval }),
      });

      const data = (await res.json()) as {
        success: boolean;
        checkoutUrl?: string;
        message?: string;
        error?: string;
      };

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Failed to change tier");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to change subscription",
      );
    } finally {
      setIsLoading(false);
      setPendingChange(null);
    }
  }

  /** Route to the correct flow depending on whether the user has a current tier. */
  function handleSelectTier(tier: Tier, interval: BillingInterval) {
    setError(null);

    if (!currentTier) {
      // New user — go straight to checkout
      handleNewCheckout(tier, interval);
      return;
    }

    // Existing subscriber — show confirmation modal
    setPendingChange({ tier, interval });
  }

  const handleModalClose = useCallback(() => {
    if (!isLoading) {
      setPendingChange(null);
    }
  }, [isLoading]);

  const handleModalConfirm = useCallback(() => {
    if (!pendingChange) return;
    handleTierChange(pendingChange.tier, pendingChange.interval);
  }, [pendingChange]);

  return (
    <section id="pricing" data-testid="pricing-section">
      <h2 className="mb-6 font-display text-xl font-bold text-text">
        {t("choosePlan")}
      </h2>

      <PricingCards
        currentTier={currentTier}
        onSelectTier={handleSelectTier}
        isLoading={isLoading}
      />

      {error && (
        <div
          className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          role="alert"
          data-testid="checkout-error"
        >
          {error}
        </div>
      )}

      {/* Tier change confirmation modal */}
      {currentTier && pendingChange && (
        <TierChangeModal
          isOpen={!!pendingChange}
          onClose={handleModalClose}
          currentTier={currentTier}
          targetTier={pendingChange.tier}
          billingInterval={pendingChange.interval}
          onConfirm={handleModalConfirm}
          isLoading={isLoading}
        />
      )}
    </section>
  );
}
