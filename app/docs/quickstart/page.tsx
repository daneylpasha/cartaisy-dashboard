import { Metadata } from 'next';
import Link from 'next/link';
import { Rocket, UserPlus, Link2, Palette, Upload, CheckCircle } from 'lucide-react';
import PageLayout from '@/components/landing/PageLayout';

export const metadata: Metadata = {
  title: 'Quick Start Guide | Cartaisy',
  description: 'Get started with Cartaisy in minutes. Learn how to set up your Shopify mobile app.',
};

const steps = [
  {
    number: 1,
    icon: UserPlus,
    title: 'Create Your Account',
    description: 'Sign up for a Cartaisy account using your email or Shopify store.',
    status: 'documented',
  },
  {
    number: 2,
    icon: Link2,
    title: 'Connect Your Shopify Store',
    description: 'Authorize Cartaisy to sync with your Shopify store. Products, collections, and orders will sync automatically.',
    status: 'documented',
  },
  {
    number: 3,
    icon: Palette,
    title: 'Customize Your App',
    description: 'Use the drag-and-drop App Builder to design your home screen with carousels, banners, and collections.',
    status: 'coming',
  },
  {
    number: 4,
    icon: Upload,
    title: 'Publish to App Stores',
    description: 'Submit your app to the Apple App Store and Google Play Store. We handle the technical requirements.',
    status: 'coming',
  },
];

export default function QuickStartPage() {
  return (
    <PageLayout maxWidth="4xl" backHref="/docs" backLabel="Back to Docs">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center">
          <Rocket className="w-7 h-7 text-green-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white">Quick Start Guide</h1>
          <p className="text-gray-400">Get your mobile app live in 4 simple steps</p>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-6 border border-yellow-500/20 mb-12">
        <h3 className="text-lg font-semibold text-white mb-2">Full Guide Coming Soon</h3>
        <p className="text-gray-400">
          We&apos;re preparing detailed documentation with screenshots and video tutorials.
          Here&apos;s a preview of what&apos;s coming.
        </p>
      </div>

      {/* Steps Preview */}
      <div className="space-y-6 mb-12">
        {steps.map((step, index) => (
          <div
            key={step.number}
            className={`relative bg-white/5 rounded-xl p-6 border border-white/10 ${
              step.status === 'coming' ? 'opacity-60' : ''
            }`}
          >
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="absolute left-11 top-20 w-0.5 h-8 bg-white/10" />
            )}

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0 relative">
                <span className="text-2xl font-bold text-purple-400">{step.number}</span>
                {step.status === 'documented' && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                  {step.status === 'coming' && (
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-400">
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="text-gray-400 mt-2">{step.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Prerequisites */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Prerequisites</h2>
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <ul className="space-y-3 text-gray-400">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span>An active Shopify store with products</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Store owner or staff account with API access</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Apple Developer account (for iOS app)</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Google Play Developer account (for Android app)</span>
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <p className="text-gray-400 mb-4">Ready to get started?</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Create Account
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium border border-white/10 transition-colors"
          >
            Get Help
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
