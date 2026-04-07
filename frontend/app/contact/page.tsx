import type { Metadata } from 'next';
import PublicPageShell from '@/components/public-page-shell';

export const metadata: Metadata = {
  title: 'Contact Us | Lovique',
  description: 'Contact information for Lovique.',
};

export default function ContactPage() {
  return (
    <PublicPageShell
      eyebrow="Contact Us"
      title="Reach out for product questions or support."
      description="Lovique is currently represented through direct developer contact channels so people can ask product, support, or privacy questions."
      sections={[
        {
          title: 'Best contact channel',
          paragraphs: [
            'Email: amankanojiya.dev@gmail.com',
            'GitHub profile: github.com/Amankanojiya27',
            'If you are sharing feedback, reporting a product issue, or asking about privacy or account concerns, email is the most direct route and GitHub is the best public route.',
          ],
        },
        {
          title: 'Repository support',
          paragraphs: [
            'Project-specific questions can also be raised through the LoviqueAiBot repository issue tracker when appropriate.',
            'Repository link: github.com/Amankanojiya27/LoviqueAiBot',
          ],
        },
        {
          title: 'Response expectations',
          paragraphs: [
            'Because this is an actively developing product, response times may vary. Clear issue descriptions and steps to reproduce problems make support much easier.',
          ],
        },
      ]}
    />
  );
}
