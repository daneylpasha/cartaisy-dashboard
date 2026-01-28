import { Metadata } from 'next';
import { Briefcase, Mail, Heart } from 'lucide-react';
import PageLayout from '@/components/landing/PageLayout';

export const metadata: Metadata = {
  title: 'Careers | Cartaisy',
  description: 'Join the Cartaisy team and help shape the future of mobile commerce for Shopify merchants.',
};

export default function CareersPage() {
  return (
    <PageLayout>
      <h1 className="text-4xl font-bold text-white mb-4">Careers at Cartaisy</h1>
      <p className="text-gray-400 text-lg mb-12">
        Join us in building the future of mobile commerce.
      </p>

      <div className="space-y-8">
        {/* No Positions Card */}
        <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
          <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-8 h-8 text-purple-400" />
          </div>

          <h2 className="text-2xl font-semibold text-white mb-3">No Open Positions</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            We don&apos;t have any open positions at the moment, but we&apos;re always interested
            in hearing from talented individuals.
          </p>
        </div>

        {/* Get in Touch Card */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-8 border border-purple-500/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Interested in Joining Us?</h3>
              <p className="text-gray-400 mb-4">
                If you&apos;re passionate about mobile commerce, e-commerce, or building great
                products, we&apos;d love to hear from you. Send us your resume and tell us
                why you&apos;d be a great fit.
              </p>
              <a
                href="mailto:careers@cartaisy.com"
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-medium"
              >
                careers@cartaisy.com
                <span>&rarr;</span>
              </a>
            </div>
          </div>
        </div>

        {/* Why Cartaisy Card */}
        <div className="bg-white/5 rounded-xl p-8 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-6 h-6 text-pink-400" />
            <h3 className="text-xl font-semibold text-white">Why Work With Us</h3>
          </div>
          <ul className="space-y-4 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Work on products that help thousands of merchants grow their businesses</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Remote-friendly culture with flexible working hours</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Work with cutting-edge technologies in mobile and web development</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Collaborative team that values learning and growth</span>
            </li>
          </ul>
        </div>
      </div>
    </PageLayout>
  );
}
