import type { Metadata } from 'next';
import PageLayout from '@/components/landing/PageLayout';
import FitCheckForm from '@/components/marketing/FitCheckForm';
import { eligibility, homePlatform, offerPositioning } from '@/lib/marketing/offer';
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
        No account is required. {eligibility.operating} {eligibility.prelaunch} {eligibility.websiteFirst}
      </p>
      <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
        <h2 className="text-sm font-semibold text-white">Platform limits</h2>
        <p className="text-sm leading-6 text-slate-300">{homePlatform.android}</p>
        <p className="text-sm leading-6 text-slate-300">{homePlatform.ios}</p>
      </div>
      <div className="mt-8">
        <FitCheckForm />
      </div>
    </PageLayout>
  );
}
