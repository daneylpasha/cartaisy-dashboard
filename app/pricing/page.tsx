import { Metadata } from 'next';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing | Cartaisy',
  description: 'Simple, transparent pricing for your Shopify mobile app. Choose the plan that fits your business.',
};

const plans = [
  {
    name: 'Starter',
    price: '$49',
    period: '/month',
    description: 'Perfect for small stores just getting started with mobile.',
    features: [
      'iOS & Android apps',
      'Up to 100 products',
      'Basic push notifications',
      'Standard support',
      'Shopify sync',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Growth',
    price: '$99',
    period: '/month',
    description: 'For growing stores that need more power and flexibility.',
    features: [
      'Everything in Starter',
      'Up to 1,000 products',
      'Advanced push notifications',
      'Analytics dashboard',
      'Priority support',
      'Custom app icon',
    ],
    cta: 'Get Started',
    popular: true,
  },
  {
    name: 'Pro',
    price: '$199',
    period: '/month',
    description: 'For established stores with high-volume needs.',
    features: [
      'Everything in Growth',
      'Unlimited products',
      'Segmented push notifications',
      'Advanced analytics',
      'Dedicated support',
      'Custom branding',
      'API access',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Enterprise',
    price: '$499',
    period: '/month',
    description: 'Custom solutions for large-scale operations.',
    features: [
      'Everything in Pro',
      'Multiple store support',
      'Custom integrations',
      'SLA guarantee',
      'Dedicated account manager',
      'Custom feature development',
      'White-label options',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <Link href="/" className="text-purple-400 hover:text-purple-300 mb-8 inline-block transition-colors">
          &larr; Back to Home
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h1>
          <p className="text-gray-400 text-lg max-w-lg mx-auto">
            Choose the plan that fits your business. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 border ${
                plan.popular
                  ? 'bg-gradient-to-b from-purple-500/20 to-pink-500/20 border-purple-500/50'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-xs font-medium">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.name === 'Enterprise' ? '/contact' : '/signup'}
                className={`block w-full text-center py-3 rounded-lg font-medium transition-colors ${
                  plan.popular
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-white font-medium mb-2">Can I change plans later?</h3>
              <p className="text-gray-400 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-white font-medium mb-2">What happens after the free trial?</h3>
              <p className="text-gray-400 text-sm">
                After your 14-day trial, you&apos;ll be automatically enrolled in your chosen plan. Cancel anytime before the trial ends to avoid charges.
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-white font-medium mb-2">Do you offer refunds?</h3>
              <p className="text-gray-400 text-sm">
                We offer a 30-day money-back guarantee. If you&apos;re not satisfied, contact us for a full refund.
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-white font-medium mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-400 text-sm">
                We accept all major credit cards (Visa, Mastercard, American Express) and PayPal.
              </p>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-4">Have questions about which plan is right for you?</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-medium"
          >
            Contact our sales team &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
