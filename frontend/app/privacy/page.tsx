import type { Metadata } from 'next';
import PublicPageShell from '@/components/public-page-shell';

export const metadata: Metadata = {
  title: 'Privacy Policy | Lovique',
  description: 'Privacy information for Lovique users.',
};

export default function PrivacyPage() {
  return (
    <PublicPageShell
      eyebrow="Privacy Policy"
      title="How Lovique handles account and chat information."
      description="This page explains the main categories of information Lovique uses so people can understand how the product works before and after signup."
      sections={[
        {
          title: 'Information collected',
          paragraphs: [
            'Lovique uses account details such as your name, email address, password credentials, selected companion preferences, and chat-related data needed to provide the companion experience.',
            'The product also stores conversation sessions, remembered notes, and settings so the experience stays consistent when you return.',
            'Lovique uses session cookies so the app can recognize when you are signed in and keep your account active between requests.',
          ],
        },
        {
          title: 'How information is used',
          paragraphs: [
            'Your information is used to authenticate your account, power companion interactions, maintain saved sessions, support password recovery, and improve the product experience.',
            'Stored preferences such as selected personality and companion setup help shape how the AI companion responds inside your dashboard, and remembered notes may be used to keep future replies consistent with what you previously shared.',
            'Chat requests are processed through Lovique’s AI provider so the companion can generate replies.',
          ],
        },
        {
          title: 'Storage, deletion, and control',
          paragraphs: [
            'You can manage parts of your account from settings, including password changes, companion preferences, and remembered notes. Conversation controls such as starting a new chat or deleting sessions are also available inside the app.',
            'If you clear remembered notes or delete chat sessions, those items are removed from the Lovique account data used for future in-app experiences.',
            'Password reset tokens are short-lived and intended only for account recovery.',
          ],
        },
        {
          title: 'Support and transparency',
          paragraphs: [
            'If you have privacy or support questions, use the contact details listed on the Contact page and footer of the site.',
            'As Lovique evolves, this page should be kept in sync with the real product behavior, including account sessions, AI processing, memory features, and deletion controls.',
          ],
        },
      ]}
    />
  );
}
