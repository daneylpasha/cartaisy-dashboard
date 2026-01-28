import { Metadata } from 'next';
import PageLayout from '@/components/landing/PageLayout';

export const metadata: Metadata = {
  title: 'Cookie Policy | Cartaisy',
  description: 'Learn about how Cartaisy uses cookies and similar technologies.',
};

export default function CookiePolicy() {
  return (
    <PageLayout>
      <h1 className="text-4xl font-bold text-white mb-4">Cookie Policy</h1>
      <p className="text-gray-400 mb-12">Last updated: January 2025</p>

      <div className="space-y-10 text-gray-300">
        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">1. What Are Cookies</h2>
          <p className="leading-relaxed">
            Cookies are small text files that are placed on your computer or mobile device when you visit a
            website. They are widely used to make websites work more efficiently and provide information to
            website owners. Cookies help us enhance your experience on our platform by remembering your
            preferences and understanding how you use our Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">2. Types of Cookies We Use</h2>
          <div className="space-y-6">
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-lg font-medium text-purple-300 mb-3">Essential Cookies</h3>
              <p className="leading-relaxed">
                These cookies are necessary for the website to function properly. They enable basic functions
                like page navigation, secure area access, and user authentication. The website cannot function
                properly without these cookies.
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-lg font-medium text-purple-300 mb-3">Functional Cookies</h3>
              <p className="leading-relaxed">
                These cookies allow us to remember choices you make (such as your language preference or
                the region you are in) and provide enhanced, more personalized features. They may also be
                used to remember changes you have made to text size, fonts, and other customizable parts
                of web pages.
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-lg font-medium text-purple-300 mb-3">Analytics Cookies</h3>
              <p className="leading-relaxed">
                These cookies collect information about how visitors use our website, such as which pages
                are visited most often and if users receive error messages. This data helps us improve how
                our website works. All information collected by these cookies is aggregated and therefore
                anonymous.
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-lg font-medium text-purple-300 mb-3">Marketing Cookies</h3>
              <p className="leading-relaxed">
                These cookies are used to track visitors across websites. The intention is to display ads
                that are relevant and engaging for the individual user. These cookies may be set by third-party
                advertising networks with our permission.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">3. Specific Cookies We Use</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="py-3 pr-4 text-white font-semibold">Cookie Name</th>
                  <th className="py-3 pr-4 text-white font-semibold">Purpose</th>
                  <th className="py-3 text-white font-semibold">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4 text-purple-300">session_token</td>
                  <td className="py-3 pr-4">Authentication and session management</td>
                  <td className="py-3">Session</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4 text-purple-300">user_preferences</td>
                  <td className="py-3 pr-4">Stores user preferences and settings</td>
                  <td className="py-3">1 year</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4 text-purple-300">_ga</td>
                  <td className="py-3 pr-4">Google Analytics - distinguishes users</td>
                  <td className="py-3">2 years</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4 text-purple-300">_gid</td>
                  <td className="py-3 pr-4">Google Analytics - distinguishes users</td>
                  <td className="py-3">24 hours</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">4. Third-Party Cookies</h2>
          <p className="leading-relaxed mb-4">
            In addition to our own cookies, we may also use various third-party cookies to report usage
            statistics of the Service and deliver advertisements on and through the Service. These may include:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong className="text-white">Google Analytics:</strong> For website analytics and performance monitoring</li>
            <li><strong className="text-white">Shopify:</strong> For integration with your Shopify store</li>
            <li><strong className="text-white">Stripe:</strong> For secure payment processing</li>
            <li><strong className="text-white">Intercom:</strong> For customer support and communication</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">5. Managing Cookies</h2>
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
          <p className="leading-relaxed">
            Please note that if you choose to block or delete cookies, some features of our Service may not
            work properly, and you may need to manually adjust some preferences every time you visit our site.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">6. Browser Settings</h2>
          <p className="leading-relaxed mb-4">
            Here are links to manage cookies in popular browsers:
          </p>
          <ul className="space-y-2 ml-4">
            <li>
              <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
                Google Chrome
              </a>
            </li>
            <li>
              <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
                Apple Safari
              </a>
            </li>
            <li>
              <a href="https://support.microsoft.com/en-us/windows/delete-and-manage-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
                Microsoft Edge
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">7. Updates to This Policy</h2>
          <p className="leading-relaxed">
            We may update this Cookie Policy from time to time to reflect changes in technology, legislation,
            or our data practices. When we make changes, we will update the &ldquo;Last updated&rdquo; date at the top
            of this page. We encourage you to periodically review this page for the latest information on our
            cookie practices.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">8. Contact Us</h2>
          <p className="leading-relaxed">
            If you have any questions about our use of cookies, please contact us at:{' '}
            <a href="mailto:support@cartaisy.com" className="text-purple-400 hover:text-purple-300">
              support@cartaisy.com
            </a>
          </p>
        </section>
      </div>
    </PageLayout>
  );
}
