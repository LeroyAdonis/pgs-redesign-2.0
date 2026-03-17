import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from '@/components/feedback/Skeleton';

describe('Skeleton', () => {
  it('renders with aria-hidden="true"', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });

  it('defaults to "text" variant with correct classes', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('h-3.5');
    expect(el.className).toContain('w-4/5');
    expect(el.className).toContain('rounded-sm');
  });

  it('renders "text-sm" variant', () => {
    const { container } = render(<Skeleton variant="text-sm" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('h-2.5');
    expect(el.className).toContain('w-3/5');
  });

  it('renders "avatar" variant with circular shape', () => {
    const { container } = render(<Skeleton variant="avatar" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('w-11');
    expect(el.className).toContain('h-11');
    expect(el.className).toContain('rounded-full');
  });

  it('renders "card" variant', () => {
    const { container } = render(<Skeleton variant="card" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('h-[180px]');
    expect(el.className).toContain('w-full');
    expect(el.className).toContain('rounded-none');
  });

  it('renders "custom" variant with no preset dimension classes', () => {
    const { container } = render(<Skeleton variant="custom" />);
    const el = container.firstElementChild as HTMLElement;
    // custom variant adds only the base classes, not dimension-specific ones
    expect(el.className).toContain('bg-surface-inset');
    expect(el.className).not.toContain('h-3.5');
    expect(el.className).not.toContain('rounded-full');
  });

  it('applies custom width and height via style', () => {
    const { container } = render(
      <Skeleton variant="custom" width="200px" height="48px" />,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.width).toBe('200px');
    expect(el.style.height).toBe('48px');
  });

  it('does not set inline width/height when not provided', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.width).toBe('');
    expect(el.style.height).toBe('');
  });

  it('contains the shimmer animation child element', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    const shimmer = el.firstElementChild as HTMLElement;
    expect(shimmer.className).toContain('animate-[shimmer');
  });

  it('has base surface-inset background', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('bg-surface-inset');
  });

  it('has overflow-hidden for shimmer containment', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('overflow-hidden');
  });

  it('merges custom className', () => {
    const { container } = render(<Skeleton className="my-skeleton" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('my-skeleton');
  });
});
