import type { Metadata } from 'next';
import PageLayout from '@/components/landing/PageLayout';
import WalkthroughForm from '@/components/marketing/WalkthroughForm';
import { offerPositioning } from '@/lib/marketing/offer';
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'Request a walkthrough',
  description: 'Ask Cartaisy for a walkthrough. We save the request and reply by email. It does not book a calendar slot.',
  keywords: ['Cartaisy walkthrough', 'request a demo'],
});

export default function WalkthroughPage() {
  return (
    <PageLayout maxWidth="2xl" showBackLink>
      <p className="text-sm font-medium uppercase tracking-wide text-purple-200">{offerPositioning.eyebrow}</p>
      <h1 className="mt-3 text-4xl font-semibold text-white">Request a walkthrough</h1>
      <p className="mt-4 text-base leading-7 text-slate-200">
        Tell us how to reach you. We read the request and reply by email. This page does not open a calendar, and it does not connect Shopify.
      </p>
      <div className="mt-8">
        <WalkthroughForm />
      </div>
    </PageLayout>
  );
}
