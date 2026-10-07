import { Metadata } from 'next';
import Link from 'next/link';
import PageLayout from '@/components/landing/PageLayout';
import { offerPaths } from '@/lib/marketing/offer';
import { inkPrimaryMotionClass } from '@/lib/marketing/publicInk';
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'API',
  description: 'Cartaisy does not offer a public custom-integration API as part of the managed Shopify app.',
  keywords: ['Cartaisy API'],
});

export default function ApiReferencePage() {
  return (
    <PageLayout maxWidth="4xl" backHref="/docs" backLabel="Back to Docs">
      <h1 className="text-4xl font-semibold text-white">API</h1>
      <div className="mt-6 space-y-4 text-base leading-7 text-slate-200">
        <p>
          The managed offer does not include a public API key, a custom integration, or a campaign API. Shopper and dashboard traffic uses Cartaisy’s own backend. Merchants do not get a published endpoint list from this page.
        </p>
        <p>
          Older copy on this page named authentication, product, order, push, and analytics routes as if they were a developer product. That list was not a promise you can build on, and it has been removed.
        </p>
      </div>
      <div className="mt-8">
        <Link href={offerPaths.contact} className={`inline-flex min-h-11 items-center justify-center rounded-[4px] bg-white px-4 text-sm font-semibold text-slate-950 ${inkPrimaryMotionClass}`}>
          Contact
        </Link>
      </div>
    </PageLayout>
  );
}
