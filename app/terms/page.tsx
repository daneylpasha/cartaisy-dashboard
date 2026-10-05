import { Metadata } from 'next';
import PageLayout from '@/components/landing/PageLayout';
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'Terms of Service',
  description: 'Cartaisy terms. The product is an invite-only managed Shopify shopping app. This page does not set a price, trial, or refund guarantee.',
  keywords: ['terms', 'conditions', 'legal', 'agreement'],
});

export default function TermsOfService() {
  return (
    <PageLayout>
      <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
      <p className="text-gray-400 mb-12">Last updated: October 2026. Commercial wording was corrected to match the product. This page does not add a new refund or offboarding policy.</p>

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
            Cartaisy provides a managed branded shopping app for a Shopify store. Shoppers browse and use a cart in the app, then pay on Shopify hosted checkout. Cartaisy does not take that payment. Accounts are invite-only. The public site describes one managed offer, a setup engagement plus a recurring fee, agreed before work starts. This page does not publish a price.
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Connect an invited store to Shopify through the Cartaisy backend</li>
            <li>Set the supported brand fields and a home layout</li>
            <li>Request a tracked build. An iOS production binary is not a current promise</li>
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
              <strong className="text-white">Commercial terms:</strong> Cartaisy does not run card checkout, PayPal, or a free trial inside this product. Any setup fee and recurring fee are agreed with you outside the product before work starts. This page does not state an amount.
            </p>
            <p className="leading-relaxed">
              <strong className="text-white">Changes:</strong> A change to those agreed terms is something you and Cartaisy confirm. This page does not describe an automatic billing cycle.
            </p>
            <p className="leading-relaxed">
              <strong className="text-white">Refunds and ending the work:</strong> This page does not offer a money-back guarantee and does not set a cancellation or offboarding policy. Questions about an agreement you already have should go through the contact form.
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
          <p className="leading-relaxed mb-4">
            We may terminate or suspend your account and access to the Service immediately, without prior notice
            or liability, for any reason, including but not limited to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Breach of these Terms</li>
            <li>An agreement with Cartaisy that has ended</li>
            <li>Request by law enforcement or government agencies</li>
            <li>Discontinuance or material modification of the Service</li>
            <li>Unexpected technical or security issues</li>
          </ul>
          <p className="leading-relaxed mt-4">
            Upon termination, your right to use the Service will immediately cease. You may export your data
            before termination where possible.
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
