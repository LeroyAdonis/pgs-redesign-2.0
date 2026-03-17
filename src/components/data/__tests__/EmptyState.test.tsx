import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EmptyState } from '@/components/data/EmptyState';

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No posts yet" />);

    expect(screen.getByRole('heading', { name: /no posts yet/i })).toBeInTheDocument();
  });

  it('renders the title as an h3 element', () => {
    render(<EmptyState title="Nothing here" />);

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Nothing here');
  });

  it('renders description when provided', () => {
    render(
      <EmptyState
        title="No data"
        description="Start by creating your first post."
      />,
    );

    expect(screen.getByText('Start by creating your first post.')).toBeInTheDocument();
  });

  it('does not render description paragraph when omitted', () => {
    const { container } = render(<EmptyState title="Empty" />);

    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(0);
  });

  it('renders the icon when provided', () => {
    render(
      <EmptyState
        title="No results"
        icon={<span data-testid="empty-icon">📭</span>}
      />,
    );

    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
  });

  it('does not render icon container when icon is omitted', () => {
    const { container } = render(<EmptyState title="No data" />);

    // The icon wrapper uses a 120px sizing; verify absence
    const iconWrapper = container.querySelector('.w-\\[120px\\]');
    expect(iconWrapper).toBeNull();
  });

  it('renders action slot when provided', () => {
    render(
      <EmptyState
        title="No posts"
        action={<button type="button">Create Post</button>}
      />,
    );

    expect(screen.getByRole('button', { name: /create post/i })).toBeInTheDocument();
  });

  it('does not render action wrapper when action is omitted', () => {
    const { container } = render(<EmptyState title="Empty" />);

    // Only the title heading should be a direct child content element
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });

  it('action button is clickable', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <EmptyState
        title="Nothing"
        action={
          <button type="button" onClick={handleClick}>
            Add Item
          </button>
        }
      />,
    );

    await user.click(screen.getByRole('button', { name: /add item/i }));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('merges custom className onto the wrapper', () => {
    const { container } = render(
      <EmptyState title="Empty" className="my-empty-state" />,
    );

    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain('my-empty-state');
  });

  it('preserves base centering class when custom className is applied', () => {
    const { container } = render(
      <EmptyState title="Empty" className="extra" />,
    );

    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain('text-center');
    expect(wrapper.className).toContain('extra');
  });

  it('renders all optional elements together', () => {
    render(
      <EmptyState
        icon={<span data-testid="icon">🔍</span>}
        title="No results found"
        description="Try adjusting your search criteria."
        action={<button type="button">Clear filters</button>}
        className="full-empty"
      />,
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /no results found/i })).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search criteria.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
  });
});
