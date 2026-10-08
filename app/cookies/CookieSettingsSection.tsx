'use client';

import { CookieSettingsButton } from '@/components/cookies';
import { inkPrimaryClass } from '@/lib/marketing/publicInk';

export default function CookieSettingsSection() {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-semibold text-[#f6f3ee]">5. Managing Your Preferences</h2>
      <p className="mb-4 leading-relaxed text-[#c5c7c1]">
        You can change your cookie preferences at any time by clicking the button below:
      </p>
      <CookieSettingsButton className={inkPrimaryClass} />
    </section>
  );
}
