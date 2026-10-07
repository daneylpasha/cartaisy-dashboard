import { Metadata } from 'next';
import Link from 'next/link';
import PageLayout from '@/components/landing/PageLayout';
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'Terms of Service',
  description: 'Cartaisy terms. The product is an invite-only managed Shopify shopping app. Price and billing are agreed before work starts. This product does not charge a card.',
  keywords: ['terms', 'conditions', 'legal', 'agreement'],
});

export default function TermsOfService() {
  return (
    <PageLayout>
      <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
      <p className="text-gray-400 mb-12">Last updated: October 2026.</p>

      <div className="space-y-10 text-gray-300">
        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
          <p className="leading-relaxed">
            By accessing or using Cartaisy&apos;s mobile app builder platform (&ldquo;Service&rdquo;), you agree to be bound
            by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, please do not use our Service.
            These Terms apply to all visitors, users, and others who access or use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
          <p className="leading-relaxed mb-4">
            Cartaisy provides a managed branded shopping app for a Shopify store. Shoppers browse and use a cart in the app, then pay on Shopify hosted checkout. Cartaisy does not take that payment. Accounts are invite-only. The public site describes one managed offer: a setup engagement plus a recurring fee. The price and any billing period are agreed before work starts. This page does not publish a price.
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Connect an invited store to Shopify through the Cartaisy backend</li>
            <li>Set the supported brand fields and a home layout</li>
            <li>Request a tracked build. A production iOS app is not a current promise</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">3. Account Registration</h2>
          <p className="leading-relaxed mb-4">To create an account, you must:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Be at least 18 years old</li>
            <li>Use an invite link from Cartaisy. Open signup is not available</li>
            <li>Have a Shopify store before catalog sync. You may request a walkthrough before the store exists</li>
            <li>Provide accurate registration information and keep your credentials private</li>
            <li>Own the Apple Developer and Google Play accounts used for any store listing</li>
          </ul>
          <p className="leading-relaxed mt-4">
            You must notify us immediately of any unauthorized use of your account or any other breach of security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">4. User Obligations</h2>
          <p className="leading-relaxed mb-4">When using our Service, you agree not to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on the intellectual property rights of others</li>
            <li>Upload malicious code or attempt to compromise our systems</li>
            <li>Use the Service for any illegal or unauthorized purpose</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
            <li>Use the Service to send spam or unsolicited communications</li>
            <li>Resell or redistribute the Service without our written consent</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">5. Subscription and Payment</h2>
          <div className="space-y-4">
            <p className="leading-relaxed">
              <strong className="text-white">Price and billing period:</strong> The price and any billing period are agreed with you before work starts. Recurring fees and the billing period are in that written agreement. This page does not state an amount. Cartaisy does not run card checkout, PayPal, or a free trial inside this product, and it does not capture cards or bill you in the app.
            </p>
            <p className="leading-relaxed">
              <strong className="text-white">Automatic renewal:</strong> A recurring fee renews automatically only when that written agreement says so. Billing stays outside this product.
            </p>
            <p className="leading-relaxed">
              <strong className="text-white">Cancel:</strong> Email{' '}
              <a href="mailto:support@cartaisy.com" className="text-purple-400 hover:text-purple-300">
                support@cartaisy.com
              </a>{' '}
              or use the{' '}
              <Link href="/contact" className="text-purple-400 hover:text-purple-300">
                contact form
              </Link>{' '}
              before the next renewal. Access continues through the period you have already paid.
            </p>
            <p className="leading-relaxed">
              <strong className="text-white">Refunds:</strong> Cartaisy does not give a partial refund for unused subscription time. Cartaisy corrects billing errors. Cartaisy refunds a setup fee if you cancel before work starts. Refunds required by law still apply.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">6. Intellectual Property</h2>
          <p className="leading-relaxed mb-4">
            The Service and its original content, features, and functionality are owned by Cartaisy and are protected
            by international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </p>
          <p className="leading-relaxed">
            You retain ownership of any content you upload to the Service. By uploading content, you grant us a
            non-exclusive, worldwide, royalty-free license to use, reproduce, and display such content solely for
            the purpose of providing the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">7. Limitation of Liability</h2>
          <p className="leading-relaxed">
            To the maximum extent permitted by law, Cartaisy shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, including but not limited to loss of profits, data, use,
            goodwill, or other intangible losses, resulting from your access to or use of (or inability to access
            or use) the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">8. Disclaimer of Warranties</h2>
          <p className="leading-relaxed">
            The Service is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind,
            whether express or implied, including but not limited to implied warranties of merchantability, fitness
            for a particular purpose, non-infringement, or course of performance.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">9. Termination</h2>
          <p className="leading-relaxed">
            We may suspend or end your access immediately, without prior notice, for serious misuse, a security
            issue, or a legal requirement. Otherwise we give notice before access ends. This page does not state
            a number of days for that notice.
          </p>
          <p className="leading-relaxed mt-4">
            Upon termination, your right to use the Service will immediately cease. A copy of data Cartaisy holds
            is available only when you ask. Use the{' '}
            <Link href="/contact" className="text-purple-400 hover:text-purple-300">
              contact form
            </Link>{' '}
            or email{' '}
            <a href="mailto:support@cartaisy.com" className="text-purple-400 hover:text-purple-300">
              support@cartaisy.com
            </a>
            . Requests to access, correct, or delete personal information, or to receive a copy of it, are not
            limited to the time before access ends. You can make them at any time by emailing{' '}
            <a href="mailto:privacy@cartaisy.com" className="text-purple-400 hover:text-purple-300">
              privacy@cartaisy.com
            </a>
            . This product does not provide a self-serve export download.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">10. Governing Law</h2>
          <p className="leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in
            which Cartaisy operates, without regard to its conflict of law provisions. Any disputes arising
            under these Terms shall be resolved through binding arbitration or in the courts of competent
            jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">11. Changes to Terms</h2>
          <p className="leading-relaxed">
            We reserve the right to modify or replace these Terms at any time. If a revision is material, we
            will provide at least 30 days&apos; notice prior to any new terms taking effect. What constitutes a
            material change will be determined at our sole discretion.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Us</h2>
          <p className="leading-relaxed">
            If you have any questions about these Terms, please contact us at:{' '}
            <a href="mailto:support@cartaisy.com" className="text-purple-400 hover:text-purple-300">
              support@cartaisy.com
            </a>
          </p>
        </section>
      </div>
    </PageLayout>
  );
}
