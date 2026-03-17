/**
 * Tests for SignupForm — post-signup success feedback
 *
 * Verifies that after a successful signUp.email() call the user sees
 * an "Account created" confirmation instead of the form.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { SignupForm } from "../signup-form";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/auth-client", () => ({
  signUp: {
    email: vi.fn(),
  },
  signIn: {
    social: vi.fn(),
  },
}));

import { signUp } from "@/lib/auth-client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultLabels = {
  email: "Email",
  password: "Password",
  signUp: "Sign up",
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

  it("shows a success message after successful sign-up", async () => {
    // Mock signUp.email to call onSuccess from the options argument
    vi.mocked(signUp.email).mockImplementation(
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

    // Expect success feedback
    expect(
      screen.getByText(/account created/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/check your email/i),
    ).toBeInTheDocument();
  });

  it("does NOT show success message when sign-up errors", async () => {
    // Mock signUp.email to call onError instead
    vi.mocked(signUp.email).mockImplementation(
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

    // Error message should appear, not success
    expect(screen.getByText(/email already taken/i)).toBeInTheDocument();
    expect(screen.queryByText(/account created/i)).not.toBeInTheDocument();
  });
});
