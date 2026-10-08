import { Metadata } from 'next';
import PageLayout from '@/components/landing/PageLayout';
import NewsletterForm from '@/components/landing/NewsletterForm';
import { Sparkles, Bell, Gift, Zap } from 'lucide-react';
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'Newsletter',
  description: 'Subscribe to the Cartaisy newsletter for weekly mobile commerce insights, product updates, and exclusive tips.',
  keywords: ['newsletter', 'subscribe', 'updates', 'mobile commerce insights'],
});

export default function NewsletterPage() {
  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full text-purple-400 text-sm mb-6">
          <Sparkles className="w-4 h-4" />
          Join 1,000+ Shopify merchants
        </div>

        <h1 className="text-4xl font-bold text-white mb-4">
          Subscribe to Our Newsletter
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          Notes on the Cartaisy offer and product changes. No sales promises.
        </p>

        <div className="bg-white/5 rounded-xl p-8 border border-white/10 mb-8">
          <NewsletterForm variant="stacked" />
        </div>

        <div className="grid sm:grid-cols-3 gap-6 text-left">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg shrink-0">
              <Bell className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">Product Updates</h3>
              <p className="text-gray-400 text-xs">Be first to know about new features</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg shrink-0">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">Growth Tips</h3>
              <p className="text-gray-400 text-xs">Mobile commerce strategies</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg shrink-0">
              <Gift className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">Exclusive Offers</h3>
              <p className="text-gray-400 text-xs">Subscriber-only discounts</p>
            </div>
          </div>
        </div>

        <p className="text-gray-500 text-xs mt-8">
          No spam, unsubscribe anytime. We respect your privacy.
        </p>
      </div>
    </PageLayout>
  );
}
