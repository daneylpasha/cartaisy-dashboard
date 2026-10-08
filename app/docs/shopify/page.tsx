import { Metadata } from 'next';
import Link from 'next/link';
import PageLayout from '@/components/landing/PageLayout';
import ShopifyPermissionsDisclosure from '@/components/marketing/ShopifyPermissionsDisclosure';
import { appStoreAcquisitionTodo, checkoutWording, offerPaths } from '@/lib/marketing/offer';
import { inkPrimaryClass, inkProseClass } from '@/lib/marketing/publicInk';
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'Shopify Integration',
  description: 'How Cartaisy connects a Shopify store, what syncs, and which Shopify permissions the connection is configured to request.',
  keywords: ['Shopify integration', 'Cartaisy Shopify'],
});

export default function ShopifyIntegrationPage() {
  return (
    <PageLayout surface="ink" maxWidth="4xl" backHref="/docs" backLabel="Back to Docs">
      <article className={inkProseClass}>
      <h1 className="text-4xl font-semibold leading-tight text-[#f6f3ee]">Shopify integration</h1>
      <p className="mt-3">Connect happens after an invite, from the merchant dashboard.</p>

      <section className="mt-8 space-y-4">
        <p>
          After you have an account, you enter the Shopify admin address ending in .myshopify.com. Cartaisy starts the connection through its backend. The dashboard does not store the Shopify Admin token.
        </p>
        <p>{checkoutWording}</p>
        <p>
          Product sync includes variants and inventory. Your store still needs its own successful sync before a build. Customers, orders, and webhooks exist in the product, with limits. Not every Shopify app, market, or paused store is supported. A Shopify billing problem on the store can block the connection.
        </p>
      </section>

      <section className="mt-10" aria-labelledby="scopes-heading">
        <h2 id="scopes-heading" className="text-2xl font-semibold leading-tight text-[#f6f3ee]">Permissions</h2>
        <ShopifyPermissionsDisclosure />
      </section>

      <section className="mt-10" aria-labelledby="app-store-heading">
        <h2 id="app-store-heading" className="text-2xl font-semibold leading-tight text-[#f6f3ee]">Shopify App Store</h2>
        <p className="mt-3 text-sm leading-7">{appStoreAcquisitionTodo}</p>
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
