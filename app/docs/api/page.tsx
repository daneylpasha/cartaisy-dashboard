import { Metadata } from 'next';
import Link from 'next/link';
import { Code, Lock, Server, ShoppingBag, Users, Bell, BarChart3, Key } from 'lucide-react';
import PageLayout from '@/components/landing/PageLayout';

export const metadata: Metadata = {
  title: 'API Reference | Cartaisy',
  description: 'Cartaisy REST API documentation for developers integrating with the platform.',
};

const apiEndpoints = [
  {
    icon: Lock,
    category: 'Authentication',
    path: '/api/v1/auth/*',
    description: 'User authentication, token management, and session handling.',
    endpoints: ['POST /login', 'POST /register', 'POST /refresh', 'POST /logout'],
  },
  {
    icon: ShoppingBag,
    category: 'Products',
    path: '/api/v1/products/*',
    description: 'Retrieve and manage product data synced from Shopify.',
    endpoints: ['GET /products', 'GET /products/:id', 'GET /products/search'],
  },
  {
    icon: Server,
    category: 'Orders',
    path: '/api/v1/orders/*',
    description: 'Access order data and manage order status.',
    endpoints: ['GET /orders', 'GET /orders/:id', 'POST /orders', 'PATCH /orders/:id'],
  },
  {
    icon: Users,
    category: 'Customers',
    path: '/api/v1/customers/*',
    description: 'Customer profiles, addresses, and preferences.',
    endpoints: ['GET /customers', 'GET /customers/:id', 'PATCH /customers/:id'],
  },
  {
    icon: Bell,
    category: 'Push Notifications',
    path: '/api/v1/notifications/*',
    description: 'Send and manage push notification campaigns.',
    endpoints: ['POST /notifications/send', 'GET /notifications/history', 'GET /notifications/stats'],
  },
  {
    icon: BarChart3,
    category: 'Analytics',
    path: '/api/v1/analytics/*',
    description: 'Access analytics data and performance metrics.',
    endpoints: ['GET /analytics/dashboard', 'GET /analytics/revenue', 'GET /analytics/sessions'],
  },
];

export default function ApiReferencePage() {
  return (
    <PageLayout maxWidth="4xl" backHref="/docs" backLabel="Back to Docs">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center">
          <Code className="w-7 h-7 text-purple-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white">API Reference</h1>
          <p className="text-gray-400">REST API documentation for developers</p>
        </div>
      </div>

      {/* Introduction */}
      <section className="mb-12">
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">Introduction</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            The Cartaisy API is a RESTful API that allows you to integrate your applications
            with the Cartaisy platform. All API requests are made over HTTPS and return JSON responses.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Base URL: <code className="bg-white/10 px-2 py-1 rounded text-purple-300">https://api.cartaisy.com/v1</code>
          </p>
        </div>
      </section>

      {/* Authentication */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-6 h-6 text-yellow-400" />
          <h2 className="text-2xl font-semibold text-white">Authentication</h2>
        </div>
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <p className="text-gray-400 leading-relaxed mb-4">
            All API requests require authentication using JWT (JSON Web Tokens). Include your
            access token in the Authorization header:
          </p>
          <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <code className="text-green-400">Authorization: Bearer </code>
            <code className="text-purple-300">your_access_token</code>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            Tokens expire after 24 hours. Use the refresh endpoint to obtain new tokens.
          </p>
        </div>
      </section>

      {/* Endpoints */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-6">API Endpoints</h2>
        <div className="space-y-4">
          {apiEndpoints.map((api) => (
            <div
              key={api.category}
              className="bg-white/5 rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <api.icon className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{api.category}</h3>
                    <code className="text-xs bg-white/10 px-2 py-1 rounded text-gray-400">
                      {api.path}
                    </code>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{api.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {api.endpoints.map((endpoint) => (
                      <span
                        key={endpoint}
                        className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-gray-300"
                      >
                        {endpoint}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Coming Soon Notice */}
      <section className="mb-12">
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-6 border border-yellow-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">Full Documentation Coming Soon</h3>
          <p className="text-gray-400 mb-4">
            We&apos;re working on comprehensive API documentation with code examples, SDKs,
            and interactive playground. Stay tuned for updates.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            Contact us for API access &rarr;
          </Link>
        </div>
      </section>

      {/* Rate Limits */}
      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">Rate Limits</h2>
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <p className="text-gray-400 leading-relaxed mb-4">
            API requests are rate-limited to ensure fair usage:
          </p>
          <ul className="space-y-2 text-gray-400">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <strong className="text-white">Standard:</strong> 100 requests per minute
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <strong className="text-white">Pro:</strong> 500 requests per minute
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <strong className="text-white">Enterprise:</strong> Custom limits available
            </li>
          </ul>
        </div>
      </section>
    </PageLayout>
  );
}
