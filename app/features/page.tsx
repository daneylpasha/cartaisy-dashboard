import type { Metadata } from 'next';
import Link from 'next/link';
import PageLayout from '@/components/landing/PageLayout';
import { offerExcludes, offerIncludes, offerPaths, offerPositioning } from '@/lib/marketing/offer';
import { inkPanelClass, inkPrimaryClass } from '@/lib/marketing/publicInk';
import { generateMetadata as genMeta } from '@/lib/seo';

const featureCardCopy: Record<string, string> = {
  'Shopify hosted checkout':
    'Shoppers browse, use a cart, and pay through Shopify’s hosted checkout. Cartaisy does not collect card numbers or process payments. Any Apple Pay or Google Pay option is provided by Shopify for that store.',
  'A tracked build request':
    'Build my app records Android and iOS request status. Android merchant builds are still in progress, and this site does not offer an app download. iOS requests can be saved, but a merchant iPhone app is not yet available.',
};

export const metadata: Metadata = genMeta({
  title: 'Features',
  description: 'What the Cartaisy managed Shopify shopping app includes, and what it does not promise.',
  keywords: ['Cartaisy features', 'Shopify shopping app'],
});

export default function FeaturesPage() {
  return (
    <PageLayout surface="ink" maxWidth="4xl">
      <p className="text-sm font-medium uppercase tracking-wide text-[#B6C4A1]">{offerPositioning.eyebrow}</p>
      <h1 className="mt-3 text-4xl font-semibold text-[#f6f3ee]">Bring your Shopify store into a branded app.</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[#c5c7c1]">
        Connect your catalog, shape your brand, and manage your app setup with Cartaisy.
      </p>

      <section id="shopify-integration" className="mt-10 scroll-mt-28">
        <h2 className="text-2xl font-semibold text-[#f6f3ee]">Supported</h2>
        <ul className="mt-4 space-y-3">
          {offerIncludes.map((item) => (
            <li key={item.title} className={`${inkPanelClass} p-4`}>
              <h3 className="font-semibold text-[#f6f3ee]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#c5c7c1]">{featureCardCopy[item.title] ?? item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold text-[#f6f3ee]">Not offered</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-[#c5c7c1]">
          {offerExcludes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <div className="mt-8">
        <Link href={offerPaths.fit} className={inkPrimaryClass}>
          {offerPositioning.primaryCta}
        </Link>
      </div>
    </PageLayout>
  );
}
