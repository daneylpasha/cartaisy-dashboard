import { Metadata } from 'next';
import Link from 'next/link';
import PageLayout from '@/components/landing/PageLayout';
import { offerPaths, publicFaqs } from '@/lib/marketing/offer';
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'FAQ',
  description: 'Fit, offer, checkout, ownership, pricing structure, and invite-only signup for Cartaisy.',
  keywords: ['FAQ', 'Cartaisy offer'],
});

export default function FAQPage() {
  return (
    <PageLayout maxWidth="4xl" backHref="/docs" backLabel="Back to Docs">
      <h1 className="text-4xl font-semibold text-white">Frequently asked questions</h1>
      <p className="mt-3 text-slate-300">The same answers as the public site. No prices are published here.</p>
      <div className="mt-8 space-y-3">
        {publicFaqs.map((faq) => (
          <details key={faq.question} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <summary className="cursor-pointer text-lg font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300">
              {faq.question}
            </summary>
            <p className="mt-3 text-sm leading-6 text-slate-200">{faq.answer}</p>
          </details>
        ))}
      </div>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href={offerPaths.fit} className="inline-flex min-h-11 items-center justify-center rounded-[4px] bg-white px-4 text-sm font-semibold text-slate-950">
          Check fit
        </Link>
        <Link href={offerPaths.walkthrough} className="inline-flex min-h-11 items-center justify-center rounded-[4px] border border-white/20 px-4 text-sm font-semibold text-white">
          Request a walkthrough
        </Link>
      </div>
    </PageLayout>
  );
}
