import { setRequestLocale } from "next-intl/server";
import { requireServerSession } from "@/lib/auth-session";
import { ProfileForm } from "./_components/profile-form";
import { NotificationSettings } from "./_components/notification-settings";
import { SecuritySettings } from "./_components/security-settings";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata() {
  return { title: "Settings | Purple Glow Social" };
}

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireServerSession();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text">Settings</h1>
        <p className="mt-1 text-sm text-text-muted">Manage your account preferences.</p>
      </div>

      {/* Profile Section */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-base font-semibold text-text">Profile</h2>
        <ProfileForm
          initialName={session.user.name ?? ""}
          email={session.user.email ?? ""}
        />
      </div>

      {/* Notifications Section */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-base font-semibold text-text">Notifications</h2>
        <NotificationSettings />
      </div>

      {/* Security Section */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-base font-semibold text-text">Security</h2>
        <SecuritySettings />
      </div>
    </div>
  );
}
