"use client";

import { useState } from "react";
import { PricingCards } from "@/components/billing/PricingCards";
import type { Tier } from "@/lib/payments/tier-config";

/* ─── Props ─── */

interface PricingSectionProps {
  currentTier?: Tier;
}

/* ─── Component ─── */

/**
 * Client wrapper for PricingCards that handles the checkout API call.
 *
 * When a user selects a tier, this component calls the
 * `/api/subscriptions/checkout` endpoint and redirects to the Polar
 * checkout URL on success.
 */
export function PricingSection({ currentTier }: PricingSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelectTier(tier: Tier, interval: "monthly" | "annual") {
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

  return (
    <section id="pricing" data-testid="pricing-section">
      <h2 className="mb-6 font-display text-xl font-bold text-text">
        Choose Your Plan
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
    </section>
  );
}
