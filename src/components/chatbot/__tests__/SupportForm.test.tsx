import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SupportForm } from '../SupportForm';

// ── Mocks ──

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

// ── Helpers ──

function renderForm(overrides?: {
  onSubmit?: (data: { name: string; email: string; message: string }) => Promise<void>;
  onCancel?: () => void;
}) {
  const onSubmit = overrides?.onSubmit ?? vi.fn<(data: { name: string; email: string; message: string }) => Promise<void>>().mockResolvedValue(undefined);
  const onCancel = overrides?.onCancel ?? vi.fn();
  const utils = render(<SupportForm onSubmit={onSubmit} onCancel={onCancel} />);
  return { onSubmit, onCancel, ...utils };
}

// ── Tests ──

describe('SupportForm', () => {
  it('renders all form fields (name, email, message)', () => {
    renderForm();

    // Labels use translation keys
    expect(screen.getByLabelText('support.name')).toBeInTheDocument();
    expect(screen.getByLabelText('support.email')).toBeInTheDocument();
    expect(screen.getByLabelText('support.message')).toBeInTheDocument();
  });

  it('shows validation error for invalid email on submit', async () => {
    const user = userEvent.setup();
    renderForm();

    // Fill in name and message but use invalid email
    await user.type(screen.getByLabelText('support.name'), 'Test User');
    await user.type(screen.getByLabelText('support.email'), 'invalid-email');
    await user.type(screen.getByLabelText('support.message'), 'Test message here');

    // The component disables the submit button when email is invalid
    // (canSubmit requires EMAIL_RE.test(email) to pass), preventing
    // form submission rather than showing a post-submit validation error.
    const submitButton = screen.getByRole('button', { name: /support\.submit/i });
    expect(submitButton).toBeDisabled();
  });

  it('calls onSubmit with trimmed form data when valid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(data: { name: string; email: string; message: string }) => Promise<void>>().mockResolvedValue(undefined);
    renderForm({ onSubmit });

    await user.type(screen.getByLabelText('support.name'), '  Test User  ');
    await user.type(screen.getByLabelText('support.email'), 'test@example.com');
    await user.type(screen.getByLabelText('support.message'), 'Help me with my account');

    const submitButton = screen.getByRole('button', { name: /support\.submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Help me with my account',
      });
    });
  });

  it('shows success state after successful submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(data: { name: string; email: string; message: string }) => Promise<void>>().mockResolvedValue(undefined);
    renderForm({ onSubmit });

    await user.type(screen.getByLabelText('support.name'), 'Test User');
    await user.type(screen.getByLabelText('support.email'), 'test@example.com');
    await user.type(screen.getByLabelText('support.message'), 'Need some help');

    const submitButton = screen.getByRole('button', { name: /support\.submit/i });
    await user.click(submitButton);

    // After success, the form is replaced with a success message
    await waitFor(() => {
      expect(screen.getByText('support.success')).toBeInTheDocument();
      expect(screen.getByText('support.successDetail')).toBeInTheDocument();
    });

    // The form fields should no longer be visible
    expect(screen.queryByLabelText('support.name')).not.toBeInTheDocument();
  });

  it('shows error state when onSubmit throws', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(data: { name: string; email: string; message: string }) => Promise<void>>().mockRejectedValue(
      new Error('Network error'),
    );
    renderForm({ onSubmit });

    await user.type(screen.getByLabelText('support.name'), 'Test User');
    await user.type(screen.getByLabelText('support.email'), 'test@example.com');
    await user.type(screen.getByLabelText('support.message'), 'Need some help');

    const submitButton = screen.getByRole('button', { name: /support\.submit/i });
    await user.click(submitButton);

    // Should show the error message
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('cancel button calls onCancel', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderForm({ onCancel });

    const cancelButton = screen.getByRole('button', { name: /support\.cancel/i });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows back to chat button in success state that calls onCancel', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(data: { name: string; email: string; message: string }) => Promise<void>>().mockResolvedValue(undefined);
    const onCancel = vi.fn();
    renderForm({ onSubmit, onCancel });

    await user.type(screen.getByLabelText('support.name'), 'Test User');
    await user.type(screen.getByLabelText('support.email'), 'test@example.com');
    await user.type(screen.getByLabelText('support.message'), 'Need some help');

    const submitButton = screen.getByRole('button', { name: /support\.submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('support.success')).toBeInTheDocument();
    });

    // "Back to chat" button should call onCancel
    const backButton = screen.getByRole('button', { name: /backToChat/i });
    await user.click(backButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
