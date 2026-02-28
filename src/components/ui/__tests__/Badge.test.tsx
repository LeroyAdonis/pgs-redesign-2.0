import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from '@/components/ui/Badge';

describe('Badge', () => {
  /* ─── Rendering ─── */

  it('renders children text', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders as an inline <span>', () => {
    render(<Badge>Tag</Badge>);
    const el = screen.getByText('Tag');
    expect(el.tagName).toBe('SPAN');
  });

  /* ─── Variants ─── */

  it('applies the default variant styles by default', () => {
    render(<Badge>Default</Badge>);
    const el = screen.getByText('Default');
    expect(el.className).toContain('bg-surface-inset');
    expect(el.className).toContain('text-text-muted');
  });

  it('applies the success variant styles', () => {
    render(<Badge variant="success">OK</Badge>);
    const el = screen.getByText('OK');
    expect(el.className).toContain('bg-success-surface');
    expect(el.className).toContain('text-success');
  });

  it('applies the warning variant styles', () => {
    render(<Badge variant="warning">Warn</Badge>);
    const el = screen.getByText('Warn');
    expect(el.className).toContain('bg-warning-surface');
    expect(el.className).toContain('text-warning');
  });

  it('applies the error variant styles', () => {
    render(<Badge variant="error">Fail</Badge>);
    const el = screen.getByText('Fail');
    expect(el.className).toContain('bg-error-surface');
    expect(el.className).toContain('text-error');
  });

  it('applies the info variant styles', () => {
    render(<Badge variant="info">Info</Badge>);
    const el = screen.getByText('Info');
    expect(el.className).toContain('bg-info-surface');
    expect(el.className).toContain('text-info');
  });

  it('applies the brand variant styles', () => {
    render(<Badge variant="brand">Brand</Badge>);
    const el = screen.getByText('Brand');
    expect(el.className).toContain('bg-brand-surface');
    expect(el.className).toContain('text-brand');
  });

  /* ─── Sizes ─── */

  it('applies the md size by default', () => {
    render(<Badge>Medium</Badge>);
    const el = screen.getByText('Medium');
    expect(el.className).toContain('h-[26px]');
    expect(el.className).toContain('px-3');
  });

  it('applies the sm size styles', () => {
    render(<Badge size="sm">Small</Badge>);
    const el = screen.getByText('Small');
    expect(el.className).toContain('h-5');
    expect(el.className).toContain('px-2');
  });

  /* ─── Dot indicator ─── */

  it('does not render a dot by default', () => {
    const { container } = render(<Badge>No dot</Badge>);
    const dots = container.querySelectorAll('[aria-hidden="true"]');
    expect(dots).toHaveLength(0);
  });

  it('renders a colored dot when dot=true', () => {
    const { container } = render(<Badge dot>With dot</Badge>);
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();
    expect(dot?.className).toContain('rounded-full');
    expect(dot?.className).toContain('bg-current');
  });

  /* ─── Custom className ─── */

  it('merges custom className onto the root span', () => {
    render(<Badge className="my-custom-class">Styled</Badge>);
    const el = screen.getByText('Styled');
    expect(el.className).toContain('my-custom-class');
    // base styles should still be present
    expect(el.className).toContain('rounded-full');
  });

  /* ─── Children types ─── */

  it('renders JSX children (not just text)', () => {
    render(
      <Badge>
        <span data-testid="inner">Count: 5</span>
      </Badge>,
    );
    expect(screen.getByTestId('inner')).toBeInTheDocument();
    expect(screen.getByText('Count: 5')).toBeInTheDocument();
  });

  /* ─── Base styling invariants ─── */

  it('always includes base styling classes', () => {
    render(<Badge variant="error" size="sm">Base</Badge>);
    const el = screen.getByText('Base');
    expect(el.className).toContain('inline-flex');
    expect(el.className).toContain('font-mono');
    expect(el.className).toContain('border');
  });
});
