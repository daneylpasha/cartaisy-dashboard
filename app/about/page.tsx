import { Metadata } from 'next';
import Link from 'next/link';
import { Smartphone, Zap, ShoppingBag, BarChart3 } from 'lucide-react';
import PageLayout from '@/components/landing/PageLayout';

export const metadata: Metadata = {
  title: 'About Us | Cartaisy',
  description: 'Learn about Cartaisy - the mobile app builder platform helping Shopify merchants create native mobile apps.',
};

export default function AboutUs() {
  const values = [
    {
      icon: Smartphone,
      title: 'Mobile-First',
      description: 'We believe the future of e-commerce is mobile. Our platform is designed from the ground up to deliver exceptional mobile experiences.',
    },
    {
      icon: Zap,
      title: 'Simplicity',
      description: 'Building a mobile app should be simple. No coding required, no complex setup - just connect your store and start customizing.',
    },
    {
      icon: ShoppingBag,
      title: 'Merchant Success',
      description: 'Your success is our success. We\'re committed to providing the tools and support you need to grow your mobile commerce.',
    },
    {
      icon: BarChart3,
      title: 'Data-Driven',
      description: 'Make informed decisions with comprehensive analytics. Understand your customers and optimize their shopping experience.',
    },
  ];

  return (
    <PageLayout>
      <h1 className="text-4xl font-bold text-white mb-8">About Cartaisy</h1>

      <div className="space-y-12 text-gray-300">
        {/* Mission Section */}
        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">Our Mission</h2>
          <p className="leading-relaxed text-lg">
            Cartaisy empowers Shopify merchants to reach their customers on mobile with beautiful,
            high-performing native apps. We believe every store deserves a mobile presence, and we&apos;re
            making that accessible to businesses of all sizes.
          </p>
        </section>

        {/* What We Do Section */}
        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">What We Do</h2>
          <p className="leading-relaxed mb-6">
            Cartaisy is a complete mobile app builder platform designed exclusively for Shopify stores.
            Our platform enables you to:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Create native iOS and Android apps that sync seamlessly with your Shopify store</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Customize your app&apos;s design with our intuitive drag-and-drop builder</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Send targeted push notifications to engage and retain customers</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Track performance with real-time analytics and insights</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Manage orders, customers, and inventory from one dashboard</span>
            </li>
          </ul>
        </section>

        {/* Our Values Section */}
        <section>
          <h2 className="text-2xl font-semibold text-white mb-6">Our Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value) => (
              <div key={value.title} className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{value.title}</h3>
                <p className="text-gray-400 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Cartaisy Section */}
        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">Why Cartaisy?</h2>
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
            <p className="leading-relaxed mb-4">
              Mobile commerce is growing rapidly, with more consumers preferring to shop on their phones.
              A native mobile app provides a faster, more engaging experience than mobile web - leading to
              higher conversion rates, increased customer loyalty, and more repeat purchases.
            </p>
            <p className="leading-relaxed">
              Cartaisy makes it possible for any Shopify merchant to tap into this opportunity without
              the need for expensive custom development or technical expertise.
            </p>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="text-center pt-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Get in Touch</h2>
          <p className="text-gray-400 mb-6">
            Have questions? We&apos;d love to hear from you.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Contact Us
          </Link>
        </section>
      </div>
    </PageLayout>
  );
}
