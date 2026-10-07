import type { Metadata } from 'next';
import PageLayout from '@/components/landing/PageLayout';
import WalkthroughForm from '@/components/marketing/WalkthroughForm';
import { offerPositioning } from '@/lib/marketing/offer';
import { inkProseClass } from '@/lib/marketing/publicInk';
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'Request a walkthrough',
  description: 'Ask Cartaisy for a walkthrough. We save the request and reply by email. It does not book a calendar slot.',
  keywords: ['Cartaisy walkthrough', 'request a demo'],
});

export default function WalkthroughPage() {
  return (
    <PageLayout surface="ink" maxWidth="2xl" showBackLink>
      <p className="text-sm font-medium uppercase tracking-wide text-[#B6C4A1]">{offerPositioning.eyebrow}</p>
      <h1 className="mt-3 text-4xl font-semibold text-[#f6f3ee]">Request a walkthrough</h1>
      <p className={`mt-4 ${inkProseClass}`}>
        Tell us how to reach you. We read the request and reply by email. This page does not open a calendar, and it does not connect Shopify.
      </p>
      <div className="mt-8">
        <WalkthroughForm />
      </div>
    </PageLayout>
  );
}
