import { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import PageLayout from '@/components/landing/PageLayout';
import { operatorIdentity } from '@/lib/marketing/offer';
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'Contact Us',
  description: 'Contact Cartaisy about fit, a walkthrough, or an existing invite. This form does not start checkout.',
  keywords: ['contact', 'support', 'help', 'customer service'],
});

export default function ContactPage() {
  return (
    <PageLayout surface="ink">
      <h1 className="text-4xl font-bold text-[#f6f3ee] mb-4">Contact Us</h1>
      <p className="text-[#c5c7c1] mb-4">{operatorIdentity}</p>
      <p className="text-[#c5c7c1] mb-12">
        Have a question or need help? We&apos;re here for you.
      </p>

      <ContactForm />
    </PageLayout>
  );
}
