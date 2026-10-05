import { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import PageLayout from '@/components/landing/PageLayout';
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'Contact Us',
  description: 'Contact Cartaisy about fit, a walkthrough, or an existing invite. This form does not start checkout.',
  keywords: ['contact', 'support', 'help', 'customer service'],
});

export default function ContactPage() {
  return (
    <PageLayout>
      <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
      <p className="text-gray-400 mb-12">
        Have a question or need help? We&apos;re here for you.
      </p>

      <ContactForm />
    </PageLayout>
  );
}
