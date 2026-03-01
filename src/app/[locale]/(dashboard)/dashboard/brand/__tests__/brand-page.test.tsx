/**
 * Tests for brand profile page components
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next-intl/server', () => ({
  setRequestLocale: () => undefined,
}));

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// ── Import components after mocks ───────────────────────────────

import { ToneSliders } from '../_components/ToneSliders';
import { VocabularyCloud } from '../_components/VocabularyCloud';
import { HashtagManager } from '../_components/HashtagManager';
import { PostingCadenceChart } from '../_components/PostingCadenceChart';
import { EmojiGallery } from '../_components/EmojiGallery';
import { ContentStats } from '../_components/ContentStats';
import { SACulturalBadge } from '../_components/SACulturalBadge';
import { EmptyState } from '../_components/EmptyState';

// ── ToneSliders ─────────────────────────────────────────────────

describe('ToneSliders', () => {
  const defaultTone = {
    formal: 0.3,
    casual: 0.7,
    humorous: 0.4,
    professional: 0.6,
    inspirational: 0.5,
    educational: 0.35,
  };

  it('renders all 6 tone sliders', () => {
    const onChange = vi.fn();
    render(<ToneSliders tone={defaultTone} onChange={onChange} />);

    expect(screen.getByLabelText(/formality/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/casualness/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/humor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/professionalism/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/inspiration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/educational/i)).toBeInTheDocument();
  });

  it('shows percentage values', () => {
    const onChange = vi.fn();
    render(<ToneSliders tone={defaultTone} onChange={onChange} />);

    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  it('renders range inputs with correct values', () => {
    const onChange = vi.fn();
    render(<ToneSliders tone={defaultTone} onChange={onChange} />);

    const formalSlider = screen.getByLabelText(/formality/i) as HTMLInputElement;
    expect(formalSlider.value).toBe('30');
  });
});

// ── VocabularyCloud ─────────────────────────────────────────────

describe('VocabularyCloud', () => {
  it('renders vocabulary clusters', () => {
    const clusters = [
      { category: 'business', words: ['brand', 'customer'], frequency: 10 },
      { category: 'lifestyle', words: ['coffee', 'food'], frequency: 5 },
    ];
    render(<VocabularyCloud clusters={clusters} />);

    expect(screen.getByText('business')).toBeInTheDocument();
    expect(screen.getByText('lifestyle')).toBeInTheDocument();
    expect(screen.getByText('brand')).toBeInTheDocument();
    expect(screen.getByText('customer')).toBeInTheDocument();
  });

  it('shows empty state when no clusters', () => {
    render(<VocabularyCloud clusters={[]} />);
    expect(screen.getByText(/no vocabulary data/i)).toBeInTheDocument();
  });

  it('shows frequency counts', () => {
    const clusters = [
      { category: 'business', words: ['brand'], frequency: 42 },
    ];
    render(<VocabularyCloud clusters={clusters} />);
    expect(screen.getByText('42 uses')).toBeInTheDocument();
  });
});

// ── HashtagManager ──────────────────────────────────────────────

describe('HashtagManager', () => {
  const defaultPatterns = [
    { hashtag: '#Mzansi', frequency: 10, category: 'south_african' },
    { hashtag: '#Business', frequency: 5, category: 'business' },
  ];

  it('renders hashtag patterns', () => {
    render(
      <HashtagManager
        patterns={defaultPatterns}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText('#Mzansi')).toBeInTheDocument();
    expect(screen.getByText('#Business')).toBeInTheDocument();
  });

  it('shows SA indicator for SA hashtags', () => {
    render(
      <HashtagManager
        patterns={defaultPatterns}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    // SA hashtags should have the 🇿🇦 indicator
    expect(screen.getByLabelText('South African hashtag')).toBeInTheDocument();
  });

  it('has an input for adding new hashtags', () => {
    render(
      <HashtagManager
        patterns={defaultPatterns}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Add new hashtag')).toBeInTheDocument();
  });

  it('calls onAdd when adding a hashtag', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();

    render(
      <HashtagManager
        patterns={defaultPatterns}
        onAdd={onAdd}
        onRemove={vi.fn()}
      />,
    );

    const input = screen.getByLabelText('Add new hashtag');
    await user.type(input, 'NewTag{enter}');

    expect(onAdd).toHaveBeenCalledWith('#NewTag', expect.any(String));
  });

  it('calls onRemove when remove button is clicked', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    render(
      <HashtagManager
        patterns={defaultPatterns}
        onAdd={vi.fn()}
        onRemove={onRemove}
      />,
    );

    const removeButtons = screen.getAllByLabelText(/remove/i);
    await user.click(removeButtons[0]);

    expect(onRemove).toHaveBeenCalled();
  });

  it('shows empty state when no patterns', () => {
    render(
      <HashtagManager
        patterns={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText(/no hashtags yet/i)).toBeInTheDocument();
  });
});

// ── PostingCadenceChart ─────────────────────────────────────────

describe('PostingCadenceChart', () => {
  const cadence = { dayOfWeek: 2, hourOfDay: 10, postsPerWeek: 4.5 };

  it('shows posts per week', () => {
    render(<PostingCadenceChart cadence={cadence} />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('Posts/Week')).toBeInTheDocument();
  });

  it('shows best day', () => {
    render(<PostingCadenceChart cadence={cadence} />);
    // 'Tue' appears in both the stats box and the heatmap
    expect(screen.getAllByText('Tue').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Best Day')).toBeInTheDocument();
  });

  it('shows best time', () => {
    render(<PostingCadenceChart cadence={cadence} />);
    expect(screen.getByText('10 AM')).toBeInTheDocument();
  });

  it('renders day-of-week indicators', () => {
    render(<PostingCadenceChart cadence={cadence} />);
    // All 7 days should be rendered
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });
});

// ── EmojiGallery ────────────────────────────────────────────────

describe('EmojiGallery', () => {
  it('renders emoji items', () => {
    const emojis = [
      { emoji: '🔥', frequency: 10 },
      { emoji: '❤️', frequency: 5 },
    ];
    render(<EmojiGallery emojis={emojis} />);
    expect(screen.getByText('🔥')).toBeInTheDocument();
    expect(screen.getByText('❤️')).toBeInTheDocument();
  });

  it('shows frequency counts', () => {
    const emojis = [{ emoji: '🔥', frequency: 10 }];
    render(<EmojiGallery emojis={emojis} />);
    expect(screen.getByText('10×')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    render(<EmojiGallery emojis={[]} />);
    expect(screen.getByText(/no emoji usage/i)).toBeInTheDocument();
  });
});

// ── ContentStats ────────────────────────────────────────────────

describe('ContentStats', () => {
  const visualStyle = {
    colorPalette: ['#8b5cf6', '#f472b6'],
    filterPreferences: ['none', 'clarendon'],
    imageTypes: ['image', 'video'],
  };

  it('shows average content length', () => {
    render(
      <ContentStats avgContentLength={185} visualStyle={visualStyle} />,
    );
    expect(screen.getByText('185')).toBeInTheDocument();
    expect(screen.getByText(/characters per post/i)).toBeInTheDocument();
  });

  it('shows color palette hex codes', () => {
    render(
      <ContentStats avgContentLength={185} visualStyle={visualStyle} />,
    );
    expect(screen.getByText('#8b5cf6')).toBeInTheDocument();
    expect(screen.getByText('#f472b6')).toBeInTheDocument();
  });

  it('shows media types', () => {
    render(
      <ContentStats avgContentLength={185} visualStyle={visualStyle} />,
    );
    expect(screen.getByText('image')).toBeInTheDocument();
    expect(screen.getByText('video')).toBeInTheDocument();
  });

  it('shows filter preferences', () => {
    render(
      <ContentStats avgContentLength={185} visualStyle={visualStyle} />,
    );
    expect(screen.getByText('none')).toBeInTheDocument();
    expect(screen.getByText('clarendon')).toBeInTheDocument();
  });
});

// ── SACulturalBadge ─────────────────────────────────────────────

describe('SACulturalBadge', () => {
  it('shows "Proudly SA" for high score', () => {
    render(<SACulturalBadge score={0.85} />);
    expect(screen.getByText('Proudly SA')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('shows "SA Aware" for medium score', () => {
    render(<SACulturalBadge score={0.55} />);
    expect(screen.getByText('SA Aware')).toBeInTheDocument();
  });

  it('shows "Getting There" for low-medium score', () => {
    render(<SACulturalBadge score={0.3} />);
    expect(screen.getByText('Getting There')).toBeInTheDocument();
  });

  it('shows "Go Local!" for low score', () => {
    render(<SACulturalBadge score={0.1} />);
    expect(screen.getByText('Go Local!')).toBeInTheDocument();
  });
});

// ── EmptyState ──────────────────────────────────────────────────

describe('EmptyState', () => {
  it('shows the empty state message', () => {
    render(<EmptyState />);
    expect(screen.getByText(/no brand profile yet/i)).toBeInTheDocument();
  });

  it('has a CTA to link accounts', () => {
    render(<EmptyState />);
    const link = screen.getByRole('link', { name: /link social accounts/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/accounts');
  });
});
