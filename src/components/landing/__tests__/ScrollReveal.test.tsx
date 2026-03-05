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

/**
 * Mock getBoundingClientRect to simulate an element that is below the fold.
 * In JSDOM all rects default to zeroes (i.e. inside the viewport), which
 * means the layout effect exits early and never sets up the observer. Call
 * this helper in any test that needs the below-fold + observer path.
 */
function mockElementBelowFold() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 2000,
    bottom: 2100,
    left: 0,
    right: 0,
    width: 0,
    height: 100,
    x: 0,
    y: 2000,
    toJSON: () => ({}),
  } as DOMRect);
}

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

  it('starts visible when element is in the viewport (progressive-enhancement default)', () => {
    // JSDOM returns rect.top = 0 by default — i.e. in-viewport.
    // The component must render visible without any JS interaction so that
    // SSR output and screenshots always show content.
    render(
      <ScrollReveal>
        <p>Content</p>
      </ScrollReveal>,
    );
    const wrapper = screen.getByText('Content').parentElement!;
    expect(wrapper.className).toContain('opacity-100');
    expect(wrapper.className).not.toContain('opacity-0');
  });

  it('starts with hidden classes when element is below the fold', () => {
    // Simulate the element being far below the viewport.
    mockElementBelowFold();

    render(
      <ScrollReveal>
        <p>Content</p>
      </ScrollReveal>,
    );
    const wrapper = screen.getByText('Content').parentElement!;
    expect(wrapper.className).toContain('opacity-0');
    expect(wrapper.className).toContain('translate-y-6');
  });

  it('applies visible classes when intersection is triggered', () => {
    mockElementBelowFold();

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
    mockElementBelowFold();

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
    mockElementBelowFold();

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
    mockElementBelowFold();

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
    mockElementBelowFold();

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

  it('supports direction="left"', () => {
    mockElementBelowFold();

    render(
      <ScrollReveal direction="left">
        <p>Left</p>
      </ScrollReveal>,
    );

    const wrapper = screen.getByText('Left').parentElement!;
    expect(wrapper.className).toContain('translate-x-6');

    act(() => {
      observerCallback([{ isIntersecting: true } as Partial<IntersectionObserverEntry>]);
    });

    expect(wrapper.className).toContain('translate-x-0');
  });

  it('supports direction="right"', () => {
    mockElementBelowFold();

    render(
      <ScrollReveal direction="right">
        <p>Right</p>
      </ScrollReveal>,
    );

    const wrapper = screen.getByText('Right').parentElement!;
    expect(wrapper.className).toContain('-translate-x-6');

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

  it('uses correct observer options for below-fold elements', () => {
    mockElementBelowFold();

    render(
      <ScrollReveal>
        <p>Options</p>
      </ScrollReveal>,
    );

    expect(observerOptions).toEqual({
      rootMargin: '-50px',
      threshold: 0.1,
    });
  });

  it('does not set up observer for in-viewport elements', () => {
    // JSDOM default: rect.top = 0 → in viewport → observer should never be created.
    render(
      <ScrollReveal>
        <p>In viewport</p>
      </ScrollReveal>,
    );

    // mockObserve should NOT have been called because there was nothing to observe.
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it('disconnects observer on unmount', () => {
    mockElementBelowFold();

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
