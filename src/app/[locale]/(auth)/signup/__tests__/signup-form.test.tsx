/**
 * Tests for SignupForm — sign-up flow and error handling
 *
 * Verifies that successful signUp.email() triggers router.push("/dashboard")
 * and that errors are displayed correctly.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("@/lib/auth-client", () => ({
  signUp: {
    email: vi.fn(),
  },
  signIn: {
    social: vi.fn(),
  },
}));

import { signUp } from "@/lib/auth-client";
import { SignupForm } from "../signup-form";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultLabels = {
  email: "Email",
  password: "Password",
  signUp: "Sign up",
  signingUp: "Signing up...",
  continueWithGoogle: "Continue with Google",
  continueWithGithub: "Continue with GitHub",
  or: "or",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SignupForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to dashboard after successful sign-up", async () => {
    // Mock signUp.email to call onSuccess from the options argument
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked(signUp.email) as any).mockImplementation(
      async (_data: unknown, options?: { onSuccess?: () => void }) => {
        options?.onSuccess?.();
      },
    );

    const user = userEvent.setup();
    render(<SignupForm labels={defaultLabels} />);

    // Fill out the form
    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "securePassword123");

    // Submit
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    // On success, the component calls router.push("/dashboard")
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows error message when sign-up fails", async () => {
    // Mock signUp.email to call onError instead
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked(signUp.email) as any).mockImplementation(
      async (
        _data: unknown,
        options?: { onError?: (ctx: { error: { message: string } }) => void },
      ) => {
        options?.onError?.({ error: { message: "Email already taken" } });
      },
    );

    const user = userEvent.setup();
    render(<SignupForm labels={defaultLabels} />);

    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "taken@example.com");
    await user.type(screen.getByLabelText(/password/i), "securePassword123");

    await user.click(screen.getByRole("button", { name: /sign up/i }));

    // Error message should appear
    await waitFor(() => {
      expect(screen.getByText(/email already taken/i)).toBeInTheDocument();
    });

    // Should NOT have navigated
    expect(pushMock).not.toHaveBeenCalled();
  });
});
