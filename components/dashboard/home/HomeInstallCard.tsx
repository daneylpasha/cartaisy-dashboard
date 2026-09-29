import Link from 'next/link';
import { InstallQrMark } from '@/components/build/InstallQrMark';
import { Button } from '@/components/ui/button';
import { readInstallUrl } from '@/lib/build/contract';
import type { ReadyInstall } from '@/lib/build/installPreview';
import { BUILD_MY_APP_HREF } from '@/lib/storeCredentials/contract';

function publicInstalls(installs: ReadyInstall[]): ReadyInstall[] {
  const next: ReadyInstall[] = [];
  for (const install of installs) {
    const url = readInstallUrl(install.url);
    if (url) next.push({ ...install, url });
  }
  return next;
}

function installLead(installs: ReadyInstall[]): string {
  const names = installs.map((install) => install.label);
  if (names.length === 1) {
    return `${names[0]} is ready. Scan the code with your phone, or open Build for the larger one.`;
  }
  return `${names.join(' and ')} are ready. Scan a code with your phone, or open Build for the larger ones.`;
}

/**
 * Compact install codes on Home. Absent unless a platform is ready with a
 * public https URL. Build stays the large code.
 */
export function HomeInstallCard({ installs }: { installs: ReadyInstall[] }) {
  const shown = publicInstalls(installs);
  if (shown.length === 0) return null;

  return (
    <section data-home-install="" className="mt-8 rounded-xl border border-slate-200 bg-white px-5 py-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 max-w-md">
          <h2 className="font-heading text-sm font-semibold tracking-tight text-slate-950">Scan to install</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{installLead(shown)}</p>
          <Button asChild className="mt-4 h-11 rounded-lg px-4">
            <Link href={BUILD_MY_APP_HREF}>Open Build</Link>
          </Button>
        </div>
        <ul className="flex shrink-0 flex-wrap gap-4">
          {shown.map((install) => (
            <li key={install.platform} className="text-center">
              <p className="text-xs font-medium text-slate-500">{install.label}</p>
              <div className="mt-2 w-fit rounded-2xl bg-white p-2 ring-1 ring-slate-200">
                <InstallQrMark url={install.url} title={`${install.label} install code`} pixelSize={136} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
