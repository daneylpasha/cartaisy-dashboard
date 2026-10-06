'use client';

import { CookieSettingsButton } from '@/components/cookies';

export default function CookieSettingsSection() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-white mb-4">5. Managing Your Preferences</h2>
      <p className="text-gray-300 leading-relaxed mb-4">
        You can change your cookie preferences at any time by clicking the button below:
      </p>
      <CookieSettingsButton className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-[4px]" />
    </section>
  );
}
