import type { Metadata } from 'next';
import PublicPageShell from '@/components/public-page-shell';

export const metadata: Metadata = {
  title: 'About Us | Lovique',
  description: 'About the Lovique product.',
};

export default function AboutPage() {
  return (
    <PublicPageShell
      eyebrow="About Us"
      title="Lovique is built for personal, calm AI conversation."
      description="Lovique is a companion-style chat product designed to feel simple, private, and easy to return to, with saved sessions, preferences, and account-based access."
      sections={[
        {
          title: 'What Lovique is',
          paragraphs: [
            'Lovique is a web app where users create an account, choose companion preferences, and chat with an AI companion inside a personal dashboard.',
            'It combines authentication, saved conversations, remembered notes, and user settings into a single product flow.',
          ],
        },
        {
          title: 'What the experience focuses on',
          paragraphs: [
            'The product is meant to feel approachable for first-time users, not like a developer demo or admin panel.',
            'That means clear onboarding, a usable chat dashboard, a separate settings area, and a smoother app-style navigation flow.',
          ],
        },
        {
          title: 'Who is behind it',
          paragraphs: [
            'This project is developed by @Amankanojiya27 and presented as a growing product experience.',
            'As the product evolves, these public pages can be expanded with more specific legal, privacy, and support details.',
          ],
        },
      ]}
    />
  );
}
