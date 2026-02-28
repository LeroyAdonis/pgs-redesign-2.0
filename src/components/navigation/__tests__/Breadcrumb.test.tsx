import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Breadcrumb, type BreadcrumbItem } from '@/components/navigation/Breadcrumb';

// ─── Fixtures ───────────────────────────────────────────────────

const threeItems: BreadcrumbItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Widget' },
];

const twoItems: BreadcrumbItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Settings' },
];

const singleItem: BreadcrumbItem[] = [{ label: 'Home' }];

// ─── Tests ──────────────────────────────────────────────────────

describe('Breadcrumb', () => {
  // ── Rendering ─────────────────────────────────────────────────

  it('renders a nav element with aria-label "Breadcrumb"', () => {
    render(<Breadcrumb items={twoItems} />);
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
  });

  it('renders an ordered list inside the nav', () => {
    render(<Breadcrumb items={twoItems} />);
    const nav = screen.getByRole('navigation');
    expect(within(nav).getByRole('list')).toBeInTheDocument();
  });

  it('renders one list item per breadcrumb item', () => {
    render(<Breadcrumb items={threeItems} />);
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
  });

  it('displays every label', () => {
    render(<Breadcrumb items={threeItems} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Widget')).toBeInTheDocument();
  });

  // ── Link behavior ─────────────────────────────────────────────

  it('renders links for non-last items with href', () => {
    render(<Breadcrumb items={threeItems} />);
    const homeLink = screen.getByRole('link', { name: 'Home' });
    const productsLink = screen.getByRole('link', { name: 'Products' });

    expect(homeLink).toHaveAttribute('href', '/');
    expect(productsLink).toHaveAttribute('href', '/products');
  });

  it('does not render the last item as a link even if it has href', () => {
    const itemsWithHrefOnLast: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Current', href: '/current' },
    ];
    render(<Breadcrumb items={itemsWithHrefOnLast} />);

    // "Current" is the last item — should be a span, not a link
    expect(screen.queryByRole('link', { name: 'Current' })).not.toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('renders a non-last item without href as a span (not a link)', () => {
    const itemsWithoutHref: BreadcrumbItem[] = [
      { label: 'Section' },
      { label: 'Page' },
    ];
    render(<Breadcrumb items={itemsWithoutHref} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  // ── Current item (last) ───────────────────────────────────────

  it('marks the last item with aria-current="page"', () => {
    render(<Breadcrumb items={threeItems} />);
    const current = screen.getByText('Widget');
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('does not set aria-current on non-last items', () => {
    render(<Breadcrumb items={threeItems} />);
    const homeLink = screen.getByRole('link', { name: 'Home' });
    const productsLink = screen.getByRole('link', { name: 'Products' });

    expect(homeLink).not.toHaveAttribute('aria-current');
    expect(productsLink).not.toHaveAttribute('aria-current');
  });

  it('applies font-medium class to the last item', () => {
    render(<Breadcrumb items={threeItems} />);
    const current = screen.getByText('Widget');
    expect(current.className).toContain('font-medium');
  });

  // ── Separator ─────────────────────────────────────────────────

  it('renders chevron separators between items', () => {
    const { container } = render(<Breadcrumb items={threeItems} />);
    const separators = container.querySelectorAll('[aria-hidden="true"]');
    // 3 items → 2 separators (before 2nd and 3rd)
    expect(separators).toHaveLength(2);
  });

  it('uses › as the separator character', () => {
    const { container } = render(<Breadcrumb items={twoItems} />);
    const separator = container.querySelector('[aria-hidden="true"]');
    expect(separator).toHaveTextContent('›');
  });

  it('does not render a separator before the first item', () => {
    const { container } = render(<Breadcrumb items={threeItems} />);
    const firstLi = screen.getAllByRole('listitem')[0];
    const separatorInFirst = firstLi.querySelector('[aria-hidden="true"]');
    expect(separatorInFirst).toBeNull();
  });

  // ── Custom className ──────────────────────────────────────────

  it('merges a custom className onto the nav element', () => {
    render(<Breadcrumb items={twoItems} className="my-custom-class" />);
    const nav = screen.getByRole('navigation');
    expect(nav.className).toContain('my-custom-class');
  });

  it('preserves default styling when className is added', () => {
    render(<Breadcrumb items={twoItems} className="extra" />);
    const nav = screen.getByRole('navigation');
    expect(nav.className).toContain('text-sm');
    expect(nav.className).toContain('extra');
  });

  // ── Edge cases ────────────────────────────────────────────────

  it('returns null for an empty items array', () => {
    const { container } = render(<Breadcrumb items={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders a single item as current page without a link or separator', () => {
    const { container } = render(<Breadcrumb items={singleItem} />);

    // Should have the nav and one list item
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);

    // Single item is the last item → aria-current="page", font-medium
    const item = screen.getByText('Home');
    expect(item).toHaveAttribute('aria-current', 'page');
    expect(item.className).toContain('font-medium');

    // No links, no separators
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('renders a single item with href as span (not link) since it is the last', () => {
    const singleWithHref: BreadcrumbItem[] = [{ label: 'Dashboard', href: '/dashboard' }];
    render(<Breadcrumb items={singleWithHref} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toHaveAttribute('aria-current', 'page');
  });
});
