import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ScrollReveal } from '../ScrollReveal';

/**
 * Mock IntersectionObserver for JSDOM.
 * Stores callback references so tests can trigger intersection manually.
 */
type MockObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

let observerCallback: MockObserverCallback;
let observerOptions: IntersectionObserverInit | undefined;
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  // Use a proper class so `new IntersectionObserver(...)` works in JSDOM
  class MockIntersectionObserver {
    constructor(callback: MockObserverCallback, options?: IntersectionObserverInit) {
      observerCallback = callback;
      observerOptions = options;
    }
    observe = mockObserve;
    unobserve = mockUnobserve;
    disconnect = mockDisconnect;
  }

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

  // Mock matchMedia to return prefers-reduced-motion: false
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
});

afterEach(() => {
  vi.restoreAllMocks();
  mockObserve.mockClear();
  mockUnobserve.mockClear();
  mockDisconnect.mockClear();
});

describe('ScrollReveal', () => {
  it('renders children', () => {
    render(
      <ScrollReveal>
        <p>Hello World</p>
      </ScrollReveal>,
    );
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('starts with hidden classes (opacity-0 + translate offset)', () => {
    render(
      <ScrollReveal>
        <p>Content</p>
      </ScrollReveal>,
    );
    const wrapper = screen.getByText('Content').parentElement!;
    // Component starts with entered=false → opacity-0 + translate-y-8 (default up)
    expect(wrapper.className).toContain('opacity-0');
    expect(wrapper.className).toContain('translate-y-8');
  });

  it('applies visible classes when intersection is triggered', () => {
    render(
      <ScrollReveal>
        <p>Content</p>
      </ScrollReveal>,
    );

    // Simulate element entering viewport
    act(() => {
      observerCallback([{ isIntersecting: true } as Partial<IntersectionObserverEntry>]);
    });

    const wrapper = screen.getByText('Content').parentElement!;
    expect(wrapper.className).toContain('opacity-100');
    expect(wrapper.className).toContain('translate-y-0');
    expect(wrapper.className).not.toContain('opacity-0');
  });

  it('unobserves element after first intersection (fire once)', () => {
    render(
      <ScrollReveal>
        <p>Content</p>
      </ScrollReveal>,
    );

    act(() => {
      observerCallback([{ isIntersecting: true } as Partial<IntersectionObserverEntry>]);
    });

    expect(mockUnobserve).toHaveBeenCalledTimes(1);
  });

  it('does not reveal when element is not intersecting', () => {
    render(
      <ScrollReveal>
        <p>Content</p>
      </ScrollReveal>,
    );

    act(() => {
      observerCallback([{ isIntersecting: false } as Partial<IntersectionObserverEntry>]);
    });

    const wrapper = screen.getByText('Content').parentElement!;
    expect(wrapper.className).toContain('opacity-0');
  });

  it('applies transition delay when delay prop is set and visible', () => {
    render(
      <ScrollReveal delay={200}>
        <p>Delayed</p>
      </ScrollReveal>,
    );

    // Before intersection — hidden and no transition delay
    const wrapper = screen.getByText('Delayed').parentElement!;
    expect(wrapper.style.transitionDelay).toBe('');

    act(() => {
      observerCallback([{ isIntersecting: true } as Partial<IntersectionObserverEntry>]);
    });

    expect(wrapper.style.transitionDelay).toBe('200ms');
  });

  it('does not set transition delay when delay is 0', () => {
    render(
      <ScrollReveal delay={0}>
        <p>No delay</p>
      </ScrollReveal>,
    );

    act(() => {
      observerCallback([{ isIntersecting: true } as Partial<IntersectionObserverEntry>]);
    });

    const wrapper = screen.getByText('No delay').parentElement!;
    expect(wrapper.style.transitionDelay).toBe('');
  });

  it('supports direction="left" — initial offset is -translate-x-8', () => {
    render(
      <ScrollReveal direction="left">
        <p>Left</p>
      </ScrollReveal>,
    );

    const wrapper = screen.getByText('Left').parentElement!;
    expect(wrapper.className).toContain('-translate-x-8');

    act(() => {
      observerCallback([{ isIntersecting: true } as Partial<IntersectionObserverEntry>]);
    });

    expect(wrapper.className).toContain('translate-x-0');
  });

  it('supports direction="right" — initial offset is translate-x-8', () => {
    render(
      <ScrollReveal direction="right">
        <p>Right</p>
      </ScrollReveal>,
    );

    const wrapper = screen.getByText('Right').parentElement!;
    expect(wrapper.className).toContain('translate-x-8');

    act(() => {
      observerCallback([{ isIntersecting: true } as Partial<IntersectionObserverEntry>]);
    });

    expect(wrapper.className).toContain('translate-x-0');
  });

  it('applies custom className', () => {
    render(
      <ScrollReveal className="my-custom-class">
        <p>Styled</p>
      </ScrollReveal>,
    );

    const wrapper = screen.getByText('Styled').parentElement!;
    expect(wrapper.className).toContain('my-custom-class');
  });

  it('uses correct IntersectionObserver options', () => {
    render(
      <ScrollReveal>
        <p>Options</p>
      </ScrollReveal>,
    );

    expect(observerOptions).toEqual({
      threshold: 0.05,
      rootMargin: '0px 0px 100px 0px',
    });
  });

  it('immediately reveals for reduced-motion users', () => {
    // Override matchMedia to prefer reduced motion
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));

    render(
      <ScrollReveal>
        <p>Accessible</p>
      </ScrollReveal>,
    );

    const wrapper = screen.getByText('Accessible').parentElement!;
    expect(wrapper.className).toContain('opacity-100');
    expect(wrapper.className).not.toContain('opacity-0');
    // Observer should not have been set up
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it('disconnects observer on unmount', () => {
    const disconnectsBefore = mockDisconnect.mock.calls.length;
    const { unmount } = render(
      <ScrollReveal>
        <p>Cleanup</p>
      </ScrollReveal>,
    );

    unmount();
    // At least one new disconnect call from unmount cleanup
    expect(mockDisconnect.mock.calls.length).toBeGreaterThan(disconnectsBefore);
  });
});
