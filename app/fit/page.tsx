import type { Metadata } from 'next';
import PageLayout from '@/components/landing/PageLayout';
import FitCheckForm from '@/components/marketing/FitCheckForm';
import { inkPanelClass } from '@/lib/marketing/publicInk';
import { homePlatform, offerPositioning } from '@/lib/marketing/offer';
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'Check if Cartaisy fits',
  description: 'No-login fit check for operating and pre-launch Shopify stores. Store URL is optional. No Shopify connection.',
  keywords: ['Cartaisy fit', 'Shopify app eligibility'],
});

export default function FitPage() {
  return (
    <PageLayout surface="ink" maxWidth="2xl" showBackLink>
      <p className="text-sm font-medium uppercase tracking-wide text-[#B6C4A1]">{offerPositioning.eyebrow}</p>
      <h1 className="mt-3 text-4xl font-semibold text-[#f6f3ee]">Check if Cartaisy fits your store</h1>
      <p className="mt-4 text-base leading-7 text-[#c5c7c1]">
        You do not need an account to check fit. Tell us about your business and your Shopify plans. You can explore fit before your store is live.
      </p>
      <div className="mt-8">
        <FitCheckForm />
      </div>
      <details className={`mt-8 p-5 ${inkPanelClass}`}>
        <summary className="flex min-h-12 cursor-pointer items-center rounded-[4px] text-base font-semibold text-[#f6f3ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B6C4A1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111210]">
          Offer details
        </summary>
        <div className="mt-4 space-y-2 text-sm leading-6 text-[#c5c7c1]">
          <p>{homePlatform.android}</p>
          <p>{homePlatform.ios}</p>
        </div>
      </details>
    </PageLayout>
  );
}
