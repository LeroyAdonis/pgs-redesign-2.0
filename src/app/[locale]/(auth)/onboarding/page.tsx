import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function OnboardingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <OnboardingContent locale={locale} />;
}

function OnboardingContent({ locale }: { locale: string }) {
  const t = useTranslations('onboarding');

  const labels = {
    welcome: {
      title: t('welcome.title'),
      subtitle: t('welcome.subtitle'),
      getStarted: t('welcome.getStarted'),
    },
    orgName: {
      title: "Business Name",
      subtitle: "",
      placeholder: "e.g. My Awesome Brand",
      hint: "This is the name that appears on your dashboard and posts.",
    },
    selectTier: {
      title: t('selectTier.title'),
      subtitle: t('selectTier.subtitle'),
      free: t('selectTier.free'),
      popular: t('selectTier.popular'),
      tierNames: {
        seedling: t('selectTier.tiers.seedling.name'),
        hustler: t('selectTier.tiers.hustler.name'),
        grower: t('selectTier.tiers.grower.name'),
        mogul: t('selectTier.tiers.mogul.name'),
      },
      tierDescriptions: {
        seedling: t('selectTier.tiers.seedling.description'),
        hustler: t('selectTier.tiers.hustler.description'),
        grower: t('selectTier.tiers.grower.description'),
        mogul: t('selectTier.tiers.mogul.description'),
      },
    },
    done: {
      title: t('done.title'),
      subtitle: t('done.subtitle'),
      goToDashboard: t('done.goToDashboard'),
    },
    navigation: {
      back: t('navigation.back'),
      next: t('navigation.next'),
      create: "Create & Continue",
    },
    progress: {
      stepOf: t.raw('progress.stepOf'),
    },
  };

  return (
    <OnboardingWizard
      labels={labels}
      dashboardUrl={`/${locale}/dashboard`}
    />
  );
}
