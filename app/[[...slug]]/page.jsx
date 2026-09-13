import { ClientOnly } from './client';

export const dynamicParams = true;

export function generateStaticParams() {
  return [
    { slug: [] },
    { slug: ['login'] },
    { slug: ['signup'] },
    { slug: ['forgot-password'] },
    { slug: ['dashboard'] },
    { slug: ['academics'] },
    { slug: ['planner'] },
    { slug: ['flashcards'] },
    { slug: ['pomodoro'] },
    { slug: ['aiexplainer'] },
    { slug: ['onboarding'] },
    { slug: ['profile'] },
    { slug: ['settings'] }
  ];
}

export default function Page() {
  return <ClientOnly />;
}
