import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Bell } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog | Cartaisy',
  description: 'Stay updated with the latest news, tips, and insights about mobile commerce and Shopify app development.',
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Link href="/" className="text-purple-400 hover:text-purple-300 mb-8 inline-block transition-colors">
          &larr; Back to Home
        </Link>

        <div className="text-center py-16">
          <div className="w-20 h-20 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-purple-400" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">Blog Coming Soon</h1>
          <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
            We&apos;re working on bringing you valuable content about mobile commerce,
            Shopify tips, and app development best practices.
          </p>

          <div className="bg-white/5 rounded-xl p-8 border border-white/10 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Get Notified</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Want to know when we launch? Drop us a line and we&apos;ll keep you posted.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Contact Us
            </Link>
          </div>

          <div className="mt-12 text-gray-500 text-sm">
            <p>Topics we&apos;ll cover:</p>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {['Mobile Commerce', 'Shopify Tips', 'App Design', 'Push Notifications', 'Conversion Optimization'].map((topic) => (
                <span key={topic} className="px-3 py-1 bg-white/5 rounded-full text-gray-400">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
