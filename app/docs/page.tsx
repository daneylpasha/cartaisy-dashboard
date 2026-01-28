import { Metadata } from 'next';
import Link from 'next/link';
import { Book, Rocket, Code, Smartphone, Bell, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Documentation | Cartaisy',
  description: 'Learn how to use Cartaisy to build and manage your Shopify mobile app.',
};

export default function DocsPage() {
  const upcomingDocs = [
    {
      icon: Rocket,
      title: 'Getting Started',
      description: 'Learn how to connect your Shopify store and set up your mobile app.',
    },
    {
      icon: Smartphone,
      title: 'App Builder Guide',
      description: 'Customize your app\'s home screen, navigation, and design.',
    },
    {
      icon: Bell,
      title: 'Push Notifications',
      description: 'Send targeted notifications to engage and retain customers.',
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'Track performance and understand your mobile app users.',
    },
    {
      icon: Code,
      title: 'API Reference',
      description: 'Integrate Cartaisy with your existing tools and workflows.',
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Link href="/" className="text-purple-400 hover:text-purple-300 mb-8 inline-block transition-colors">
          &larr; Back to Home
        </Link>

        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Book className="w-10 h-10 text-purple-400" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">Documentation</h1>
          <p className="text-gray-400 text-lg max-w-lg mx-auto">
            We&apos;re building comprehensive documentation to help you get the most out of Cartaisy.
            Coming soon!
          </p>
        </div>

        <div className="space-y-6 mb-12">
          <h2 className="text-xl font-semibold text-white">What&apos;s Coming</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {upcomingDocs.map((doc) => (
              <div
                key={doc.title}
                className="bg-white/5 rounded-xl p-6 border border-white/10 opacity-75"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <doc.icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">{doc.title}</h3>
                    <p className="text-gray-500 text-sm">{doc.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-8 border border-purple-500/20 text-center">
          <h2 className="text-xl font-semibold text-white mb-3">Need Help Now?</h2>
          <p className="text-gray-400 mb-6">
            While we work on our documentation, our support team is here to help
            you with any questions.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </main>
  );
}
