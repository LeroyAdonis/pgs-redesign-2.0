"use client";

/**
 * LanguageSelector — Dropdown for South Africa's 11 official languages
 *
 * Imports SA_LANGUAGES from the SA cultural context layer.
 * Default selection is English.
 */

import { SA_LANGUAGES } from "@/lib/brand/sa-context";

interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="language-select"
        className="text-xs font-medium text-text-muted"
      >
        Language
      </label>
      <select
        id="language-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "rounded-lg border border-border bg-surface px-3 py-2",
          "text-sm text-text",
          "focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",
          "transition-colors",
        ].join(" ")}
      >
        {Object.entries(SA_LANGUAGES).map(([code, name]) => (
          <option key={code} value={code}>
            {name} ({code})
          </option>
        ))}
      </select>
    </div>
  );
}
