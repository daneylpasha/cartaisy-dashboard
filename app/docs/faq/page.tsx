import { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle, ChevronDown } from 'lucide-react';
import PageLayout from '@/components/landing/PageLayout';

export const metadata: Metadata = {
  title: 'FAQ | Cartaisy',
  description: 'Frequently asked questions about Cartaisy mobile app builder for Shopify.',
};

const faqs = [
  {
    question: 'How long does it take to set up my mobile app?',
    answer: 'Most merchants can have their app ready in under an hour. The initial Shopify sync takes 1-5 minutes depending on your catalog size. Customizing your app with our drag-and-drop builder is quick and intuitive. The app store review process (Apple/Google) typically takes 1-3 days.',
  },
  {
    question: 'Do I need coding skills to use Cartaisy?',
    answer: 'No coding skills required! Cartaisy is designed for non-technical users. Our visual App Builder lets you customize your app with drag-and-drop components. You can add carousels, banners, collection grids, and more without writing a single line of code.',
  },
  {
    question: 'How much does Cartaisy cost?',
    answer: 'We offer several pricing tiers starting at $49/month for small stores. Our Growth plan at $99/month is popular for growing businesses, and we have Pro ($199/month) and Enterprise ($499/month) plans for larger operations. All plans include a 14-day free trial.',
  },
  {
    question: 'Can I customize the look and feel of my app?',
    answer: 'Absolutely! You can customize colors, fonts, logos, and the entire home screen layout. Add hero banners, product carousels, collection grids, promotional banners, and more. Your app will match your brand identity perfectly.',
  },
  {
    question: 'How do push notifications work?',
    answer: 'Push notifications let you send messages directly to your customers\' phones. You can create campaigns for sales, new arrivals, abandoned carts, and more. Segment your audience based on behavior, purchase history, or custom criteria. Track open rates and conversions in your dashboard.',
  },
  {
    question: 'Will my products sync automatically from Shopify?',
    answer: 'Yes! Once you connect your Shopify store, all products, collections, variants, and images sync automatically. We use webhooks to keep everything updated in real-time. When you add or modify products in Shopify, changes appear in your app instantly.',
  },
  {
    question: 'Do you support Apple Pay and Google Pay?',
    answer: 'Yes, native payment methods are supported on our Growth plan and above. Customers can check out with Apple Pay on iOS and Google Pay on Android, making purchases faster and easier.',
  },
  {
    question: 'Can I have multiple team members manage the app?',
    answer: 'Yes! Our Pro and Enterprise plans include team management features. Invite team members with different roles (admin, editor, viewer) and control what each person can access and modify.',
  },
  {
    question: 'What happens if I cancel my subscription?',
    answer: 'If you cancel, your app will remain live until the end of your billing period. After that, the app will become inactive. Your data is retained for 30 days in case you want to reactivate. You can export your data at any time.',
  },
  {
    question: 'Do you provide support for app store submission?',
    answer: 'Yes! We handle most of the technical requirements for app store submission. Our team will guide you through the process, help prepare screenshots and descriptions, and ensure your app meets Apple and Google\'s guidelines.',
  },
];

export default function FAQPage() {
  return (
    <PageLayout maxWidth="4xl" backHref="/docs" backLabel="Back to Docs">
      {/* Header */}
      <div className="flex items-center gap-4 mb-12">
        <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center">
          <HelpCircle className="w-7 h-7 text-blue-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white">Frequently Asked Questions</h1>
          <p className="text-gray-400">Quick answers to common questions</p>
        </div>
      </div>

      {/* FAQ List */}
      <div className="space-y-4 mb-12">
        {faqs.map((faq, index) => (
          <details
            key={index}
            className="group bg-white/5 rounded-xl border border-white/10 overflow-hidden"
          >
            <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
              <h3 className="text-lg font-medium text-white pr-4">{faq.question}</h3>
              <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-6 pb-6">
              <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
            </div>
          </details>
        ))}
      </div>

      {/* Still have questions */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-8 border border-purple-500/20">
          <h3 className="text-xl font-semibold text-white mb-2">Still have questions?</h3>
          <p className="text-gray-400 mb-6">
            Can&apos;t find the answer you&apos;re looking for? Our team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="/schedule-demo"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium border border-white/10 transition-colors"
            >
              Schedule a Demo
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
