import type { Metadata } from 'next';
import Link from 'next/link';
import PageLayout from '@/components/landing/PageLayout';
import { offerPaths, offerPositioning } from '@/lib/marketing/offer';
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'About',
  description: 'Cartaisy is a managed branded shopping app for Shopify stores. Invite-only. No sales guarantee.',
  keywords: ['about Cartaisy'],
});

export default function AboutPage() {
  return (
    <PageLayout>
      <p className="text-sm font-medium uppercase tracking-wide text-purple-200">{offerPositioning.eyebrow}</p>
      <h1 className="mt-3 text-4xl font-semibold text-white">About Cartaisy</h1>
      <div className="mt-6 space-y-4 text-base leading-7 text-slate-200">
        <p>
          Cartaisy helps a Shopify merchant give customers a branded mobile shopping app. The catalog stays in Shopify. Shoppers pay on Shopify hosted checkout.
        </p>
        <p>
          Setup is managed and invite-only. Cartaisy is not a self-serve app builder, and it is not a promise that an app will create sales. Merchants who do not yet have customers are often better served by the website first.
        </p>
        <p>
          Apple and Google developer accounts stay with the merchant. iOS production readiness is still open. Android has a sample build from August 2026, not a public download.
        </p>
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href={offerPaths.fit} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-slate-950">
          {offerPositioning.primaryCta}
        </Link>
        <Link href={offerPaths.contact} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/20 px-4 text-sm font-semibold text-white">
          Contact
        </Link>
      </div>
    </PageLayout>
  );
}
