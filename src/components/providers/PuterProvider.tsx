"use client";

/**
 * PuterProvider — Loads Puter.js CDN script and provides availability context
 *
 * Wraps components that need access to Puter.js AI features.
 * Loads the script lazily and exposes load state via React context.
 *
 * Usage:
 *   <PuterProvider>
 *     <ContentStudioInner />
 *   </PuterProvider>
 *
 * In child components:
 *   const { isLoaded, error } = usePuter();
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// ── Context ─────────────────────────────────────────────────────

interface PuterContextValue {
  isLoaded: boolean;
  error: string | null;
}

const PuterContext = createContext<PuterContextValue>({
  isLoaded: false,
  error: null,
});

// ── Hook ────────────────────────────────────────────────────────

export function usePuter(): PuterContextValue {
  const ctx = useContext(PuterContext);
  return ctx;
}

// ── Provider ────────────────────────────────────────────────────

const PUTER_CDN_URL = "https://js.puter.com/v2/";

interface PuterProviderProps {
  children: ReactNode;
}

export function PuterProvider({ children }: PuterProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If already loaded (e.g. script already in DOM), skip
    if (typeof window !== "undefined" && window.puter) {
      setIsLoaded(true);
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector(
      `script[src="${PUTER_CDN_URL}"]`,
    );
    if (existingScript) {
      // Script exists but may still be loading
      existingScript.addEventListener("load", () => setIsLoaded(true));
      existingScript.addEventListener("error", () =>
        setError("Failed to load Puter.js"),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = PUTER_CDN_URL;
    script.async = true;

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      setError("Failed to load Puter.js. Please check your internet connection.");
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove the script on unmount — other components may depend on it
    };
  }, []);

  return (
    <PuterContext.Provider value={{ isLoaded, error }}>
      {children}
    </PuterContext.Provider>
  );
}
