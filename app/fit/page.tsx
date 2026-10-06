import type { Metadata } from 'next';
import PageLayout from '@/components/landing/PageLayout';
import FitCheckForm from '@/components/marketing/FitCheckForm';
import { homePlatform, offerPositioning } from '@/lib/marketing/offer';
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'Check if Cartaisy fits',
  description: 'No-login fit check for operating and pre-launch Shopify stores. Store URL is optional. No Shopify connection.',
  keywords: ['Cartaisy fit', 'Shopify app eligibility'],
});

export default function FitPage() {
  return (
    <PageLayout maxWidth="2xl" showBackLink>
      <p className="text-sm font-medium uppercase tracking-wide text-purple-200">{offerPositioning.eyebrow}</p>
      <h1 className="mt-3 text-4xl font-semibold text-white">Check if Cartaisy fits your store</h1>
      <p className="mt-4 text-base leading-7 text-slate-200">
        You do not need an account to check fit. Tell us about your business and your Shopify plans. You can explore fit before your store is live.
      </p>
      <div className="mt-8">
        <FitCheckForm />
      </div>
      <details className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5">
        <summary className="cursor-pointer rounded-sm text-base font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300">
          Offer details
        </summary>
        <div className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
          <p>{homePlatform.android}</p>
          <p>{homePlatform.ios}</p>
        </div>
      </details>
    </PageLayout>
  );
}
