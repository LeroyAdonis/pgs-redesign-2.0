"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

export function ProfileForm({ initialName, email }: { initialName: string; email: string }) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  async function handleSave() {
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text">Display Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-brand focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text">Email</label>
        <input
          value={email}
          disabled
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-muted opacity-60 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-text-muted">Email cannot be changed.</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {status === "saved" && <span className="text-sm text-green-500">✓ Saved</span>}
        {status === "error" && <span className="text-sm text-red-500">Failed to save</span>}
      </div>
    </div>
  );
}
