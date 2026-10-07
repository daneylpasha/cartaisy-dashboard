import type { Metadata } from 'next';
import Link from 'next/link';
import PageLayout from '@/components/landing/PageLayout';
import { homeManaged, homePlatform, offerPaths, offerPositioning } from '@/lib/marketing/offer';
import { inkPrimaryClass, inkProseClass, inkSecondaryClass } from '@/lib/marketing/publicInk';
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'About',
  description: 'Cartaisy is a managed branded shopping app for Shopify stores. Invite-only. No sales guarantee.',
  keywords: ['about Cartaisy'],
});

export default function AboutPage() {
  return (
    <PageLayout surface="ink">
      <p className="text-sm font-medium uppercase tracking-wide text-[#B6C4A1]">{offerPositioning.eyebrow}</p>
      <h1 className="mt-3 text-4xl font-semibold text-[#f6f3ee]">About Cartaisy</h1>
      <div className={`mt-6 space-y-4 ${inkProseClass}`}>
        <p>
          Cartaisy helps a Shopify merchant give customers a branded mobile shopping app. The catalog stays in Shopify. Shoppers pay on Shopify hosted checkout.
        </p>
        <p>
          Setup is managed and invite-only. Cartaisy is not a self-serve app builder, and it is not a promise that an app will create sales. Merchants who do not yet have customers are often better served by the website first.
        </p>
        <p>
          {homeManaged} {homePlatform.ios} {homePlatform.android}
        </p>
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href={offerPaths.fit} className={inkPrimaryClass}>
          {offerPositioning.primaryCta}
        </Link>
        <Link href={offerPaths.contact} className={inkSecondaryClass}>
          Contact
        </Link>
      </div>
    </PageLayout>
  );
}
