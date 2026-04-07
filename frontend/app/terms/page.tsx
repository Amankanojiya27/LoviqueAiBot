import type { Metadata } from 'next';
import PublicPageShell from '@/components/public-page-shell';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Lovique',
  description: 'Terms and conditions for using Lovique.',
};

export default function TermsPage() {
  return (
    <PublicPageShell
      eyebrow="Terms & Conditions"
      title="The basics for using Lovique responsibly."
      description="These terms explain the main rules for using Lovique, the account area, and the AI companion experience."
      sections={[
        {
          title: 'Adults-only access',
          paragraphs: [
            'Lovique is intended only for adults aged 18 or older. By creating an account or using the service, you confirm that you meet that age requirement.',
            'If you are under 18, you should not create an account, submit personal information, or use the companion features.',
          ],
        },
        {
          title: 'Using the service',
          paragraphs: [
            'Lovique is provided as a personal AI companion experience. You agree to use it lawfully and in a way that does not abuse, disrupt, or attempt to compromise the service.',
            'You are responsible for the information you submit through your account and for maintaining the confidentiality of your login credentials.',
          ],
        },
        {
          title: 'Accounts, availability, and safety',
          paragraphs: [
            'Some parts of Lovique require registration, login, and a valid session cookie. Access can be limited, suspended, or updated if security, maintenance, or product changes require it.',
            'Features may evolve over time as the product grows. Conversations, companion behavior, memory features, and settings may change as the app improves.',
          ],
        },
        {
          title: 'AI-generated responses',
          paragraphs: [
            'Lovique includes AI-generated content, which means responses may sometimes be incomplete, inaccurate, or unsuitable for high-stakes decisions.',
            'The app should not be treated as legal, medical, financial, mental-health crisis, or emergency advice. Users should rely on qualified professionals and emergency services for those situations.',
            'Lovique is designed for warm conversation, but it is not a real person, and it should not be relied on as a substitute for human support, therapy, or crisis response.',
          ],
        },
      ]}
    />
  );
}
