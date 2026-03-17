import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Alert, type AlertProps } from '@/components/feedback/Alert';

const variants: AlertProps['variant'][] = ['info', 'success', 'warning', 'error'];

describe('Alert', () => {
  it('renders with role="alert"', () => {
    render(<Alert variant="info" title="Heads up" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders the title text', () => {
    render(<Alert variant="info" title="Heads up" />);
    expect(screen.getByText('Heads up')).toBeInTheDocument();
  });

  it('renders the message text when provided', () => {
    render(<Alert variant="info" title="Title" message="Detailed message" />);
    expect(screen.getByText('Detailed message')).toBeInTheDocument();
  });

  it('does not render message when compact', () => {
    render(<Alert variant="info" title="Title" message="Hidden message" compact />);
    expect(screen.queryByText('Hidden message')).not.toBeInTheDocument();
  });

  it('does not render children when compact', () => {
    render(
      <Alert variant="info" title="Title" compact>
        <span data-testid="child">Extra content</span>
      </Alert>,
    );
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('renders children when not compact', () => {
    render(
      <Alert variant="info" title="Title">
        <span data-testid="child">Extra content</span>
      </Alert>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it.each(variants)('renders %s variant with correct classes', (variant) => {
    render(<Alert variant={variant} title="Test" />);
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain(`bg-${variant}-surface`);
    expect(alert.className).toContain(`border-${variant}`);
    expect(alert.className).toContain(`text-${variant}`);
  });

  it.each(variants)('renders an icon SVG (aria-hidden) for %s variant', (variant) => {
    render(<Alert variant={variant} title="Test" />);
    const alert = screen.getByRole('alert');
    const svg = alert.querySelector('svg[aria-hidden="true"]');
    expect(svg).toBeInTheDocument();
  });

  it('does not render a close button when onClose is not provided', () => {
    render(<Alert variant="info" title="No close" />);
    expect(screen.queryByLabelText('Dismiss alert')).not.toBeInTheDocument();
  });

  it('renders a close button when onClose is provided', () => {
    render(<Alert variant="info" title="Closable" onClose={() => {}} />);
    expect(screen.getByLabelText('Dismiss alert')).toBeInTheDocument();
  });

  it('calls onClose when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(<Alert variant="info" title="Closable" onClose={handleClose} />);

    await user.click(screen.getByLabelText('Dismiss alert'));
    expect(handleClose).toHaveBeenCalledOnce();
  });

  it('applies compact layout classes', () => {
    render(<Alert variant="info" title="Compact" compact />);
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('items-center');
    expect(alert.className).toContain('px-4');
    expect(alert.className).toContain('py-2');
  });

  it('applies non-compact layout class (p-4)', () => {
    render(<Alert variant="info" title="Normal" />);
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('p-4');
  });

  it('merges custom className', () => {
    render(<Alert variant="info" title="Custom" className="my-custom-class" />);
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('my-custom-class');
  });
});
