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
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'Pricing',
  description: managedOffer.structure,
  keywords: ['Cartaisy pricing', 'managed Shopify app'],
});

export default function PricingPage() {
  return (
    <PageLayout maxWidth="4xl">
      <p className="text-sm font-medium uppercase tracking-wide text-purple-200">{offerPositioning.eyebrow}</p>
      <h1 className="mt-3 text-4xl font-semibold text-white">One managed offer</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">{managedOffer.structure}</p>
      <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">{managedOffer.notIncludedInTheProduct}</p>

      <section className="mt-10" aria-labelledby="pricing-includes">
        <h2 id="pricing-includes" className="text-2xl font-semibold text-white">
          What the work includes
        </h2>
        <ul className="mt-4 space-y-3">
          {offerIncludes.map((item) => (
            <li key={item.title} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-200">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="pricing-excludes">
        <h2 id="pricing-excludes" className="text-2xl font-semibold text-white">
          What it does not include
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-200">
          {offerExcludes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-xl border border-white/10 bg-white/5 p-5" aria-labelledby="pricing-outside">
        <h2 id="pricing-outside" className="text-xl font-semibold text-white">
          Costs outside Cartaisy
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-200">{ownership.accounts}</p>
        <p className="mt-3 text-sm leading-6 text-slate-300">{ownership.exit}</p>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href={offerPaths.fit}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
        >
          {offerPositioning.primaryCta}
        </Link>
        <Link
          href={offerPaths.walkthrough}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/20 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
        >
          {offerPositioning.walkthroughCta}
        </Link>
      </div>
    </PageLayout>
  );
}
