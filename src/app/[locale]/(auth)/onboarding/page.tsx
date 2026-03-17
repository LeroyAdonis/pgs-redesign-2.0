import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import type { OnboardingLabels } from '@/components/onboarding/OnboardingWizard';

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

  const labels: OnboardingLabels = {
    welcome: {
      title: t('welcome.title'),
      subtitle: t('welcome.subtitle'),
      getStarted: t('welcome.getStarted'),
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
    linkAccount: {
      title: t('linkAccount.title'),
      subtitle: t('linkAccount.subtitle'),
      connect: t('linkAccount.connect'),
      comingSoon: t('linkAccount.comingSoon'),
    },
    brandScan: {
      title: t('brandScan.title'),
      subtitle: t('brandScan.subtitle'),
      scanning: t('brandScan.scanning'),
      features: [
        t('brandScan.features.tone'),
        t('brandScan.features.hashtags'),
        t('brandScan.features.timing'),
        t('brandScan.features.audience'),
      ],
    },
    generatePost: {
      title: t('generatePost.title'),
      subtitle: t('generatePost.subtitle'),
      prompt: t('generatePost.prompt'),
      generate: t('generatePost.generate'),
      mockPost: t('generatePost.mockPost'),
    },
    schedule: {
      title: t('schedule.title'),
      subtitle: t('schedule.subtitle'),
      bestTimes: t('schedule.bestTimes'),
      days: [
        t('schedule.days.mon'),
        t('schedule.days.tue'),
        t('schedule.days.wed'),
        t('schedule.days.thu'),
        t('schedule.days.fri'),
        t('schedule.days.sat'),
        t('schedule.days.sun'),
      ],
      timeSlots: [
        t('schedule.timeSlots.morning'),
        t('schedule.timeSlots.lunch'),
        t('schedule.timeSlots.evening'),
      ],
    },
    done: {
      title: t('done.title'),
      subtitle: t('done.subtitle'),
      goToDashboard: t('done.goToDashboard'),
    },
    navigation: {
      back: t('navigation.back'),
      next: t('navigation.next'),
      skip: t('navigation.skip'),
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
