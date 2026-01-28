import { Metadata } from 'next';
import Link from 'next/link';
import ContactForm from '@/components/ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us | Cartaisy',
  description: 'Get in touch with the Cartaisy team. We\'re here to help with any questions about our mobile app builder platform.',
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Link href="/" className="text-purple-400 hover:text-purple-300 mb-8 inline-block transition-colors">
          &larr; Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
        <p className="text-gray-400 mb-12">
          Have a question or need help? We&apos;re here for you.
        </p>

        <ContactForm />
      </div>
    </main>
  );
}
