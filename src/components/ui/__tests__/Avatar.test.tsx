import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Avatar } from '@/components/ui/Avatar';

describe('Avatar', () => {
  /* ─── Image rendering ─── */

  it('renders an <img> when src is provided', () => {
    render(<Avatar src="https://example.com/photo.jpg" alt="Jane Doe" />);
    const img = screen.getByRole('img', { name: 'Jane Doe' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('applies object-cover class to the image', () => {
    render(<Avatar src="https://example.com/photo.jpg" alt="Jane" />);
    const img = screen.getByRole('img');
    expect(img.className).toContain('object-cover');
  });

  /* ─── Fallback initials ─── */

  it('renders fallback text when no src is provided', () => {
    render(<Avatar fallback="JD" alt="Jane Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders "?" when neither src nor fallback is provided', () => {
    render(<Avatar />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('applies aria-label to the fallback text span', () => {
    render(<Avatar fallback="AB" alt="Alice Bob" />);
    const fallbackSpan = screen.getByLabelText('Alice Bob');
    expect(fallbackSpan).toBeInTheDocument();
    expect(fallbackSpan.textContent).toBe('AB');
  });

  it('uses fallback as aria-label when alt is not provided', () => {
    render(<Avatar fallback="XY" />);
    const fallbackSpan = screen.getByLabelText('XY');
    expect(fallbackSpan).toBeInTheDocument();
  });

  it('applies brand surface background for fallback display', () => {
    const { container } = render(<Avatar fallback="AB" />);
    // The inner circle span (second span) should have the brand fallback bg
    const innerCircle = container.querySelector('.bg-brand-surface');
    expect(innerCircle).toBeInTheDocument();
  });

  it('does not apply fallback background when src is provided', () => {
    const { container } = render(<Avatar src="https://example.com/photo.jpg" />);
    const brandBg = container.querySelector('.bg-brand-surface');
    expect(brandBg).not.toBeInTheDocument();
  });

  /* ─── Sizes ─── */

  it('applies the md size by default', () => {
    const { container } = render(<Avatar fallback="MD" />);
    const root = container.firstElementChild;
    expect(root?.className).toContain('h-10');
    expect(root?.className).toContain('w-10');
  });

  it.each([
    ['xs', 'h-6', 'w-6'],
    ['sm', 'h-8', 'w-8'],
    ['md', 'h-10', 'w-10'],
    ['lg', 'h-14', 'w-14'],
    ['xl', 'h-20', 'w-20'],
  ] as const)('applies %s size container classes (%s %s)', (size, h, w) => {
    const { container } = render(<Avatar size={size} fallback={size.toUpperCase()} />);
    const root = container.firstElementChild;
    expect(root?.className).toContain(h);
    expect(root?.className).toContain(w);
  });

  /* ─── Alt text ─── */

  it('defaults alt to empty string for images', () => {
    const { container } = render(<Avatar src="https://example.com/photo.jpg" />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', '');
  });

  it('passes alt text to the image element', () => {
    render(<Avatar src="https://example.com/photo.jpg" alt="Team member" />);
    const img = screen.getByRole('img', { name: 'Team member' });
    expect(img).toBeInTheDocument();
  });

  /* ─── Status indicator ─── */

  it('does not render a status indicator by default', () => {
    render(<Avatar fallback="NS" />);
    expect(screen.queryByLabelText('online')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('offline')).not.toBeInTheDocument();
  });

  it('renders an online status indicator with aria-label', () => {
    render(<Avatar fallback="ON" status="online" />);
    const indicator = screen.getByLabelText('online');
    expect(indicator).toBeInTheDocument();
    expect(indicator.className).toContain('bg-success');
  });

  it('renders an offline status indicator with aria-label', () => {
    render(<Avatar fallback="OF" status="offline" />);
    const indicator = screen.getByLabelText('offline');
    expect(indicator).toBeInTheDocument();
    expect(indicator.className).toContain('bg-text-muted');
  });

  it('positions the status indicator absolutely', () => {
    render(<Avatar fallback="ST" status="online" />);
    const indicator = screen.getByLabelText('online');
    expect(indicator.className).toContain('absolute');
    expect(indicator.className).toContain('bottom-0');
    expect(indicator.className).toContain('right-0');
  });

  /* ─── Custom className ─── */

  it('merges custom className onto the root span', () => {
    const { container } = render(<Avatar fallback="CL" className="my-avatar-class" />);
    const root = container.firstElementChild;
    expect(root?.className).toContain('my-avatar-class');
    // base styles should still be present
    expect(root?.className).toContain('inline-flex');
  });

  /* ─── Structure ─── */

  it('renders the root as a <span> element', () => {
    const { container } = render(<Avatar fallback="SP" />);
    expect(container.firstElementChild?.tagName).toBe('SPAN');
  });

  it('has a relative container for status positioning', () => {
    const { container } = render(<Avatar fallback="RL" />);
    const root = container.firstElementChild;
    expect(root?.className).toContain('relative');
  });
});
