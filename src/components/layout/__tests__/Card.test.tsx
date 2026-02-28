import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card } from '@/components/layout/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders as a div by default', () => {
    render(<Card>Content</Card>);
    const el = screen.getByText('Content');
    expect(el.tagName).toBe('DIV');
  });

  it('applies base card styles', () => {
    render(<Card>Base</Card>);
    const el = screen.getByText('Base');
    expect(el.className).toContain('rounded-lg');
    expect(el.className).toContain('border');
    expect(el.className).toContain('bg-surface-raised');
    expect(el.className).toContain('overflow-hidden');
  });

  it('applies medium padding by default', () => {
    render(<Card>Default pad</Card>);
    const el = screen.getByText('Default pad');
    expect(el.className).toContain('p-5');
  });

  it('applies no padding when padding="none"', () => {
    render(<Card padding="none">No pad</Card>);
    const el = screen.getByText('No pad');
    expect(el.className).not.toMatch(/\bp-\d/);
  });

  it('applies small padding', () => {
    render(<Card padding="sm">Small pad</Card>);
    const el = screen.getByText('Small pad');
    expect(el.className).toContain('p-3');
  });

  it('applies large padding', () => {
    render(<Card padding="lg">Large pad</Card>);
    const el = screen.getByText('Large pad');
    expect(el.className).toContain('p-6');
  });

  it('does not apply hover effects by default', () => {
    render(<Card>Static</Card>);
    const el = screen.getByText('Static');
    expect(el.className).not.toContain('hover:-translate-y-1');
    expect(el.className).not.toContain('hover:shadow-glow');
  });

  it('applies hover effects when interactive', () => {
    render(<Card interactive>Clickable</Card>);
    const el = screen.getByText('Clickable');
    expect(el.className).toContain('hover:-translate-y-1');
    expect(el.className).toContain('hover:shadow-glow');
    expect(el.className).toContain('transition-[transform,box-shadow,border-color]');
  });

  it('renders as article when as="article"', () => {
    render(<Card as="article">Article card</Card>);
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('renders as section when as="section"', () => {
    render(<Card as="section">Section card</Card>);
    const el = screen.getByText('Section card');
    expect(el.tagName).toBe('SECTION');
  });

  it('merges custom className', () => {
    render(<Card className="extra-style">Styled</Card>);
    const el = screen.getByText('Styled');
    expect(el.className).toContain('extra-style');
    expect(el.className).toContain('rounded-lg');
  });

  it('renders complex children', () => {
    render(
      <Card>
        <h2>Title</h2>
        <p>Description</p>
      </Card>,
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });
});
