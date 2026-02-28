import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Spinner } from '@/components/feedback/Spinner';

describe('Spinner', () => {
  it('renders with role="status"', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-label="Loading"', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
  });

  it('defaults to medium size', () => {
    render(<Spinner />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('h-7');
    expect(el.className).toContain('w-7');
  });

  it('renders small size', () => {
    render(<Spinner size="sm" />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('h-4');
    expect(el.className).toContain('w-4');
    expect(el.className).toContain('border-2');
  });

  it('renders large size', () => {
    render(<Spinner size="lg" />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('h-11');
    expect(el.className).toContain('w-11');
  });

  it('has animate-spin class for spinning animation', () => {
    render(<Spinner />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('animate-spin');
  });

  it('merges custom className', () => {
    render(<Spinner className="my-spinner" />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('my-spinner');
  });

  it('has rounded-full class for circular shape', () => {
    render(<Spinner />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('rounded-full');
  });

  it('uses brand color for top border', () => {
    render(<Spinner />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('border-t-brand');
  });
});
