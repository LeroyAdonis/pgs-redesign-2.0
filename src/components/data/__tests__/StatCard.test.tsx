import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatCard } from '@/components/data/StatCard';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Total Revenue" value="R 12,450" />);

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('R 12,450')).toBeInTheDocument();
  });

  it('renders the icon when provided', () => {
    render(
      <StatCard
        icon={<span data-testid="stat-icon">💰</span>}
        label="Revenue"
        value="R 5,000"
      />,
    );

    expect(screen.getByTestId('stat-icon')).toBeInTheDocument();
  });

  it('does not render icon container when icon is omitted', () => {
    const { container } = render(<StatCard label="Revenue" value="R 5,000" />);

    // The icon wrapper has specific sizing classes; verify it's absent
    const iconWrapper = container.querySelector('.h-9.w-9');
    expect(iconWrapper).toBeNull();
  });

  it('renders upward trend with arrow and success styling', () => {
    render(
      <StatCard
        label="Followers"
        value="1,234"
        trend={{ direction: 'up', value: '+12%' }}
      />,
    );

    const trendEl = screen.getByText(/\+12%/);
    expect(trendEl).toBeInTheDocument();
    expect(trendEl).toHaveTextContent('+12% ↑');
    expect(trendEl.className).toContain('text-success');
    expect(trendEl.className).toContain('bg-success-surface');
  });

  it('renders downward trend with arrow and error styling', () => {
    render(
      <StatCard
        label="Engagement"
        value="3.2%"
        trend={{ direction: 'down', value: '-5%' }}
      />,
    );

    const trendEl = screen.getByText(/-5%/);
    expect(trendEl).toBeInTheDocument();
    expect(trendEl).toHaveTextContent('-5% ↓');
    expect(trendEl.className).toContain('text-error');
    expect(trendEl.className).toContain('bg-error-surface');
  });

  it('does not render trend element when trend is omitted', () => {
    const { container } = render(<StatCard label="Views" value="999" />);

    // No element should contain the trend arrows
    expect(container.textContent).not.toContain('↑');
    expect(container.textContent).not.toContain('↓');
  });

  it('merges custom className onto the wrapper', () => {
    const { container } = render(
      <StatCard label="Posts" value="42" className="my-stat-card" />,
    );

    // The root div is the first child
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain('my-stat-card');
  });

  it('preserves base styling when custom className is applied', () => {
    const { container } = render(
      <StatCard label="Posts" value="42" className="extra-class" />,
    );

    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain('bg-surface-raised');
    expect(wrapper.className).toContain('extra-class');
  });

  it('renders the accent bar with aria-hidden', () => {
    const { container } = render(<StatCard label="X" value="0" />);

    const accentBar = container.querySelector('[aria-hidden="true"]');
    expect(accentBar).toBeInTheDocument();
  });
});
