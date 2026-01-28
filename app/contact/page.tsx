import { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import PageLayout from '@/components/landing/PageLayout';

export const metadata: Metadata = {
  title: 'Contact Us | Cartaisy',
  description: 'Get in touch with the Cartaisy team. We\'re here to help with any questions about our mobile app builder platform.',
};

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
