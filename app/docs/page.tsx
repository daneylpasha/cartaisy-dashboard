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
import { inkPanelClass, inkPrimaryClass } from '@/lib/marketing/publicInk';
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'Documentation',
  description: 'How Cartaisy onboarding, Shopify connection, and the managed offer work. No public API product.',
  keywords: ['documentation', 'guides', 'tutorials', 'API', 'help'],
});

const docSections = [
  {
    title: 'Getting Started',
    description: 'The path from a fit check to an invited dashboard',
    links: [
      {
        icon: Rocket,
        title: 'Quick Start Guide',
        description: 'Fit check, walkthrough, invite, then setup',
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
    description: 'Not a public custom-integration product',
    links: [
      {
        icon: Code,
        title: 'API Reference',
        description: 'Why this offer has no public API',
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
    <PageLayout surface="ink" maxWidth="5xl">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[4px] border border-[#666962] text-[#B6C4A1]">
          <Book className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold text-[#f6f3ee] mb-4">Documentation</h1>
        <p className="text-[#c5c7c1] text-lg max-w-lg mx-auto">
          Everything you need to build, customize, and manage your Shopify mobile app with Cartaisy.
        </p>
      </div>

      {/* Documentation Sections */}
      <div className="space-y-12">
        {docSections.map((section) => (
          <section key={section.title}>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-[#f6f3ee]">{section.title}</h2>
              <p className="text-[#c5c7c1]">{section.description}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {section.links.map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  className={`group p-6 transition-colors hover:border-[#B6C4A1] ${inkPanelClass} ${
                    link.comingSoon ? 'pointer-events-none opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[4px] border border-[#666962] text-[#B6C4A1]">
                      <link.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium text-[#f6f3ee] transition-colors group-hover:text-[#B6C4A1]">
                          {link.title}
                        </h3>
                        {link.comingSoon && (
                          <span className="rounded-[4px] border border-[#666962] px-2 py-0.5 text-xs text-[#c5c7c1]">
                            Soon
                          </span>
                        )}
                      </div>
                      <p className="text-[#a3a69f] text-sm mt-1">{link.description}</p>
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
        <div className={`${inkPanelClass} p-8`}>
          <h3 className="text-xl font-semibold text-[#f6f3ee] mb-2">Can&apos;t find what you&apos;re looking for?</h3>
          <p className="text-[#c5c7c1] mb-6">
            Our support team is here to help you with any questions.
          </p>
          <Link
            href="/contact"
            className={inkPrimaryClass}
          >
            Contact Support
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
