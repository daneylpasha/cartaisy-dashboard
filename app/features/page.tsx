import { Metadata } from 'next';
import Link from 'next/link';
import {
  Smartphone,
  ShoppingBag,
  RefreshCw,
  Bell,
  CreditCard,
  Link2,
  BarChart3,
  Users,
  Palette,
  Shield,
  Zap,
  Package,
  ShoppingCart,
  UserCheck,
  Webhook,
  ArrowRight,
} from 'lucide-react';
import PageLayout from '@/components/landing/PageLayout';

export const metadata: Metadata = {
  title: 'Features | Cartaisy',
  description: 'Discover all the powerful features Cartaisy offers to build and manage your Shopify mobile app.',
};

const shopifyFeatures = [
  {
    icon: RefreshCw,
    title: 'Real-time Product Sync',
    description: 'Products, variants, and images sync automatically from your Shopify store.',
  },
  {
    icon: Package,
    title: 'Inventory Management',
    description: 'Stock levels update in real-time across your app and store.',
  },
  {
    icon: ShoppingCart,
    title: 'Order Synchronization',
    description: 'Orders placed in your app appear instantly in Shopify admin.',
  },
  {
    icon: UserCheck,
    title: 'Customer Data Sync',
    description: 'Customer accounts, addresses, and order history sync seamlessly.',
  },
  {
    icon: Webhook,
    title: 'Webhook Support',
    description: 'Real-time updates via Shopify webhooks for instant data sync.',
  },
];

const mobileFeatures = [
  {
    icon: Smartphone,
    title: 'Native iOS & Android',
    description: 'True native apps built for performance, not web wrappers.',
  },
  {
    icon: Bell,
    title: 'Push Notifications',
    description: 'Engage customers with targeted push notification campaigns.',
  },
  {
    icon: CreditCard,
    title: 'Apple Pay & Google Pay',
    description: 'One-tap checkout with native payment integrations.',
  },
  {
    icon: ShoppingBag,
    title: 'Abandoned Cart Recovery',
    description: 'Automated notifications to recover abandoned carts.',
  },
  {
    icon: Link2,
    title: 'Deep Linking',
    description: 'Link directly to products, collections, or any screen in your app.',
  },
];

const dashboardFeatures = [
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description: 'Track revenue, orders, sessions, and conversion rates.',
  },
  {
    icon: Users,
    title: 'Customer Segmentation',
    description: 'Segment customers for targeted marketing campaigns.',
  },
  {
    icon: Bell,
    title: 'Push Campaigns',
    description: 'Create, schedule, and track push notification campaigns.',
  },
  {
    icon: Palette,
    title: 'App Customization',
    description: 'Drag-and-drop builder to design your app home screen.',
  },
  {
    icon: Shield,
    title: 'Team Management',
    description: 'Invite team members with role-based access control.',
  },
];

export default function FeaturesPage() {
  return (
    <PageLayout maxWidth="6xl">
      {/* Hero Section */}
      <div className="text-center mb-20">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Powerful Features for Your Mobile App
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Everything you need to transform your Shopify store into a high-converting
          mobile commerce experience.
        </p>
      </div>

      {/* Shopify Integration Section */}
      <section id="shopify-integration" className="mb-20 scroll-mt-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Shopify Integration</h2>
            <p className="text-gray-400">Seamless sync with your Shopify store</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shopifyFeatures.map((feature) => (
            <div
              key={feature.title}
              className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/[0.07] hover:border-white/20 transition-all"
            >
              <feature.icon className="w-8 h-8 text-green-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mobile App Features Section */}
      <section id="mobile-features" className="mb-20 scroll-mt-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Mobile App Features</h2>
            <p className="text-gray-400">Native experiences your customers will love</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mobileFeatures.map((feature) => (
            <div
              key={feature.title}
              className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/[0.07] hover:border-white/20 transition-all"
            >
              <feature.icon className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard Features Section */}
      <section id="dashboard-features" className="mb-20 scroll-mt-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Dashboard Features</h2>
            <p className="text-gray-400">Powerful tools to manage your mobile commerce</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardFeatures.map((feature) => (
            <div
              key={feature.title}
              className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/[0.07] hover:border-white/20 transition-all"
            >
              <feature.icon className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center">
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-12 border border-purple-500/20">
          <Zap className="w-12 h-12 text-purple-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Join hundreds of Shopify merchants who have transformed their mobile commerce
            with Cartaisy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/schedule-demo"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold border border-white/10 transition-colors"
            >
              Schedule a Demo
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
