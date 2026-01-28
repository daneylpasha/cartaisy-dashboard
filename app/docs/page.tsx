import { Metadata } from 'next';
import Link from 'next/link';
import {
  Book,
  Rocket,
  ShoppingBag,
  Code,
  HelpCircle,
  MessageSquare,
  Zap,
  Settings,
  Shield,
} from 'lucide-react';
import PageLayout from '@/components/landing/PageLayout';

export const metadata: Metadata = {
  title: 'Documentation | Cartaisy',
  description: 'Learn how to use Cartaisy to build and manage your Shopify mobile app.',
};

const docSections = [
  {
    title: 'Getting Started',
    description: 'Everything you need to launch your mobile app',
    links: [
      {
        icon: Rocket,
        title: 'Quick Start Guide',
        description: 'Get up and running in minutes',
        href: '/docs/quickstart',
      },
      {
        icon: Settings,
        title: 'Dashboard Overview',
        description: 'Navigate the Cartaisy dashboard',
        href: '/docs/quickstart#dashboard',
        comingSoon: true,
      },
    ],
  },
  {
    title: 'Integration',
    description: 'Connect and configure your Shopify store',
    links: [
      {
        icon: ShoppingBag,
        title: 'Shopify Setup',
        description: 'Connect your Shopify store to Cartaisy',
        href: '/docs/shopify',
      },
      {
        icon: Zap,
        title: 'Webhook Configuration',
        description: 'Set up real-time data sync',
        href: '/docs/shopify#webhooks',
        comingSoon: true,
      },
    ],
  },
  {
    title: 'API',
    description: 'For developers building custom integrations',
    links: [
      {
        icon: Code,
        title: 'API Reference',
        description: 'REST API endpoints and authentication',
        href: '/docs/api',
      },
      {
        icon: Shield,
        title: 'Authentication',
        description: 'JWT tokens and security',
        href: '/docs/api#authentication',
        comingSoon: true,
      },
    ],
  },
  {
    title: 'Support',
    description: 'Get help when you need it',
    links: [
      {
        icon: HelpCircle,
        title: 'FAQ',
        description: 'Frequently asked questions',
        href: '/docs/faq',
      },
      {
        icon: MessageSquare,
        title: 'Contact Support',
        description: 'Get help from our team',
        href: '/contact',
      },
    ],
  },
];

export default function DocsPage() {
  return (
    <PageLayout maxWidth="5xl">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="w-20 h-20 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Book className="w-10 h-10 text-purple-400" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Documentation</h1>
        <p className="text-gray-400 text-lg max-w-lg mx-auto">
          Everything you need to build, customize, and manage your Shopify mobile app with Cartaisy.
        </p>
      </div>

      {/* Documentation Sections */}
      <div className="space-y-12">
        {docSections.map((section) => (
          <section key={section.title}>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
              <p className="text-gray-400">{section.description}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {section.links.map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  className={`group bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/[0.07] hover:border-purple-500/30 transition-all ${
                    link.comingSoon ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/30 transition-colors">
                      <link.icon className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium text-white group-hover:text-purple-300 transition-colors">
                          {link.title}
                        </h3>
                        {link.comingSoon && (
                          <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-400">
                            Soon
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mt-1">{link.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Help CTA */}
      <div className="mt-16 text-center">
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-8 border border-purple-500/20">
          <h3 className="text-xl font-semibold text-white mb-2">Can&apos;t find what you&apos;re looking for?</h3>
          <p className="text-gray-400 mb-6">
            Our support team is here to help you with any questions.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
