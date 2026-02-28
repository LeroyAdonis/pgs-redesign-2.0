import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Divider } from '@/components/layout/Divider';

describe('Divider', () => {
  it('renders a horizontal separator by default', () => {
    render(<Divider />);
    const sep = screen.getByRole('separator');
    expect(sep).toBeInTheDocument();
  });

  it('applies horizontal styles by default', () => {
    render(<Divider />);
    const sep = screen.getByRole('separator');
    expect(sep.className).toContain('h-px');
    expect(sep.className).toContain('w-full');
  });

  it('uses regular border color by default', () => {
    render(<Divider />);
    const sep = screen.getByRole('separator');
    expect(sep.className).toContain('bg-border');
    expect(sep.className).not.toContain('bg-border-strong');
  });

  it('applies strong border color when strong is true', () => {
    render(<Divider strong />);
    const sep = screen.getByRole('separator');
    expect(sep.className).toContain('bg-border-strong');
  });

  it('renders a vertical separator', () => {
    render(<Divider orientation="vertical" />);
    const sep = screen.getByRole('separator');
    expect(sep).toHaveAttribute('aria-orientation', 'vertical');
    expect(sep.className).toContain('w-px');
    expect(sep.className).toContain('self-stretch');
  });

  it('renders a labeled horizontal divider', () => {
    render(<Divider label="OR" />);
    const sep = screen.getByRole('separator');
    expect(sep).toBeInTheDocument();
    expect(screen.getByText('OR')).toBeInTheDocument();
  });

  it('renders label between two lines', () => {
    render(<Divider label="Section" />);
    const sep = screen.getByRole('separator');
    // The label wrapper uses flex layout with gap
    expect(sep.className).toContain('flex');
    expect(sep.className).toContain('items-center');
    // Two decorative lines + the label text
    const lines = sep.querySelectorAll('.h-px');
    expect(lines).toHaveLength(2);
  });

  it('applies strong color to labeled divider lines', () => {
    render(<Divider label="Bold" strong />);
    const sep = screen.getByRole('separator');
    const lines = sep.querySelectorAll('.h-px');
    lines.forEach((line) => {
      expect(line.className).toContain('bg-border-strong');
    });
  });

  it('applies strong color to vertical divider', () => {
    render(<Divider orientation="vertical" strong />);
    const sep = screen.getByRole('separator');
    expect(sep.className).toContain('bg-border-strong');
  });

  it('merges custom className on horizontal divider', () => {
    render(<Divider className="my-divider" />);
    const sep = screen.getByRole('separator');
    expect(sep.className).toContain('my-divider');
  });

  it('merges custom className on vertical divider', () => {
    render(<Divider orientation="vertical" className="vert-custom" />);
    const sep = screen.getByRole('separator');
    expect(sep.className).toContain('vert-custom');
  });

  it('merges custom className on labeled divider', () => {
    render(<Divider label="Test" className="label-custom" />);
    const sep = screen.getByRole('separator');
    expect(sep.className).toContain('label-custom');
  });
});
