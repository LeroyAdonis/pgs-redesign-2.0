'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

/**
 * Landing page navbar — sticky with scroll-aware backdrop, mobile menu,
 * and scroll-spy active states via IntersectionObserver.
 *
 * Client component: needs scroll detection + mobile menu state + section tracking.
 * Matches the navbar design from index-v2.html.
 */

const NAV_LINKS = ['features', 'process', 'stories', 'membership'] as const;
type NavSection = (typeof NAV_LINKS)[number];

export function LandingNavbar() {
  const t = useTranslations('landing.navbar');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<NavSection | null>(null);

  // Track which sections are visible; pick the topmost one
  const visibleSections = useRef<Map<NavSection, IntersectionObserverEntry>>(new Map());

  // Scroll-aware backdrop
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 40);
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver scroll-spy
  useEffect(() => {
    const sections = NAV_LINKS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id as NavSection;
          if (entry.isIntersecting) {
            visibleSections.current.set(id, entry);
          } else {
            visibleSections.current.delete(id);
          }
        }

        // Pick the visible section closest to the top of the viewport
        if (visibleSections.current.size === 0) {
          setActiveSection(null);
          return;
        }

        let topSection: NavSection | null = null;
        let topY = Infinity;
        for (const [id, entry] of visibleSections.current) {
          const distance = Math.abs(entry.target.getBoundingClientRect().top);
          if (distance < topY) {
            topY = distance;
            topSection = id;
          }
        }
        setActiveSection(topSection);
      },
      {
        // Trigger when any part of the section enters the top 60% of viewport.
        // Negative bottom margin ignores the lower 40%.
        rootMargin: '-80px 0px -40% 0px',
        threshold: 0,
      },
    );

    for (const section of sections) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
    document.body.style.overflow = '';
  }, []);

  const openMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  /** Smooth-scroll to a section and set it as active immediately */
  const scrollToSection = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, sectionId: NavSection) => {
      e.preventDefault();
      const target = document.getElementById(sectionId);
      if (!target) return;

      setActiveSection(sectionId);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [],
  );

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-[100] border-b transition-all duration-300',
          isScrolled
            ? 'bg-black/80 backdrop-blur-xl border-white/10'
            : 'bg-transparent border-transparent',
        )}
      >
        <div className="mx-auto max-w-[1240px] px-4 sm:px-8">
          <div className="flex items-center justify-between py-[22px]">
            {/* Logo */}
            <a href="#" className="group flex items-center gap-2.5 text-[13px] font-bold tracking-[2.5px] uppercase text-[#F5F5F7]">
              <span className="w-[3px] h-5 bg-brand rounded-sm transition-all duration-300 group-hover:h-6" />
              Purple Glow
            </a>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-10">
              {NAV_LINKS.map((link) => (
                <a
                  key={link}
                  href={`#${link}`}
                  onClick={(e) => scrollToSection(e, link)}
                  className={cn(
                    'relative text-[11px] font-medium tracking-[2px] uppercase transition-colors duration-300',
                    // Active: bright text + brand underline stays visible
                    activeSection === link
                      ? 'text-[#F5F5F7] after:w-full'
                      : 'text-[#71717A] after:w-0',
                    'hover:text-[#F5F5F7]',
                    // Underline pseudo-element: 2px brand bar
                    'after:content-[""] after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:bg-brand after:transition-all after:duration-400',
                    'hover:after:w-full',
                  )}
                  aria-current={activeSection === link ? 'true' : undefined}
                >
                  {t(link)}
                </a>
              ))}
            </div>

            {/* Desktop actions */}
            <div className="flex items-center gap-6">
              <a
                href="/login"
                className="hidden md:block text-[11px] font-medium tracking-[2px] uppercase text-[#71717A] hover:text-[#F5F5F7] transition-colors duration-300"
              >
                {t('login')}
              </a>
              <a
                href="/signup"
                className="inline-flex items-center justify-center gap-2.5 px-[22px] py-2.5 text-[10px] font-semibold tracking-[1.5px] uppercase bg-brand text-white rounded-[3px] hover:bg-brand-hover hover:-translate-y-0.5 hover:shadow-glow transition-all duration-400"
              >
                {t('getStarted')}
              </a>

              {/* Hamburger (mobile only) */}
              <button
                className="flex md:hidden flex-col justify-between w-7 h-5 cursor-pointer"
                onClick={openMobileMenu}
                aria-label={t('openMenu')}
              >
                <span className="block w-full h-px bg-[#F5F5F7] transition-all duration-400" />
                <span className="block w-full h-px bg-[#F5F5F7] transition-all duration-400" />
                <span className="block w-full h-px bg-[#F5F5F7] transition-all duration-400" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={cn(
          'fixed inset-0 z-[200] bg-[#08080B] flex flex-col transition-[clip-path] duration-600',
          isMobileMenuOpen
            ? '[clip-path:inset(0_0_0_0)]'
            : '[clip-path:inset(0_0_100%_0)]',
        )}
      >
        {/* Mobile menu header */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-[22px]">
          <a href="#" className="flex items-center gap-2.5 text-[13px] font-bold tracking-[2.5px] uppercase text-[#F5F5F7]">
            <span className="w-[3px] h-5 bg-brand rounded-sm" />
            Purple Glow
          </a>
          <button
            className="flex items-center justify-center w-8 h-8 text-2xl text-[#F5F5F7]"
            onClick={closeMobileMenu}
            aria-label={t('closeMenu')}
          >
            ×
          </button>
        </div>

        {/* Mobile nav links */}
        <nav className="flex-1 flex flex-col justify-center px-6 sm:px-16 gap-2">
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              href={`#${link}`}
              onClick={(e) => {
                scrollToSection(e, link);
                closeMobileMenu();
              }}
              className={cn(
                'font-display text-[clamp(42px,8vw,72px)] italic leading-[1.3]',
                'transition-all duration-400 hover:text-[#F5F5F7] hover:translate-x-4',
                // Active: bright text + slight indent
                activeSection === link
                  ? 'text-[#F5F5F7] translate-x-2'
                  : 'text-[#3F3F46]',
              )}
              aria-current={activeSection === link ? 'true' : undefined}
            >
              {t(link)}
            </a>
          ))}
          <a
            href="/login"
            onClick={closeMobileMenu}
            className="font-display text-[clamp(42px,8vw,72px)] italic text-[#3F3F46] leading-[1.3] mt-8 transition-all duration-400 hover:text-[#F5F5F7] hover:translate-x-4"
          >
            {t('login')}
          </a>
        </nav>

        {/* Mobile menu footer */}
        <div className="px-6 sm:px-16 py-8 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <div>
            <div className="flex gap-5">
              {/* Social icons */}
              <a href="#" aria-label="Instagram" className="text-[#71717A] hover:text-[#F5F5F7] transition-colors duration-300">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1.5" />
                </svg>
              </a>
              <a href="#" aria-label="Twitter" className="text-[#71717A] hover:text-[#F5F5F7] transition-colors duration-300">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="text-[#71717A] hover:text-[#F5F5F7] transition-colors duration-300">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
            <p className="mt-3.5 text-[10px] tracking-[2px] uppercase text-[#3F3F46] leading-relaxed">
              Based in Cape Town<br />© 2024 Purple Glow
            </p>
          </div>
          <a
            href="/signup"
            className="inline-flex items-center justify-center gap-2.5 px-[22px] py-2.5 text-[10px] font-semibold tracking-[1.5px] uppercase bg-brand text-white rounded-[3px] hover:bg-brand-hover transition-all duration-400"
          >
            {t('getStarted')}
          </a>
        </div>
      </div>
    </>
  );
}