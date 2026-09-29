import type { ReactNode } from 'react';
import { InstallQrMark } from '@/components/build/InstallQrMark';
import { readInstallUrl } from '@/lib/build/contract';
import { installPreviewMode, showsBrandMock, type InstallPreviewModel, type ReadyInstall } from '@/lib/build/installPreview';
import { BUILD_MY_APP_HREF } from '@/lib/storeCredentials/contract';

const EYEBROW = 'mb-3 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500';

function safeInstalls(installs: ReadyInstall[]): ReadyInstall[] {
  const next: ReadyInstall[] = [];
  for (const install of installs) {
    const url = readInstallUrl(install.url);
    if (url) next.push({ ...install, url });
  }
  return next;
}

function CompactInstall({ installs }: { installs: ReadyInstall[] }) {
  const shown = safeInstalls(installs);
  if (shown.length === 0) return null;
  return (
    <div>
      <p className="text-center text-sm leading-6 text-slate-600">Scan to install the app on your phone.</p>
      <ul className="mt-4 space-y-5">
        {shown.map((install) => (
          <li key={install.platform} className="text-center">
            <p className="text-sm font-medium text-slate-950">{install.label}</p>
            <div className="mx-auto mt-3 w-fit rounded-2xl bg-white p-2.5 ring-1 ring-slate-200">
              <InstallQrMark url={install.url} title={`${install.label} install code`} pixelSize={148} />
            </div>
            <a
              href={install.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block break-all text-xs leading-5 text-slate-500 underline-offset-4 hover:text-slate-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              {install.url}
            </a>
          </li>
        ))}
      </ul>
      <a
        href={BUILD_MY_APP_HREF}
        className="mt-5 block text-center text-sm font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        Open Build
      </a>
    </div>
  );
}

/**
 * Light phone mock while no ready install exists.
 * A loading build list does not paint that mock over a finished install.
 */
export function BrandInstallPreview({
  model,
  children,
}: {
  model?: InstallPreviewModel;
  children: ReactNode;
}) {
  const shown = model ? { ...model, installs: safeInstalls(model.installs) } : undefined;
  const mode = shown && shown.installs.length > 0 ? 'install' : installPreviewMode(shown);
  if (mode === 'mock') {
    return (
      <div data-install-preview="mock">
        <p className={EYEBROW}>Live preview</p>
        {children}
      </div>
    );
  }
  if (mode === 'loading') {
    return (
      <div data-install-preview="loading">
        <p className="text-center text-sm leading-6 text-slate-500" role="status" aria-busy="true">
          Checking your build...
        </p>
      </div>
    );
  }
  return (
    <div data-install-preview="install">
      <p className={EYEBROW}>Install</p>
      <CompactInstall installs={shown?.installs ?? []} />
    </div>
  );
}

export function brandPreviewShowsMock(model: InstallPreviewModel | undefined): boolean {
  return showsBrandMock(model);
}
