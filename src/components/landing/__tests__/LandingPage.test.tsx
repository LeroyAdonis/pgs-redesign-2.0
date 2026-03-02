import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

/**
 * Mock next-intl — returns the key as the rendered text.
 * For namespaced calls like useTranslations('landing.pricing'),
 * the returned function strips the namespace prefix.
 */
vi.mock('next-intl', () => ({
  useTranslations:
    (namespace?: string) =>
    (key: string) => {
      // Return a predictable string based on the full key path
      const fullKey = namespace ? `${namespace}.${key}` : key;

      // Map specific keys to realistic values for assertions
      const translations: Record<string, string> = {
        // Navbar
        'landing.navbar.features': 'Features',
        'landing.navbar.process': 'Process',
        'landing.navbar.stories': 'Stories',
        'landing.navbar.membership': 'Membership',
        'landing.navbar.login': 'Log In',
        'landing.navbar.getStarted': 'Get Started',
        'landing.navbar.openMenu': 'Open menu',
        'landing.navbar.closeMenu': 'Close menu',
        // Hero
        'landing.hero.label': 'Made on the Scene',
        'landing.hero.titleLine1': 'LIQUID',
        'landing.hero.titleLine2': 'INTELLIGENCE',
        'landing.hero.description': 'The definitive AI social manager',
        'landing.hero.startCreating': 'Start Creating',
        'landing.hero.watchDemo': 'Watch demo',
        'landing.hero.poweredBy': 'Powered by',
        'landing.hero.poweredByLink': 'PurpleGlow v2.0',
        'landing.hero.statsDescription': 'Powering the next generation',
        'landing.hero.statsLanguages': '11+',
        'landing.hero.statsLanguagesLabel': 'Languages',
        'landing.hero.statsOnline': '24/7',
        'landing.hero.statsOnlineLabel': 'Online',
        'landing.hero.badgeLabel': 'Generated with Magic +',
        'landing.hero.badgePersona': 'The Curator',
        // Marquee
        'landing.marquee.liquidIntelligence': 'Liquid Intelligence',
        'landing.marquee.automatedCreativity': 'Automated Creativity',
        'landing.marquee.editorialStandards': 'Editorial Standards',
        'landing.marquee.masterCreators': 'Master Creators',
        // Features
        'landing.features.titleThe': 'The',
        'landing.features.titleEdition': 'Edition',
        'landing.features.label': 'Curated Tools for Growth',
        'landing.features.engine.label': 'Our Branding',
        'landing.features.engine.title': 'Conversational Engine',
        'landing.features.engine.description': 'An AI that speaks your language',
        'landing.features.multilingual.label': 'Our Building',
        'landing.features.multilingual.title': 'Multilingual Core',
        'landing.features.multilingual.description': 'Seamless translation across 11 languages',
        'landing.features.scheduling.label': 'Our Operating',
        'landing.features.scheduling.title': 'Smart Scheduling',
        'landing.features.scheduling.description': 'Predictive algorithms',
        // Process
        'landing.process.label': 'Our Features Only',
        'landing.process.titlePrefix': 'From Chaos to',
        'landing.process.titleHighlight': 'Order',
        'landing.process.connect.title': 'Connect',
        'landing.process.connect.description': 'Link your social profiles',
        'landing.process.generate.title': 'Generate',
        'landing.process.generate.description': 'Send a topic',
        'landing.process.publish.title': 'Publish',
        'landing.process.publish.description': 'Preview, refine, and schedule',
        // Testimonials
        'landing.testimonials.titlePrefix': 'Voice of the',
        'landing.testimonials.titleHighlight': 'Industry',
        'landing.testimonials.thabo.quote': 'Finally, a tool that understands',
        'landing.testimonials.thabo.name': 'Thabo M.',
        'landing.testimonials.thabo.role': 'Digital Strategist, JHB',
        'landing.testimonials.zanele.quote': 'The multilingual support',
        'landing.testimonials.zanele.name': 'Zanele K.',
        'landing.testimonials.zanele.role': 'Content Creator, DBN',
        'landing.testimonials.pieter.quote': 'It doubled my output',
        'landing.testimonials.pieter.name': 'Pieter S.',
        'landing.testimonials.pieter.role': 'Agency Owner, CPT',
        // Pricing
        'landing.pricing.title': 'Membership',
        'landing.pricing.titleHighlight': 'Tiers',
        'landing.pricing.monthly': 'Monthly',
        'landing.pricing.annually': 'Annually',
        'landing.pricing.selectPlan': 'Select Plan',
        'landing.pricing.joinNow': 'Join Now',
        'landing.pricing.contactSales': 'Contact Sales',
        'landing.pricing.preferred': 'PREFERRED',
        'landing.pricing.period': '/mo',
        'landing.pricing.periodAnnual': '/yr',
        'landing.pricing.hustle.name': 'The Hustle',
        'landing.pricing.hustle.price': '0',
        'landing.pricing.hustle.priceAnnual': '0',
        'landing.pricing.hustle.feature1': '3 AI Posts',
        'landing.pricing.hustle.feature2': '1 Profile',
        'landing.pricing.hustle.feature3': 'Basic Analytics',
        'landing.pricing.creator.name': 'The Creator',
        'landing.pricing.creator.price': '299',
        'landing.pricing.creator.priceAnnual': '2,990',
        'landing.pricing.creator.feature1': 'Unlimited Text',
        'landing.pricing.creator.feature2': '50 Image Credits',
        'landing.pricing.creator.feature3': '5 Social Profiles',
        'landing.pricing.creator.feature4': 'Translation Engine',
        'landing.pricing.mogul.name': 'The Mogul',
        'landing.pricing.mogul.price': '999',
        'landing.pricing.mogul.priceAnnual': '9,990',
        'landing.pricing.mogul.feature1': 'Everything in Creator',
        'landing.pricing.mogul.feature2': '200 Image/Video Credits',
        'landing.pricing.mogul.feature3': 'Unlimited Profiles',
        'landing.pricing.mogul.feature4': 'Team Seats (5)',
        // Credits
        'landing.credits.label': 'Powered by Purple',
        'landing.credits.title': 'Need more ammunition?',
        'landing.credits.description': 'Top up your creative credits',
        'landing.credits.buyStill': 'Buy Still Credits',
        'landing.credits.buyVideo': 'Buy Video Pack',
        'landing.credits.checkoutLabel': 'Checkout',
        'landing.credits.buyCredits': 'Buy Credits',
        'landing.credits.smallAmount': '100 Credits',
        'landing.credits.smallPrice': 'R150.00',
        'landing.credits.largeAmount': '500 Credits',
        'landing.credits.largePrice': 'R650.00',
        // Contact
        'landing.contact.titlePrefix': 'Make',
        'landing.contact.titleHighlight': 'Contact',
        'landing.contact.name': 'Name',
        'landing.contact.email': 'Email',
        'landing.contact.message': 'Message',
        'landing.contact.sendMessage': 'Send Message',
        // Footer
        'landing.footer.brandDescription': 'Liquid Intelligence for modern creators',
        'landing.footer.sitemap': 'Sitemap',
        'landing.footer.mediaWorks': 'Media/Works',
        'landing.footer.login': 'Login',
        'landing.footer.docs': 'Documentation',
        'landing.footer.featuresCol': 'Features',
        'landing.footer.aiContent': 'AI Content',
        'landing.footer.scheduling': 'Scheduling',
        'landing.footer.analytics': 'Analytics',
        'landing.footer.legal': 'Legal/EAF',
        'landing.footer.privacyPolicy': 'Privacy Policy',
        'landing.footer.termsOfService': 'Terms of Service',
        'landing.footer.fairPractices': 'Fair Practices',
        'landing.footer.social': 'Social',
        'landing.footer.copyright': '© 2024 Purple Glow Technologies. All Rights Reserved.',
        'landing.footer.basedIn': 'Based in Cape Town',
      };

      return translations[fullKey] ?? fullKey;
    },
}));

/**
 * Mock @/i18n/navigation — renders <a> tags for the locale-aware Link component.
 */
vi.mock('@/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Import components after mocking
import { LandingNavbar } from '../LandingNavbar';
import { HeroSection } from '../HeroSection';
import { FeaturesSection } from '../FeaturesSection';
import { ProcessSection } from '../ProcessSection';
import { TestimonialsSection } from '../TestimonialsSection';
import { PricingSection } from '../PricingSection';
import { CreditsSection } from '../CreditsSection';
import { ContactSection } from '../ContactSection';
import { LandingFooter } from '../LandingFooter';
import { MarqueeSection } from '../MarqueeSection';

describe('Landing Page — LandingNavbar', () => {
  it('renders the logo', () => {
    render(<LandingNavbar />);
    expect(screen.getAllByText('Purple Glow').length).toBeGreaterThan(0);
  });

  it('renders desktop and mobile navigation links', () => {
    render(<LandingNavbar />);
    // Each link appears in both desktop nav and mobile menu
    expect(screen.getAllByText('Features').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Process').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Stories').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Membership').length).toBeGreaterThanOrEqual(2);
  });

  it('renders Get Started CTA', () => {
    render(<LandingNavbar />);
    const ctaLinks = screen.getAllByText('Get Started');
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Landing Page — HeroSection', () => {
  it('renders the hero title', () => {
    render(<HeroSection />);
    expect(screen.getByText('LIQUID')).toBeInTheDocument();
    expect(screen.getByText('INTELLIGENCE')).toBeInTheDocument();
  });

  it('renders the hero description', () => {
    render(<HeroSection />);
    expect(screen.getByText('The definitive AI social manager')).toBeInTheDocument();
  });

  it('renders stats bar with language count and online status', () => {
    render(<HeroSection />);
    expect(screen.getByText('11+')).toBeInTheDocument();
    expect(screen.getByText('Languages')).toBeInTheDocument();
    expect(screen.getByText('24/7')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders Start Creating CTA', () => {
    render(<HeroSection />);
    expect(screen.getByText('Start Creating')).toBeInTheDocument();
  });
});

describe('Landing Page — MarqueeSection', () => {
  it('renders marquee text items', () => {
    render(<MarqueeSection />);
    expect(screen.getAllByText('Liquid Intelligence').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Automated Creativity').length).toBeGreaterThan(0);
  });
});

describe('Landing Page — FeaturesSection', () => {
  it('renders section title', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('Edition')).toBeInTheDocument();
  });

  it('renders all three feature cards', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('Conversational Engine')).toBeInTheDocument();
    expect(screen.getByText('Multilingual Core')).toBeInTheDocument();
    expect(screen.getByText('Smart Scheduling')).toBeInTheDocument();
  });
});

describe('Landing Page — ProcessSection', () => {
  it('renders section title', () => {
    render(<ProcessSection />);
    expect(screen.getByText('Order')).toBeInTheDocument();
  });

  it('renders all three steps', () => {
    render(<ProcessSection />);
    expect(screen.getByText('Connect')).toBeInTheDocument();
    expect(screen.getByText('Generate')).toBeInTheDocument();
    expect(screen.getByText('Publish')).toBeInTheDocument();
  });
});

describe('Landing Page — TestimonialsSection', () => {
  it('renders SA testimonials', () => {
    render(<TestimonialsSection />);
    expect(screen.getByText('Thabo M.')).toBeInTheDocument();
    expect(screen.getByText('Zanele K.')).toBeInTheDocument();
    expect(screen.getByText('Pieter S.')).toBeInTheDocument();
  });

  it('renders SA city abbreviations', () => {
    render(<TestimonialsSection />);
    expect(screen.getByText('Digital Strategist, JHB')).toBeInTheDocument();
    expect(screen.getByText('Content Creator, DBN')).toBeInTheDocument();
    expect(screen.getByText('Agency Owner, CPT')).toBeInTheDocument();
  });
});

describe('Landing Page — PricingSection', () => {
  it('renders all three pricing tiers', () => {
    render(<PricingSection />);
    expect(screen.getByText('The Hustle')).toBeInTheDocument();
    expect(screen.getByText('The Creator')).toBeInTheDocument();
    expect(screen.getByText('The Mogul')).toBeInTheDocument();
  });

  it('shows correct ZAR amounts for monthly pricing', () => {
    render(<PricingSection />);

    const hustlePrice = screen.getByTestId('price-hustle');
    expect(hustlePrice).toHaveTextContent('R');
    expect(hustlePrice).toHaveTextContent('0');
    expect(hustlePrice).toHaveTextContent('/mo');

    const creatorPrice = screen.getByTestId('price-creator');
    expect(creatorPrice).toHaveTextContent('R');
    expect(creatorPrice).toHaveTextContent('299');

    const mogulPrice = screen.getByTestId('price-mogul');
    expect(mogulPrice).toHaveTextContent('R');
    expect(mogulPrice).toHaveTextContent('999');
  });

  it('shows PREFERRED badge on Creator tier', () => {
    render(<PricingSection />);
    expect(screen.getByText('PREFERRED')).toBeInTheDocument();
  });

  it('toggles between monthly and annual pricing', async () => {
    const user = userEvent.setup();
    render(<PricingSection />);

    // Initially shows monthly
    const creatorPrice = screen.getByTestId('price-creator');
    expect(creatorPrice).toHaveTextContent('299');
    expect(creatorPrice).toHaveTextContent('/mo');

    // Click Annual
    await user.click(screen.getByText('Annually'));

    expect(creatorPrice).toHaveTextContent('2,990');
    expect(creatorPrice).toHaveTextContent('/yr');
  });

  it('renders pricing feature lists', () => {
    render(<PricingSection />);
    expect(screen.getByText('3 AI Posts')).toBeInTheDocument();
    expect(screen.getByText('Unlimited Text')).toBeInTheDocument();
    expect(screen.getByText('50 Image Credits')).toBeInTheDocument();
    expect(screen.getByText('Team Seats (5)')).toBeInTheDocument();
  });
});

describe('Landing Page — CreditsSection', () => {
  it('renders credit pack prices in ZAR', () => {
    render(<CreditsSection />);
    expect(screen.getByTestId('credit-price-small')).toHaveTextContent('R150.00');
    expect(screen.getByTestId('credit-price-large')).toHaveTextContent('R650.00');
  });

  it('renders credit amounts', () => {
    render(<CreditsSection />);
    expect(screen.getByText('100 Credits')).toBeInTheDocument();
    expect(screen.getByText('500 Credits')).toBeInTheDocument();
  });
});

describe('Landing Page — ContactSection', () => {
  it('renders the contact form', () => {
    render(<ContactSection />);
    expect(screen.getByText('Send Message')).toBeInTheDocument();
  });
});

describe('Landing Page — LandingFooter', () => {
  it('renders the footer with copyright', () => {
    render(<LandingFooter />);
    expect(screen.getByText('© 2024 Purple Glow Technologies. All Rights Reserved.')).toBeInTheDocument();
  });

  it('renders footer column headings', () => {
    render(<LandingFooter />);
    expect(screen.getByText('Sitemap')).toBeInTheDocument();
    expect(screen.getByText('Legal/EAF')).toBeInTheDocument();
    expect(screen.getByText('Social')).toBeInTheDocument();
  });

  it('renders footer links', () => {
    render(<LandingFooter />);
    expect(screen.getAllByText('Privacy Policy').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Terms of Service').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('AI Content')).toBeInTheDocument();
    expect(screen.getByText('Documentation')).toBeInTheDocument();
  });

  it('links legal pages to correct routes', () => {
    render(<LandingFooter />);
    const privacyLinks = screen.getAllByText('Privacy Policy');
    expect(privacyLinks[0].closest('a')).toHaveAttribute('href', '/legal/privacy');

    const termsLinks = screen.getAllByText('Terms of Service');
    expect(termsLinks[0].closest('a')).toHaveAttribute('href', '/legal/terms');

    const fairLink = screen.getByText('Fair Practices');
    expect(fairLink.closest('a')).toHaveAttribute('href', '/legal/paia');
  });

  it('links feature items to docs pages', () => {
    render(<LandingFooter />);
    const aiLink = screen.getByText('AI Content');
    expect(aiLink.closest('a')).toHaveAttribute('href', '/docs/ai-content');

    const schedLink = screen.getByText('Scheduling');
    expect(schedLink.closest('a')).toHaveAttribute('href', '/docs/scheduling');
  });
});
