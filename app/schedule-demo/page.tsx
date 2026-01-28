import { Metadata } from 'next';
import ScheduleDemoForm from '@/components/ScheduleDemoForm';
import PageLayout from '@/components/landing/PageLayout';

export const metadata: Metadata = {
  title: 'Schedule a Demo | Cartaisy',
  description: 'Book a personalized demo to see how Cartaisy can help you build a mobile app for your Shopify store.',
};

export default function ScheduleDemoPage() {
  return (
    <PageLayout maxWidth="4xl">
      <div className="grid md:grid-cols-2 gap-12 items-start">
        {/* Left Column - Info */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">Schedule a Demo</h1>
          <p className="text-gray-400 text-lg mb-8">
            See Cartaisy in action. Book a personalized demo with our team and learn how
            to launch your Shopify mobile app.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-purple-400 font-semibold">1</span>
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Personalized Walkthrough</h3>
                <p className="text-gray-400 text-sm">
                  Get a customized demo based on your store&apos;s needs and goals.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-purple-400 font-semibold">2</span>
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Live Q&A</h3>
                <p className="text-gray-400 text-sm">
                  Ask questions and get answers from our mobile commerce experts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-purple-400 font-semibold">3</span>
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Custom Recommendations</h3>
                <p className="text-gray-400 text-sm">
                  Receive tailored advice on features and strategies for your app.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 p-6 bg-white/5 rounded-xl border border-white/10">
            <p className="text-gray-400 text-sm">
              <strong className="text-white">Prefer to talk now?</strong>
              <br />
              Email us at{' '}
              <a href="mailto:sales@cartaisy.com" className="text-purple-400 hover:text-purple-300">
                sales@cartaisy.com
              </a>
            </p>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
          <ScheduleDemoForm />
        </div>
      </div>
    </PageLayout>
  );
}
