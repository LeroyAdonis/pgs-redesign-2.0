/**
 * Tests for Reset Password form component
 *
 * Verifies rendering, validation, form submission, and success/error states.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock better-auth client
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    resetPassword: vi.fn(),
  },
}));

import { authClient } from "@/lib/auth-client";
import { ResetPasswordForm } from "@/app/[locale]/(auth)/reset-password/reset-password-form";

const defaultLabels = {
  newPassword: "New password",
  confirmPassword: "Confirm password",
  resetPassword: "Reset password",
  resetting: "Resetting...",
  passwordResetSuccess: "Your password has been reset successfully.",
  backToLogin: "Back to sign in",
  passwordsMustMatch: "Passwords must match",
  invalidResetToken: "Invalid or expired reset link. Please request a new one.",
};

/**
 * Helper to set the URL search params for the test environment.
 */
function setSearchParams(params: string) {
  Object.defineProperty(window, "location", {
    value: { ...window.location, search: params },
    writable: true,
  });
}

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setSearchParams("?token=valid-test-token");
  });

  it("renders both password inputs and submit button", () => {
    render(<ResetPasswordForm labels={defaultLabels} />);

    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reset password" })
    ).toBeInTheDocument();
  });

  it("shows error when token is missing", () => {
    setSearchParams("");

    render(<ResetPasswordForm labels={defaultLabels} />);

    expect(
      screen.getByText(
        "Invalid or expired reset link. Please request a new one."
      )
    ).toBeInTheDocument();
  });

  it("shows error when URL has error=INVALID_TOKEN", () => {
    setSearchParams("?error=INVALID_TOKEN");

    render(<ResetPasswordForm labels={defaultLabels} />);

    expect(
      screen.getByText(
        "Invalid or expired reset link. Please request a new one."
      )
    ).toBeInTheDocument();
  });

  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup();

    render(<ResetPasswordForm labels={defaultLabels} />);

    await user.type(screen.getByLabelText("New password"), "password123");
    await user.type(screen.getByLabelText("Confirm password"), "different456");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(screen.getByText("Passwords must match")).toBeInTheDocument();
    expect(vi.mocked(authClient.resetPassword)).not.toHaveBeenCalled();
  });

  it("submits the form and shows success state", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.resetPassword).mockResolvedValue({ error: null });

    render(<ResetPasswordForm labels={defaultLabels} />);

    await user.type(screen.getByLabelText("New password"), "newpassword123");
    await user.type(
      screen.getByLabelText("Confirm password"),
      "newpassword123"
    );
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    await waitFor(() => {
      expect(
        screen.getByText("Your password has been reset successfully.")
      ).toBeInTheDocument();
    });

    expect(authClient.resetPassword).toHaveBeenCalledWith({
      newPassword: "newpassword123",
      token: "valid-test-token",
    });
  });

  it("shows an error message when reset fails", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.resetPassword).mockResolvedValue({
      error: { message: "Token expired" },
    });

    render(<ResetPasswordForm labels={defaultLabels} />);

    await user.type(screen.getByLabelText("New password"), "newpassword123");
    await user.type(
      screen.getByLabelText("Confirm password"),
      "newpassword123"
    );
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    await waitFor(() => {
      expect(screen.getByText("Token expired")).toBeInTheDocument();
    });
  });

  it("renders back to login link", () => {
    render(<ResetPasswordForm labels={defaultLabels} />);

    expect(screen.getByText("Back to sign in")).toBeInTheDocument();
    expect(screen.getByText("Back to sign in").closest("a")).toHaveAttribute(
      "href",
      "login"
    );
  });
});
