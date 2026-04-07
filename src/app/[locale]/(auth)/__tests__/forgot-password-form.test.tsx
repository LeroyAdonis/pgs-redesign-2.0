/**
 * Tests for Forgot Password form component
 *
 * Verifies rendering, form submission, error display, and success state.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock better-auth client
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    requestPasswordReset: vi.fn(),
  },
}));

import { authClient } from "@/lib/auth-client";
import { ForgotPasswordForm } from "@/app/[locale]/(auth)/forgot-password/forgot-password-form";

const defaultLabels = {
  email: "Email address",
  sendResetLink: "Send reset link",
  sending: "Sending...",
  resetLinkSent: "Check your email for a reset link",
  resetLinkSentDescription:
    "If an account exists with that email, we've sent a password reset link.",
  backToLogin: "Back to sign in",
};

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the email input and submit button", () => {
    render(<ForgotPasswordForm labels={defaultLabels} />);

    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send reset link" })
    ).toBeInTheDocument();
  });

  it("renders the back to login link", () => {
    render(<ForgotPasswordForm labels={defaultLabels} />);

    expect(screen.getByText("Back to sign in")).toBeInTheDocument();
    expect(screen.getByText("Back to sign in").closest("a")).toHaveAttribute(
      "href",
      "login"
    );
  });

  it("submits the form and shows success state", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.requestPasswordReset).mockResolvedValue({ error: null });

    render(<ForgotPasswordForm labels={defaultLabels} />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(
        screen.getByText("Check your email for a reset link")
      ).toBeInTheDocument();
    });

    expect(authClient.requestPasswordReset).toHaveBeenCalledWith({
      email: "test@example.com",
      redirectTo: "/reset-password",
    });
  });

  it("shows an error message when request fails", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.requestPasswordReset).mockResolvedValue({
      error: { message: "Too many requests" },
    });

    render(<ForgotPasswordForm labels={defaultLabels} />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(screen.getByText("Too many requests")).toBeInTheDocument();
    });
  });

  it("shows loading state during submission", async () => {
    const user = userEvent.setup();
    // Never resolve to keep loading state
    vi.mocked(authClient.requestPasswordReset).mockReturnValue(new Promise(() => {}));

    render(<ForgotPasswordForm labels={defaultLabels} />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Sending/i }),
      ).toBeDisabled();
    });
  });
});
