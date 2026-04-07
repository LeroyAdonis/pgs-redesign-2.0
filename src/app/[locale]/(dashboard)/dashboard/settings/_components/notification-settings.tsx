"use client";

import { useState, useEffect } from "react";

type EmailFrequency = "immediate" | "daily" | "weekly";

interface NotificationPrefs {
  inApp: boolean;
  emailEnabled: boolean;
  emailFrequency: EmailFrequency;
  mutedTypes: string[];
}

const NOTIFICATION_TYPES = [
  { key: "info", label: "General updates" },
  { key: "success", label: "Post published" },
  { key: "warning", label: "Low credits & token expiry" },
  { key: "error", label: "Failed posts" },
  { key: "system", label: "System alerts" },
] as const;

const FREQUENCY_OPTIONS: { value: EmailFrequency; label: string }[] = [
  { value: "immediate", label: "Immediate" },
  { value: "daily", label: "Daily digest" },
  { value: "weekly", label: "Weekly digest" },
];

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    inApp: true,
    emailEnabled: true,
    emailFrequency: "daily",
    mutedTypes: [],
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then((r) => r.json())
      .then((data) => {
        if (data.preferences) setPrefs(data.preferences);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  function toggleMutedType(type: string) {
    setPrefs((prev) => ({
      ...prev,
      mutedTypes: prev.mutedTypes.includes(type)
        ? prev.mutedTypes.filter((t) => t !== type)
        : [...prev.mutedTypes, type],
    }));
  }

  if (loading) {
    return <p className="text-sm text-text-muted">Loading preferences…</p>;
  }

  return (
    <div className="space-y-5">
      {/* Email enabled toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text">Email notifications</p>
          <p className="text-xs text-text-muted">Receive notification emails</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={prefs.emailEnabled}
          onClick={() => setPrefs((p) => ({ ...p, emailEnabled: !p.emailEnabled }))}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            prefs.emailEnabled ? "bg-brand" : "bg-border"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
              prefs.emailEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Email frequency */}
      {prefs.emailEnabled && (
        <div>
          <label className="block text-sm font-medium text-text">Email frequency</label>
          <select
            value={prefs.emailFrequency}
            onChange={(e) =>
              setPrefs((p) => ({ ...p, emailFrequency: e.target.value as EmailFrequency }))
            }
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-brand focus:outline-none"
          >
            {FREQUENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* In-app toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text">In-app notifications</p>
          <p className="text-xs text-text-muted">Show in the notification centre</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={prefs.inApp}
          onClick={() => setPrefs((p) => ({ ...p, inApp: !p.inApp }))}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            prefs.inApp ? "bg-brand" : "bg-border"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
              prefs.inApp ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Type-specific mute toggles */}
      <div>
        <p className="mb-2 text-sm font-medium text-text">Mute specific types</p>
        <div className="space-y-2">
          {NOTIFICATION_TYPES.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 text-sm text-text">
              <input
                type="checkbox"
                checked={!prefs.mutedTypes.includes(key)}
                onChange={() => toggleMutedType(key)}
                className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Preferences"}
        </button>
        {status === "saved" && <span className="text-sm text-green-500">✓ Saved</span>}
        {status === "error" && <span className="text-sm text-red-500">Failed to save</span>}
      </div>
    </div>
  );
}
