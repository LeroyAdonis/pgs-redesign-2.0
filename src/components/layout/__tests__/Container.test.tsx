import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Container } from '@/components/layout/Container';

describe('Container', () => {
  it('renders children', () => {
    render(<Container>Hello world</Container>);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders as a div by default', () => {
    render(<Container>Content</Container>);
    const el = screen.getByText('Content');
    expect(el.tagName).toBe('DIV');
  });

  it('applies standard max-width by default', () => {
    render(<Container>Content</Container>);
    const el = screen.getByText('Content');
    expect(el.className).toContain('max-w-[1100px]');
  });

  it('applies prose max-width', () => {
    render(<Container size="prose">Prose</Container>);
    const el = screen.getByText('Prose');
    expect(el.className).toContain('max-w-[640px]');
  });

  it('applies wide max-width', () => {
    render(<Container size="wide">Wide</Container>);
    const el = screen.getByText('Wide');
    expect(el.className).toContain('max-w-[1400px]');
  });

  it('applies full max-width', () => {
    render(<Container size="full">Full</Container>);
    const el = screen.getByText('Full');
    expect(el.className).toContain('max-w-full');
  });

  it('includes horizontal padding and centering', () => {
    render(<Container>Padded</Container>);
    const el = screen.getByText('Padded');
    expect(el.className).toContain('mx-auto');
    expect(el.className).toContain('w-full');
    expect(el.className).toContain('px-4');
  });

  it('renders as a section when as="section"', () => {
    render(<Container as="section">Section</Container>);
    const el = screen.getByText('Section');
    expect(el.tagName).toBe('SECTION');
  });

  it('renders as main when as="main"', () => {
    render(<Container as="main">Main</Container>);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders as article when as="article"', () => {
    render(<Container as="article">Article</Container>);
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('merges custom className', () => {
    render(<Container className="my-custom">Styled</Container>);
    const el = screen.getByText('Styled');
    expect(el.className).toContain('my-custom');
    // base classes still present
    expect(el.className).toContain('mx-auto');
  });
});
