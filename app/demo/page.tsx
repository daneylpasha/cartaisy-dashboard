import type { Metadata } from 'next';
import PageLayout from '@/components/landing/PageLayout';
import ProductTour from '@/components/marketing/ProductTour';
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'Product tour',
  description: 'See the Cartaisy dashboard steps: Connect Shopify, brand, and Shopify hosted checkout. No install link and no video placeholder.',
  keywords: ['Cartaisy demo', 'product tour'],
});

export default function DemoPage() {
  return (
    <PageLayout surface="ink" maxWidth="6xl" showBackLink>
      <ProductTour />
    </PageLayout>
  );
}
