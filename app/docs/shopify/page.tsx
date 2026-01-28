import { Metadata } from 'next';
import Link from 'next/link';
import { ShoppingBag, CheckCircle, RefreshCw, Package, Users, Webhook, AlertCircle } from 'lucide-react';
import PageLayout from '@/components/landing/PageLayout';

export const metadata: Metadata = {
  title: 'Shopify Integration | Cartaisy',
  description: 'Learn how to connect and sync your Shopify store with Cartaisy.',
};

const syncFeatures = [
  {
    icon: Package,
    title: 'Products & Collections',
    description: 'All products, variants, images, and collections sync automatically.',
  },
  {
    icon: RefreshCw,
    title: 'Inventory Levels',
    description: 'Stock quantities update in real-time across all sales channels.',
  },
  {
    icon: Users,
    title: 'Customer Accounts',
    description: 'Customer profiles, addresses, and order history stay in sync.',
  },
  {
    icon: Webhook,
    title: 'Webhooks',
    description: 'Real-time updates for orders, products, and inventory changes.',
  },
];

export default function ShopifyIntegrationPage() {
  return (
    <PageLayout maxWidth="4xl" backHref="/docs" backLabel="Back to Docs">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center">
          <ShoppingBag className="w-7 h-7 text-green-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white">Shopify Integration</h1>
          <p className="text-gray-400">Connect your store and sync your data</p>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-6 border border-yellow-500/20 mb-12">
        <h3 className="text-lg font-semibold text-white mb-2">Detailed Guide Coming Soon</h3>
        <p className="text-gray-400">
          We&apos;re preparing step-by-step instructions with screenshots. Here&apos;s an overview
          of what our Shopify integration offers.
        </p>
      </div>

      {/* Overview */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Overview</h2>
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <p className="text-gray-400 leading-relaxed mb-4">
            Cartaisy integrates seamlessly with your Shopify store using the official Shopify API.
            Once connected, your products, collections, customers, and orders sync automatically,
            keeping your mobile app always up to date.
          </p>
          <p className="text-gray-400 leading-relaxed">
            The integration is read-write, meaning orders placed in your mobile app appear in
            your Shopify admin just like orders from your online store.
          </p>
        </div>
      </section>

      {/* What Syncs */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-6">What Syncs</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {syncFeatures.map((feature) => (
            <div
              key={feature.title}
              className="bg-white/5 rounded-xl p-6 border border-white/10"
            >
              <feature.icon className="w-8 h-8 text-green-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Connection Steps Preview */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">How to Connect</h2>
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <ol className="space-y-4 text-gray-400">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-purple-500/30 rounded-full flex items-center justify-center text-sm font-medium text-purple-300 flex-shrink-0">1</span>
              <span>Log in to your Cartaisy dashboard</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-purple-500/30 rounded-full flex items-center justify-center text-sm font-medium text-purple-300 flex-shrink-0">2</span>
              <span>Go to Settings → Shopify Integration</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-purple-500/30 rounded-full flex items-center justify-center text-sm font-medium text-purple-300 flex-shrink-0">3</span>
              <span>Click &quot;Connect Shopify Store&quot; and enter your store URL</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-purple-500/30 rounded-full flex items-center justify-center text-sm font-medium text-purple-300 flex-shrink-0">4</span>
              <span>Authorize the Cartaisy app in your Shopify admin</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-purple-500/30 rounded-full flex items-center justify-center text-sm font-medium text-purple-300 flex-shrink-0">5</span>
              <span>Wait for the initial sync to complete (usually 1-5 minutes)</span>
            </li>
          </ol>
        </div>
      </section>

      {/* Permissions */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Required Permissions</h2>
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-gray-400 text-sm">
              Cartaisy requires the following Shopify API scopes to function properly:
            </p>
          </div>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <code className="bg-white/10 px-2 py-0.5 rounded">read_products</code> - Read product data
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <code className="bg-white/10 px-2 py-0.5 rounded">read_orders</code> - Read order data
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <code className="bg-white/10 px-2 py-0.5 rounded">write_orders</code> - Create orders from mobile app
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <code className="bg-white/10 px-2 py-0.5 rounded">read_customers</code> - Read customer data
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <code className="bg-white/10 px-2 py-0.5 rounded">read_inventory</code> - Read inventory levels
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <p className="text-gray-400 mb-4">Need help connecting your store?</p>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          Contact Support
        </Link>
      </div>
    </PageLayout>
  );
}
