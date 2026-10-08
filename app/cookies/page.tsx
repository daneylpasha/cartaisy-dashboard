import { Metadata } from 'next';
import Link from 'next/link';
import PageLayout from '@/components/landing/PageLayout';
import { operatorIdentity } from '@/lib/marketing/offer';
import { inkInlineLinkClass, inkPanelClass, inkProseClass } from '@/lib/marketing/publicInk';
import { generateMetadata as genMeta } from '@/lib/seo';
import CookieSettingsSection from './CookieSettingsSection';

export const metadata: Metadata = genMeta({
  title: 'Cookie Policy',
  description: 'Cartaisy Cookie Policy - learn about how we use cookies and similar technologies on our platform.',
  keywords: ['cookies', 'tracking', 'privacy'],
});

export default function CookiePolicy() {
  return (
    <PageLayout surface="ink">
      <article className={inkProseClass}>
      <h1 className="text-4xl font-bold text-[#f6f3ee] mb-4">Cookie Policy</h1>
      <p className="text-[#a3a69f]">Last updated: October 2026</p>
      <p className="mt-3 mb-12 text-[#a3a69f]">{operatorIdentity}</p>

      <div className="space-y-10 text-[#c5c7c1]">
        <section>
          <h2 className="text-2xl font-semibold text-[#f6f3ee] mb-4">1. What Are Cookies</h2>
          <p className="leading-relaxed">
            Cookies are small text files that are placed on your computer or mobile device when you visit a
            website. They are widely used to make websites work more efficiently and provide information to
            website owners. Cookies help us enhance your experience on our platform by remembering your
            preferences and understanding how you use our Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[#f6f3ee] mb-4">2. Types of Cookies We Use</h2>
          <div className="space-y-6">
            <div className={`${inkPanelClass} p-6`}>
              <h3 className="text-lg font-medium text-[#B6C4A1] mb-3">Necessary Cookies</h3>
              <p className="leading-relaxed">
                These cookies are essential for the website to function properly. They enable basic functions
                like page navigation, secure area access, and user authentication. The website cannot function
                properly without these cookies.
              </p>
            </div>

            <div className={`${inkPanelClass} p-6`}>
              <h3 className="text-lg font-medium text-[#B6C4A1] mb-3">Analytics Cookies</h3>
              <p className="leading-relaxed">
                Analytics cookies help us understand how the site is used and improve it. They are subject to
                your consent and our{' '}
                <Link href="/privacy" className={inkInlineLinkClass}>
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[#f6f3ee] mb-4">3. Specific Cookies We Use</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#666962]">
                  <th className="py-3 pr-4 text-[#f6f3ee] font-semibold">Cookie Name</th>
                  <th className="py-3 pr-4 text-[#f6f3ee] font-semibold">Purpose</th>
                  <th className="py-3 text-[#f6f3ee] font-semibold">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#666962]">
                  <td className="py-3 pr-4 text-[#B6C4A1]">cartaisy_cookie_consent</td>
                  <td className="py-3 pr-4">Stores your cookie preferences</td>
                  <td className="py-3">1 year</td>
                </tr>
                <tr className="border-b border-[#666962]">
                  <td className="py-3 pr-4 text-[#B6C4A1]">cartaisy_token</td>
                  <td className="py-3 pr-4">Authentication and session management</td>
                  <td className="py-3">7 days</td>
                </tr>
                <tr className="border-b border-[#666962]">
                  <td className="py-3 pr-4 text-[#B6C4A1]">cartaisy_auth_entry</td>
                  <td className="py-3 pr-4">Short-lived sign-in handoff. Not a credential.</td>
                  <td className="py-3">30 minutes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[#f6f3ee] mb-4">4. Third-Party Cookies</h2>
          <p className="leading-relaxed mb-4">
            Optional analytics load only after you allow analytics. This site does not load those tools as
            advertising pixels.
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong className="text-[#f6f3ee]">Google Analytics:</strong> Loaded only when this site is configured with a measurement ID and you allow analytics. Google may then set its own analytics cookie, such as _ga. This site does not set _gid.</li>
            <li><strong className="text-[#f6f3ee]">Vercel Analytics and Speed Insights:</strong> Page views and performance. Both load only after you allow analytics.</li>
          </ul>
        </section>

        <CookieSettingsSection />

        <section>
          <h2 className="text-2xl font-semibold text-[#f6f3ee] mb-4">6. Browser Settings</h2>
          <p className="leading-relaxed mb-4">
            Most web browsers allow you to control cookies through their settings. You can:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
            <li>View what cookies are stored on your device and delete them individually</li>
            <li>Block third-party cookies</li>
            <li>Block cookies from particular sites</li>
            <li>Block all cookies from being set</li>
            <li>Delete all cookies when you close your browser</li>
          </ul>
          <p className="leading-relaxed mb-4">
            Here are links to manage cookies in popular browsers:
          </p>
          <ul className="space-y-2 ml-4">
            <li>
              <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className={inkInlineLinkClass}>
                Google Chrome
              </a>
            </li>
            <li>
              <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className={inkInlineLinkClass}>
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className={inkInlineLinkClass}>
                Apple Safari
              </a>
            </li>
            <li>
              <a href="https://support.microsoft.com/en-us/windows/delete-and-manage-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer" className={inkInlineLinkClass}>
                Microsoft Edge
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[#f6f3ee] mb-4">7. Updates to This Policy</h2>
          <p className="leading-relaxed">
            We may update this Cookie Policy from time to time to reflect changes in technology, legislation,
            or our data practices. When we make changes, we will update the &ldquo;Last updated&rdquo; date at the top
            of this page. We encourage you to periodically review this page for the latest information on our
            cookie practices.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[#f6f3ee] mb-4">8. Contact Us</h2>
          <p className="leading-relaxed">
            If you have any questions about our use of cookies, please contact us at:{' '}
            <a href="mailto:privacy@cartaisy.com" className={inkInlineLinkClass}>
              privacy@cartaisy.com
            </a>
          </p>
        </section>
      </div>
      </article>
    </PageLayout>
  );
}
