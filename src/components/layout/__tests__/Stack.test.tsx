import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Stack } from '@/components/layout/Stack';

describe('Stack', () => {
  it('renders children', () => {
    render(
      <Stack>
        <span>Child 1</span>
        <span>Child 2</span>
      </Stack>,
    );
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });

  it('renders as a div by default', () => {
    render(<Stack>Content</Stack>);
    const el = screen.getByText('Content');
    expect(el.tagName).toBe('DIV');
  });

  it('uses flex-col (vertical) direction by default', () => {
    render(<Stack>Vertical</Stack>);
    const el = screen.getByText('Vertical');
    expect(el.className).toContain('flex');
    expect(el.className).toContain('flex-col');
  });

  it('applies flex-row for horizontal direction', () => {
    render(<Stack direction="horizontal">Horizontal</Stack>);
    const el = screen.getByText('Horizontal');
    expect(el.className).toContain('flex-row');
    expect(el.className).not.toContain('flex-col');
  });

  it('applies gap-4 by default', () => {
    render(<Stack>Default gap</Stack>);
    const el = screen.getByText('Default gap');
    expect(el.className).toContain('gap-4');
  });

  it('applies custom gap values', () => {
    render(<Stack gap="1">Gap 1</Stack>);
    expect(screen.getByText('Gap 1').className).toContain('gap-1');

    render(<Stack gap="8">Gap 8</Stack>);
    expect(screen.getByText('Gap 8').className).toContain('gap-8');

    render(<Stack gap="12">Gap 12</Stack>);
    expect(screen.getByText('Gap 12').className).toContain('gap-12');
  });

  it('applies alignment classes', () => {
    render(<Stack align="center">Centered</Stack>);
    expect(screen.getByText('Centered').className).toContain('items-center');

    render(<Stack align="start">Start</Stack>);
    expect(screen.getByText('Start').className).toContain('items-start');

    render(<Stack align="end">End</Stack>);
    expect(screen.getByText('End').className).toContain('items-end');

    render(<Stack align="stretch">Stretch</Stack>);
    expect(screen.getByText('Stretch').className).toContain('items-stretch');
  });

  it('does not apply alignment class when align is not set', () => {
    render(<Stack>No align</Stack>);
    const className = screen.getByText('No align').className;
    expect(className).not.toContain('items-');
  });

  it('applies justify classes', () => {
    render(<Stack justify="center">J-center</Stack>);
    expect(screen.getByText('J-center').className).toContain('justify-center');

    render(<Stack justify="between">J-between</Stack>);
    expect(screen.getByText('J-between').className).toContain('justify-between');

    render(<Stack justify="around">J-around</Stack>);
    expect(screen.getByText('J-around').className).toContain('justify-around');

    render(<Stack justify="start">J-start</Stack>);
    expect(screen.getByText('J-start').className).toContain('justify-start');

    render(<Stack justify="end">J-end</Stack>);
    expect(screen.getByText('J-end').className).toContain('justify-end');
  });

  it('does not apply justify class when justify is not set', () => {
    render(<Stack>No justify</Stack>);
    const className = screen.getByText('No justify').className;
    expect(className).not.toContain('justify-');
  });

  it('does not wrap by default', () => {
    render(<Stack>No wrap</Stack>);
    expect(screen.getByText('No wrap').className).not.toContain('flex-wrap');
  });

  it('applies flex-wrap when wrap is true', () => {
    render(<Stack wrap>Wrapping</Stack>);
    expect(screen.getByText('Wrapping').className).toContain('flex-wrap');
  });

  it('renders as nav when as="nav"', () => {
    render(<Stack as="nav">Navigation</Stack>);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders as ul when as="ul"', () => {
    render(<Stack as="ul">List</Stack>);
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('renders as section when as="section"', () => {
    render(<Stack as="section">Section</Stack>);
    const el = screen.getByText('Section');
    expect(el.tagName).toBe('SECTION');
  });

  it('merges custom className', () => {
    render(<Stack className="stack-custom">Styled</Stack>);
    const el = screen.getByText('Styled');
    expect(el.className).toContain('stack-custom');
    expect(el.className).toContain('flex');
  });

  it('combines direction, gap, align, justify, and wrap', () => {
    render(
      <Stack direction="horizontal" gap="6" align="center" justify="between" wrap>
        Full combo
      </Stack>,
    );
    const className = screen.getByText('Full combo').className;
    expect(className).toContain('flex');
    expect(className).toContain('flex-row');
    expect(className).toContain('gap-6');
    expect(className).toContain('items-center');
    expect(className).toContain('justify-between');
    expect(className).toContain('flex-wrap');
  });
});
