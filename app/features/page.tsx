import type { Metadata } from 'next';
import Link from 'next/link';
import PageLayout from '@/components/landing/PageLayout';
import { checkoutWording, homePlatform, offerExcludes, offerIncludes, offerPaths, offerPositioning } from '@/lib/marketing/offer';
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'Features',
  description: 'What the Cartaisy managed Shopify shopping app includes, and what it does not promise.',
  keywords: ['Cartaisy features', 'Shopify shopping app'],
});

export default function FeaturesPage() {
  return (
    <PageLayout maxWidth="4xl">
      <p className="text-sm font-medium uppercase tracking-wide text-purple-200">{offerPositioning.eyebrow}</p>
      <h1 className="mt-3 text-4xl font-semibold text-white">What the app actually does</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">{checkoutWording}</p>
      <p className="mt-3 max-w-2xl text-base font-normal leading-[1.6] text-slate-200">{homePlatform.android}</p>
      <p className="mt-2 max-w-2xl text-base font-normal leading-[1.6] text-slate-200">{homePlatform.ios}</p>

      <section id="shopify-integration" className="mt-10 scroll-mt-28">
        <h2 className="text-2xl font-semibold text-white">Supported</h2>
        <ul className="mt-4 space-y-3">
          {offerIncludes.map((item) => (
            <li key={item.title} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-200">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold text-white">Not offered</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-200">
          {offerExcludes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <div className="mt-8">
        <Link
          href={offerPaths.fit}
          className="inline-flex min-h-11 items-center justify-center rounded-[4px] bg-white px-4 text-sm font-semibold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
        >
          {offerPositioning.primaryCta}
        </Link>
      </div>
    </PageLayout>
  );
}
