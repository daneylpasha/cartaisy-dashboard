import type { Metadata } from 'next';
import Link from 'next/link';
import PageLayout from '@/components/landing/PageLayout';
import {
  managedOffer,
  offerExcludes,
  offerIncludes,
  offerPaths,
  offerPositioning,
  ownership,
} from '@/lib/marketing/offer';
import { inkPanelClass, inkPrimaryClass, inkSecondaryClass } from '@/lib/marketing/publicInk';
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'Pricing',
  description: managedOffer.structure,
  keywords: ['Cartaisy pricing', 'managed Shopify app'],
});

export default function PricingPage() {
  return (
    <PageLayout surface="ink" maxWidth="4xl">
      <p className="text-sm font-medium uppercase tracking-wide text-[#B6C4A1]">{offerPositioning.eyebrow}</p>
      <h1 className="mt-3 text-4xl font-semibold text-[#f6f3ee]">One managed offer</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[#c5c7c1]">{managedOffer.structure}</p>
      <p className="mt-3 max-w-2xl text-base leading-7 text-[#c5c7c1]">{managedOffer.notIncludedInTheProduct}</p>

      <section className="mt-10" aria-labelledby="pricing-includes">
        <h2 id="pricing-includes" className="text-2xl font-semibold text-[#f6f3ee]">
          What the work includes
        </h2>
        <ul className="mt-4 space-y-3">
          {offerIncludes.map((item) => (
            <li key={item.title} className={`${inkPanelClass} p-4`}>
              <h3 className="font-semibold text-[#f6f3ee]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#c5c7c1]">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="pricing-excludes">
        <h2 id="pricing-excludes" className="text-2xl font-semibold text-[#f6f3ee]">
          What it does not include
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-[#c5c7c1]">
          {offerExcludes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={`mt-10 p-5 ${inkPanelClass}`} aria-labelledby="pricing-outside">
        <h2 id="pricing-outside" className="text-xl font-semibold text-[#f6f3ee]">
          Costs outside Cartaisy
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#c5c7c1]">{ownership.accounts}</p>
      </section>

      <section className={`mt-10 p-5 ${inkPanelClass}`} aria-labelledby="pricing-stop">
        <h2 id="pricing-stop" className="text-xl font-semibold text-[#f6f3ee]">
          If you stop
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#c5c7c1]">{ownership.exit}</p>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href={offerPaths.fit} className={inkPrimaryClass}>
          {offerPositioning.primaryCta}
        </Link>
        <Link href={offerPaths.walkthrough} className={inkSecondaryClass}>
          {offerPositioning.walkthroughCta}
        </Link>
      </div>
    </PageLayout>
  );
}
