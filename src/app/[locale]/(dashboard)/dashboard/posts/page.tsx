import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireServerSession } from "@/lib/auth-session";
import { PostsManager } from "./_components/PostsManager";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata() {
  return {
    title: "Posts | Purple Glow Social",
    description: "Manage and schedule your social media posts",
  };
}

export default async function PostsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireServerSession();

  return (
    <div className="mx-auto max-w-7xl">
      <PostsManager />
    </div>
  );
}
