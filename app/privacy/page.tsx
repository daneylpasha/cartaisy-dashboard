import { Metadata } from 'next';
import Link from 'next/link';
import PageLayout from '@/components/landing/PageLayout';
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'Privacy Policy',
  description: 'What Cartaisy collects on the public site and in an invited account. The product does not collect card numbers.',
  keywords: ['privacy', 'data protection'],
});

export default function PrivacyPolicy() {
  return (
    <PageLayout>
      <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
      <p className="text-gray-400 mb-12">Last updated: October 2026.</p>

      <div className="space-y-10 text-gray-300">
        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
          <p className="leading-relaxed">
            Cartaisy (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use
            the Cartaisy site and the invited merchant dashboard for a Shopify shopping app.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-purple-300 mb-2">Personal Information</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Name, email, optional store URL, and the answers you send on the fit check, walkthrough request, or contact form</li>
                <li>Name, email, and store name when you accept an invite and create an account</li>
                <li>Shopify store information after you connect a store from the dashboard</li>
                <li>We do not collect card numbers in this product. Commercial payment, if any, happens outside it</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-purple-300 mb-2">Automatically Collected Information</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>IP address on a fit check, walkthrough request, or contact message</li>
                <li>Optional analytics after you allow them: Vercel Analytics, Speed Insights, and Google Analytics when it is configured</li>
                <li>Cookies described in the cookie policy</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
          <p className="leading-relaxed mb-4">We use the information we collect to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Provide, maintain, and improve our services</li>
            <li>Reply to fit checks, walkthrough requests, and contact messages</li>
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
            information. Optional analytics stay off until you allow them. That includes Vercel Analytics, Speed
            Insights, and Google Analytics when a measurement ID is configured. This site does not load
            advertising-network pixels. You can instruct your browser to refuse all cookies or to indicate when a
            cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions
            of our service. For more details, please see our <Link href="/cookies" className="text-purple-400 hover:text-purple-300">Cookie Policy</Link>.
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
            <li>Ask for a copy of the personal information we hold</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p className="leading-relaxed mt-4">
            These requests are not limited to the time before access ends. You can make them at any time. Use the{' '}
            <Link href="/contact" className="text-purple-400 hover:text-purple-300">
              contact form
            </Link>{' '}
            or email{' '}
            <a href="mailto:privacy@cartaisy.com" className="text-purple-400 hover:text-purple-300">
              privacy@cartaisy.com
            </a>
            . This product does not provide a self-serve export download.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">8. Data Retention</h2>
          <p className="leading-relaxed">
            We keep personal information only while it is needed for the service and for legal obligations. When it
            is no longer needed, we delete or anonymize it.
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
            <a href="mailto:privacy@cartaisy.com" className="text-purple-400 hover:text-purple-300">
              privacy@cartaisy.com
            </a>
          </p>
        </section>
      </div>
    </PageLayout>
  );
}
