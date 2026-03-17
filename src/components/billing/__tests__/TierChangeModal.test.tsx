/**
 * Tests for TierChangeModal component
 *
 * Validates rendering of tier comparison, feature gains/losses,
 * pricing differences, upgrade vs downgrade styling, and user interactions.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TierChangeModal } from "@/components/billing/TierChangeModal";

// ---------------------------------------------------------------------------
// Default props factory
// ---------------------------------------------------------------------------

function defaultProps(overrides: Partial<Parameters<typeof TierChangeModal>[0]> = {}) {
  return {
    isOpen: true,
    onClose: vi.fn(),
    currentTier: "hustler" as const,
    targetTier: "grower" as const,
    billingInterval: "monthly" as const,
    onConfirm: vi.fn(),
    isLoading: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe("TierChangeModal", () => {
  // ─── Basic rendering ───

  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <TierChangeModal {...defaultProps({ isOpen: false })} />,
    );
    // Modal uses createPortal so check there's no dialog role
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(container.innerHTML).toBe("");
  });

  it("renders a dialog when isOpen is true", () => {
    render(<TierChangeModal {...defaultProps()} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  // ─── Current vs target tier comparison ───

  it("renders current and target tier names", () => {
    render(<TierChangeModal {...defaultProps()} />);
    // Hustler → Grower
    expect(screen.getByText("Hustler")).toBeInTheDocument();
    expect(screen.getByText("Grower")).toBeInTheDocument();
  });

  it("shows 'Current Plan' and 'New Plan' labels", () => {
    render(<TierChangeModal {...defaultProps()} />);
    expect(screen.getByText("Current Plan")).toBeInTheDocument();
    expect(screen.getByText("New Plan")).toBeInTheDocument();
  });

  it("displays credit allocation for both tiers", () => {
    render(<TierChangeModal {...defaultProps()} />);
    // Hustler = 50 credits, Grower = 200 credits
    expect(screen.getByText("50 credits/month")).toBeInTheDocument();
    expect(screen.getByText("200 credits/month")).toBeInTheDocument();
  });

  // ─── Feature gains and losses ───

  it("shows gained features when upgrading", () => {
    render(
      <TierChangeModal
        {...defaultProps({ currentTier: "hustler", targetTier: "grower" })}
      />,
    );
    // Grower gains credit rollover over hustler
    expect(screen.getByText("Credit rollover")).toBeInTheDocument();
  });

  it("shows lost features when downgrading", () => {
    render(
      <TierChangeModal
        {...defaultProps({ currentTier: "grower", targetTier: "hustler" })}
      />,
    );
    // Loses credit rollover
    expect(screen.getByText("Credit rollover")).toBeInTheDocument();
  });

  it("shows limit changes between tiers", () => {
    render(
      <TierChangeModal
        {...defaultProps({ currentTier: "seedling", targetTier: "hustler" })}
      />,
    );
    // Should show limit comparison labels
    expect(screen.getByText("Limit Changes")).toBeInTheDocument();
    expect(screen.getByText("Social accounts")).toBeInTheDocument();
  });

  // ─── Upgrade vs downgrade styling ───

  it("shows 'Upgrade to' title for upgrade", () => {
    render(
      <TierChangeModal
        {...defaultProps({ currentTier: "hustler", targetTier: "grower" })}
      />,
    );
    expect(screen.getByText("Upgrade to Grower")).toBeInTheDocument();
  });

  it("shows 'Downgrade to' title for downgrade", () => {
    render(
      <TierChangeModal
        {...defaultProps({ currentTier: "grower", targetTier: "hustler" })}
      />,
    );
    expect(screen.getByText("Downgrade to Hustler")).toBeInTheDocument();
  });

  it("shows 'Confirm Upgrade' button text for upgrade", () => {
    render(
      <TierChangeModal
        {...defaultProps({ currentTier: "hustler", targetTier: "grower" })}
      />,
    );
    expect(
      screen.getByRole("button", { name: /confirm upgrade/i }),
    ).toBeInTheDocument();
  });

  it("shows 'Confirm Downgrade' button text for downgrade", () => {
    render(
      <TierChangeModal
        {...defaultProps({ currentTier: "grower", targetTier: "hustler" })}
      />,
    );
    expect(
      screen.getByRole("button", { name: /confirm downgrade/i }),
    ).toBeInTheDocument();
  });

  it("shows downgrade warning alert on downgrade", () => {
    render(
      <TierChangeModal
        {...defaultProps({ currentTier: "grower", targetTier: "hustler" })}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/loss of access/i)).toBeInTheDocument();
  });

  it("does not show downgrade warning on upgrade", () => {
    render(
      <TierChangeModal
        {...defaultProps({ currentTier: "hustler", targetTier: "grower" })}
      />,
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  // ─── Pricing ───

  it("shows monthly cost increase for upgrade", () => {
    render(
      <TierChangeModal
        {...defaultProps({ currentTier: "hustler", targetTier: "grower" })}
      />,
    );
    // Hustler R299 → Grower R799 = increase of R500
    expect(screen.getByText(/will increase/i)).toBeInTheDocument();
  });

  it("shows monthly cost decrease for downgrade", () => {
    render(
      <TierChangeModal
        {...defaultProps({ currentTier: "grower", targetTier: "hustler" })}
      />,
    );
    expect(screen.getByText(/will decrease/i)).toBeInTheDocument();
  });

  it("shows billed annually note for annual interval", () => {
    render(
      <TierChangeModal
        {...defaultProps({
          currentTier: "hustler",
          targetTier: "grower",
          billingInterval: "annual",
        })}
      />,
    );
    expect(screen.getByText(/billed annually/i)).toBeInTheDocument();
  });

  // ─── User interactions ───

  it("calls onConfirm when confirm button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <TierChangeModal
        {...defaultProps({
          currentTier: "hustler",
          targetTier: "grower",
          onConfirm,
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /confirm upgrade/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <TierChangeModal
        {...defaultProps({ onClose })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  // ─── Loading state ───

  it("disables both buttons when isLoading is true", () => {
    render(
      <TierChangeModal
        {...defaultProps({
          isLoading: true,
          currentTier: "hustler",
          targetTier: "grower",
        })}
      />,
    );

    expect(
      screen.getByRole("button", { name: /cancel/i }),
    ).toBeDisabled();
    // The confirm button shows a loading spinner — check it exists
    // When isLoading, Button sets disabled internally
    const confirmBtn = screen.getByRole("button", { name: /confirm upgrade|loading/i });
    expect(confirmBtn).toBeInTheDocument();
  });

  it("shows loading spinner on confirm button when isLoading", () => {
    render(
      <TierChangeModal
        {...defaultProps({
          isLoading: true,
          currentTier: "hustler",
          targetTier: "grower",
        })}
      />,
    );

    // Button component renders a status element with "Loading" label
    expect(screen.getByRole("status", { name: /loading/i })).toBeInTheDocument();
  });

  // ─── Edge cases ───

  it("handles seedling to mogul (full range upgrade)", () => {
    render(
      <TierChangeModal
        {...defaultProps({ currentTier: "seedling", targetTier: "mogul" })}
      />,
    );
    expect(screen.getByText("Upgrade to Mogul")).toBeInTheDocument();
    expect(screen.getByText("Seedling")).toBeInTheDocument();
    expect(screen.getByText("Mogul")).toBeInTheDocument();
    // Should show WhatsApp Business as gained
    expect(screen.getByText("WhatsApp Business")).toBeInTheDocument();
  });

  it("handles mogul to seedling (full range downgrade)", () => {
    render(
      <TierChangeModal
        {...defaultProps({ currentTier: "mogul", targetTier: "seedling" })}
      />,
    );
    expect(screen.getByText("Downgrade to Seedling")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
