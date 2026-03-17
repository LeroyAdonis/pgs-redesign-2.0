"use client";

/**
 * PuterProvider — No-op wrapper (Puter.js replaced by server-side OpenRouter API)
 *
 * This provider is kept as a no-op to avoid breaking any existing imports.
 * It always reports isLoaded=true and never loads the Puter.js CDN script.
 */

import { createContext, useContext, type ReactNode } from "react";

// ── Context ─────────────────────────────────────────────────────

interface PuterContextValue {
  isLoaded: boolean;
  error: string | null;
}

const PuterContext = createContext<PuterContextValue>({
  isLoaded: true,
  error: null,
});

// ── Hook ────────────────────────────────────────────────────────

export function usePuter(): PuterContextValue {
  return useContext(PuterContext);
}

// ── Provider (no-op) ────────────────────────────────────────────

interface PuterProviderProps {
  children: ReactNode;
}

export function PuterProvider({ children }: PuterProviderProps) {
  return (
    <PuterContext.Provider value={{ isLoaded: true, error: null }}>
      {children}
    </PuterContext.Provider>
  );
}
