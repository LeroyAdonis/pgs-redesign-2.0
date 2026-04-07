import { setRequestLocale } from "next-intl/server";
import { requireServerSession } from "@/lib/auth-session";
import { MembersList } from "./_components/members-list";
import { InviteForm } from "./_components/invite-form";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata() {
  return { title: "Team | Purple Glow Social" };
}

export default async function TeamPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireServerSession();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text">Team</h1>
        <p className="mt-1 text-sm text-text-muted">Manage your workspace members.</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-base font-semibold text-text">Members</h2>
        <MembersList />
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-base font-semibold text-text">Invite Members</h2>
        <InviteForm />
      </div>
    </div>
  );
}
