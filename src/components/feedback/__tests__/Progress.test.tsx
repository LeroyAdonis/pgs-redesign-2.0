import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Progress } from '@/components/feedback/Progress';

describe('Progress', () => {
  it('renders with role="progressbar"', () => {
    render(<Progress value={50} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('sets aria-valuenow to current value', () => {
    render(<Progress value={42} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42');
  });

  it('sets aria-valuemin to 0', () => {
    render(<Progress value={50} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0');
  });

  it('sets aria-valuemax to 100 by default', () => {
    render(<Progress value={50} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100');
  });

  it('sets aria-valuemax to custom max', () => {
    render(<Progress value={5} max={10} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '10');
  });

  it('calculates fill width percentage from value/max', () => {
    render(<Progress value={25} max={100} />);
    const bar = screen.getByRole('progressbar');
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe('25%');
  });

  it('clamps fill width to 100% when value exceeds max', () => {
    render(<Progress value={150} max={100} />);
    const bar = screen.getByRole('progressbar');
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });

  it('clamps fill width to 0% when value is negative', () => {
    render(<Progress value={-10} max={100} />);
    const bar = screen.getByRole('progressbar');
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe('0%');
  });

  it('handles max=0 gracefully (no division by zero)', () => {
    render(<Progress value={50} max={0} />);
    const bar = screen.getByRole('progressbar');
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe('0%');
  });

  it('renders label text when provided', () => {
    render(<Progress value={50} label="50% complete" />);
    expect(screen.getByText('50% complete')).toBeInTheDocument();
  });

  it('does not render a label element when label is not provided', () => {
    const { container } = render(<Progress value={50} />);
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('applies indeterminate animation class when indeterminate', () => {
    render(<Progress indeterminate />);
    const bar = screen.getByRole('progressbar');
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.className).toContain('animate-[progress-indeterminate');
  });

  it('does not set aria-valuenow when indeterminate', () => {
    render(<Progress indeterminate />);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  });

  it('does not apply inline width style when indeterminate', () => {
    render(<Progress indeterminate />);
    const bar = screen.getByRole('progressbar');
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe('');
  });

  it('applies transition class for determinate fill', () => {
    render(<Progress value={50} />);
    const bar = screen.getByRole('progressbar');
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.className).toContain('transition-[width]');
  });

  it('merges custom className on the wrapper', () => {
    render(<Progress value={50} className="my-progress" />);
    const bar = screen.getByRole('progressbar');
    const wrapper = bar.parentElement as HTMLElement;
    expect(wrapper.className).toContain('my-progress');
  });
});
