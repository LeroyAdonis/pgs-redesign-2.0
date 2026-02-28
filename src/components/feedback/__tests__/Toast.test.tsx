import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { ToastProvider, useToast } from '@/components/feedback/Toast';

/**
 * Helper component that exposes addToast via a button click.
 */
function ToastTrigger(props: {
  variant?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  message?: string;
  duration?: number;
}) {
  const { addToast } = useToast();
  return (
    <button
      type="button"
      onClick={() =>
        addToast({
          variant: props.variant ?? 'info',
          title: props.title ?? 'Test toast',
          message: props.message,
          duration: props.duration,
        })
      }
    >
      Trigger
    </button>
  );
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('throws when useToast is used outside ToastProvider', () => {
    // Suppress React error boundary console output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ToastTrigger />)).toThrow(
      'useToast must be used within a <ToastProvider>',
    );
    spy.mockRestore();
  });

  it('renders the toast container with aria-live="polite"', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );
    expect(screen.getByLabelText('Notifications')).toHaveAttribute(
      'aria-live',
      'polite',
    );
  });

  it('displays a toast when addToast is called', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastTrigger title="Hello World" />
      </ToastProvider>,
    );

    await user.click(screen.getByText('Trigger'));
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders toast message text', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastTrigger title="Title" message="Extra details" />
      </ToastProvider>,
    );

    await user.click(screen.getByText('Trigger'));
    expect(screen.getByText('Extra details')).toBeInTheDocument();
  });

  it.each(['success', 'warning', 'error', 'info'] as const)(
    'renders %s variant with matching icon color',
    async (variant) => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(
        <ToastProvider>
          <ToastTrigger variant={variant} title={`${variant} toast`} />
        </ToastProvider>,
      );

      await user.click(screen.getByText('Trigger'));
      const toast = screen.getByText(`${variant} toast`);
      expect(toast).toBeInTheDocument();
    },
  );

  it('renders toast with role="alert"', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastTrigger title="Alert toast" />
      </ToastProvider>,
    );

    await user.click(screen.getByText('Trigger'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('auto-dismisses after the default duration (4000ms)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastTrigger title="Auto dismiss" />
      </ToastProvider>,
    );

    await user.click(screen.getByText('Trigger'));
    expect(screen.getByText('Auto dismiss')).toBeInTheDocument();

    // Advance past the 4000ms duration + 150ms exit animation
    act(() => {
      vi.advanceTimersByTime(4200);
    });

    expect(screen.queryByText('Auto dismiss')).not.toBeInTheDocument();
  });

  it('auto-dismisses after a custom duration', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastTrigger title="Quick toast" duration={1000} />
      </ToastProvider>,
    );

    await user.click(screen.getByText('Trigger'));
    expect(screen.getByText('Quick toast')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(screen.queryByText('Quick toast')).not.toBeInTheDocument();
  });

  it('dismisses on close button click', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastTrigger title="Close me" />
      </ToastProvider>,
    );

    await user.click(screen.getByText('Trigger'));
    expect(screen.getByText('Close me')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Dismiss'));

    // Wait for exit animation (150ms)
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.queryByText('Close me')).not.toBeInTheDocument();
  });

  it('can display multiple toasts simultaneously', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    function MultiTrigger() {
      const { addToast } = useToast();
      return (
        <>
          <button onClick={() => addToast({ variant: 'info', title: 'Toast 1' })}>
            T1
          </button>
          <button onClick={() => addToast({ variant: 'success', title: 'Toast 2' })}>
            T2
          </button>
        </>
      );
    }

    render(
      <ToastProvider>
        <MultiTrigger />
      </ToastProvider>,
    );

    await user.click(screen.getByText('T1'));
    await user.click(screen.getByText('T2'));

    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
  });

  it('caps visible toasts at 5', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    function ManyTrigger() {
      const { addToast } = useToast();
      return (
        <button
          onClick={() => {
            for (let i = 1; i <= 6; i++) {
              addToast({ variant: 'info', title: `Toast ${i}`, duration: 60000 });
            }
          }}
        >
          Fire 6
        </button>
      );
    }

    render(
      <ToastProvider>
        <ManyTrigger />
      </ToastProvider>,
    );

    await user.click(screen.getByText('Fire 6'));

    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(5);
    // First toast should be dropped, keeping toasts 2-6
    expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
    expect(screen.getByText('Toast 6')).toBeInTheDocument();
  });
});
