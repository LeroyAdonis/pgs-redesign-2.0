"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface Member {
  id: string;
  name: string | null;
  email: string;
  role: string;
  joinedAt: string | null;
}

const roleBadge: Record<string, string> = {
  owner: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  member: "bg-gray-100 text-gray-700",
};

export function MembersList() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((data) => setMembers(data.members ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-text-muted">Loading members...</div>;

  return (
    <div className="space-y-3">
      {members.map((m) => (
        <div key={m.id} className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-text">{m.name ?? "Unnamed"}</p>
            <p className="text-xs text-text-muted">{m.email}</p>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge[m.role] ?? roleBadge.member}`}>
            {m.role}
          </span>
        </div>
      ))}
      {members.length === 0 && (
        <p className="text-sm text-text-muted">No members found.</p>
      )}
    </div>
  );
}
