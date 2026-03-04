'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

/* ─── Constants ─── */

const STORAGE_KEY = 'pgs-tutorial-completed';

/* ─── Context shape ─── */

interface TutorialContextValue {
  /** Whether the tutorial overlay is currently visible */
  isTutorialVisible: boolean;
  /** Show the tutorial overlay */
  showTutorial: () => void;
  /** Hide the tutorial overlay and mark it completed */
  hideTutorial: () => void;
  /** Clear the completed flag and re-show the tutorial */
  resetTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

/* ─── Hook ─── */

export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) {
    throw new Error('useTutorial must be used within a <TutorialProvider>');
  }
  return ctx;
}

/* ─── Provider ─── */

interface TutorialProviderProps {
  children: React.ReactNode;
}

export function TutorialProvider({ children }: TutorialProviderProps) {
  const [visible, setVisible] = useState(false);

  // On first mount, check localStorage for first-time users.
  // setVisible is deferred via microtask to satisfy react-hooks/set-state-in-effect.
  useEffect(() => {
    try {
      const completed = localStorage.getItem(STORAGE_KEY);
      if (completed !== 'true') {
        Promise.resolve().then(() => setVisible(true));
      }
    } catch {
      // localStorage unavailable (SSR, incognito restrictions) — skip
    }
  }, []);

  const showTutorial = useCallback(() => {
    setVisible(true);
  }, []);

  const hideTutorial = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // localStorage unavailable — silently ignore
    }
  }, []);

  const resetTutorial = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable — silently ignore
    }
    setVisible(true);
  }, []);

  const value = useMemo<TutorialContextValue>(
    () => ({
      isTutorialVisible: visible,
      showTutorial,
      hideTutorial,
      resetTutorial,
    }),
    [visible, showTutorial, hideTutorial, resetTutorial],
  );

  return (
    <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>
  );
}
