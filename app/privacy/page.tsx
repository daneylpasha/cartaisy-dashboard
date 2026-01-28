import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Cartaisy',
  description: 'Learn how Cartaisy collects, uses, and protects your personal information.',
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Link href="/" className="text-purple-400 hover:text-purple-300 mb-8 inline-block transition-colors">
          &larr; Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
        <p className="text-gray-400 mb-12">Last updated: January 2025</p>

        <div className="space-y-10 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="leading-relaxed">
              Cartaisy (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use
              our mobile app builder platform for Shopify stores.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-purple-300 mb-2">Personal Information</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Name and email address when you create an account</li>
                  <li>Billing information for subscription payments</li>
                  <li>Shopify store information when you connect your store</li>
                  <li>Communication preferences</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-purple-300 mb-2">Automatically Collected Information</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Device information and browser type</li>
                  <li>IP address and location data</li>
                  <li>Usage data and analytics</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="leading-relaxed mb-4">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
              <li>Personalize and improve your experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Sharing of Information</h2>
            <p className="leading-relaxed mb-4">We may share your information with:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-white">Service Providers:</strong> Third-party vendors who perform services on our behalf</li>
              <li><strong className="text-white">Shopify:</strong> As necessary to integrate with your Shopify store</li>
              <li><strong className="text-white">Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong className="text-white">Business Transfers:</strong> In connection with any merger or acquisition</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Cookies and Tracking</h2>
            <p className="leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our platform and hold certain
              information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being
              sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
              For more details, please see our <Link href="/cookies" className="text-purple-400 hover:text-purple-300">Cookie Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Data Security</h2>
            <p className="leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal
              information against unauthorized access, alteration, disclosure, or destruction. However, no method
              of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights</h2>
            <p className="leading-relaxed mb-4">Depending on your location, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your personal information</li>
              <li>Object to or restrict processing of your data</li>
              <li>Request portability of your data</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Data Retention</h2>
            <p className="leading-relaxed">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this
              Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer
              need your information, we will securely delete or anonymize it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Children&apos;s Privacy</h2>
            <p className="leading-relaxed">
              Our services are not intended for individuals under the age of 18. We do not knowingly collect
              personal information from children. If we learn that we have collected personal information from a
              child, we will take steps to delete that information promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to This Policy</h2>
            <p className="leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting
              the new Privacy Policy on this page and updating the &ldquo;Last updated&rdquo; date. You are advised to review
              this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:{' '}
              <a href="mailto:support@cartaisy.com" className="text-purple-400 hover:text-purple-300">
                support@cartaisy.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
