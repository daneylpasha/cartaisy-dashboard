import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import PageLayout from '@/components/landing/PageLayout';
import { offerPaths, publicFaqs } from '@/lib/marketing/offer';
import { inkPanelClass, inkPrimaryClass, inkProseClass, inkSecondaryClass } from '@/lib/marketing/publicInk';
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'FAQ',
  description: 'Fit, offer, checkout, ownership, pricing structure, and invite-only signup for Cartaisy.',
  keywords: ['FAQ', 'Cartaisy offer'],
});

export default function FAQPage() {
  return (
    <PageLayout surface="ink" maxWidth="4xl" backHref="/docs" backLabel="Back to Docs">
      <article className={inkProseClass}>
      <h1 className="text-4xl font-semibold leading-tight text-[#f6f3ee]">Frequently asked questions</h1>
      <p className="mt-3">The same answers as the public site. No prices are published here.</p>
      <div className="mt-8 space-y-3">
        {publicFaqs.map((faq) => (
          <details key={faq.question} className={`group p-5 ${inkPanelClass}`}>
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-[4px] text-lg font-medium text-[#f6f3ee] marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B6C4A1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111210] [&::-webkit-details-marker]:hidden">
              <ChevronRight className="size-4 shrink-0 text-[#B6C4A1] transition-transform group-open:rotate-90" aria-hidden />
              <span>{faq.question}</span>
            </summary>
            <p className="mt-3 text-sm leading-7">{faq.answer}</p>
          </details>
        ))}
      </div>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href={offerPaths.fit} className={inkPrimaryClass}>
          Check fit
        </Link>
        <Link href={offerPaths.walkthrough} className={inkSecondaryClass}>
          Request a walkthrough
        </Link>
      </div>
      </article>
    </PageLayout>
  );
}
