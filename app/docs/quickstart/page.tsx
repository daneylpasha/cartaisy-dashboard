import { Metadata } from 'next';
import Link from 'next/link';
import PageLayout from '@/components/landing/PageLayout';
import { homePlatform, offerPaths, ownership } from '@/lib/marketing/offer';
import { inkPrimaryClass, inkProseClass, inkPanelClass } from '@/lib/marketing/publicInk';
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'Quick Start',
  description: 'How a merchant goes from a fit check to an invite, Shopify connection, brand, and a build request.',
  keywords: ['Cartaisy quick start'],
});

const steps = [
  {
    title: 'Check fit',
    body: 'Use the public fit check. No login. A store URL is optional if you have not launched.',
  },
  {
    title: 'Request a walkthrough',
    body: 'We follow up by email. The form does not book a calendar by itself.',
  },
  {
    title: 'Accept an invite',
    body: 'Signup stays closed until Cartaisy sends a link. Login is for people who already have an account.',
  },
  {
    title: 'Connect Shopify, then brand',
    body: 'Connect the store, set name, logo, colors, icon, and splash, and publish a home or leave the smart default.',
  },
  {
    title: 'Request a build',
    body: `${homePlatform.android} ${homePlatform.ios}`,
  },
];

export default function QuickStartPage() {
  return (
    <PageLayout surface="ink" maxWidth="4xl" backHref="/docs" backLabel="Back to Docs">
      <article className={inkProseClass}>
      <h1 className="text-4xl font-semibold leading-tight text-[#f6f3ee]">Quick start</h1>
      <p className="mt-3">This is the merchant path. It is not a four-click publish.</p>
      <ol className="mt-8 space-y-4">
        {steps.map((step, index) => (
          <li key={step.title} className={`p-5 ${inkPanelClass}`}>
            <h2 className="text-lg font-semibold text-[#f6f3ee]">
              {index + 1}. {step.title}
            </h2>
            <p className="mt-2 text-sm leading-6">{step.body}</p>
          </li>
        ))}
      </ol>
      <section className="mt-10">
        <h2 className="text-2xl font-semibold leading-tight text-[#f6f3ee]">Prerequisites</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7">
          <li>A Shopify store before catalog sync. Pre-launch merchants can still request a walkthrough.</li>
          <li>An invite from Cartaisy before creating an account.</li>
          <li>{ownership.accounts}</li>
          <li>{ownership.expo}</li>
        </ul>
      </section>
      <div className="mt-8">
        <Link href={offerPaths.fit} className={inkPrimaryClass}>
          Check if Cartaisy fits your store
        </Link>
      </div>
      </article>
    </PageLayout>
  );
}
