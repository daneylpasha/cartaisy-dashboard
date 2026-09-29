import { InstallQrMark } from '@/components/build/InstallQrMark';
import { readInstallUrl } from '@/lib/build/contract';
import {
  FIRST_BUILD_CTA,
  FIRST_BUILD_EYEBROW,
  FIRST_BUILD_LEAD,
  FIRST_BUILD_STEPS,
  FIRST_BUILD_TITLE,
  installPreviewMode,
  type InstallPreviewModel,
  type ReadyInstall,
} from '@/lib/build/installPreview';
import { APP_BUILDER_PUBLISH_HREF } from '@/lib/homeLayout/publish';
import { BUILD_MY_APP_HREF } from '@/lib/storeCredentials/contract';

const EYEBROW = 'mb-3 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500';
const LINK =
  'font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:decoration-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400';
const GO_LIVE_HREF = '/dashboard';

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

function FirstBuildGuide() {
  return (
    <div data-first-build="">
      <h2 className="text-center font-heading text-base font-semibold tracking-tight text-slate-950">
        {FIRST_BUILD_TITLE}
      </h2>
      <p className="mt-2 text-center text-sm leading-6 text-slate-600">{FIRST_BUILD_LEAD}</p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
        <li>{FIRST_BUILD_STEPS[0]}</li>
        <li>
          <a href={APP_BUILDER_PUBLISH_HREF} className={LINK}>
            Publish home
          </a>
          {' so the installed app uses that layout.'}
        </li>
        <li>{FIRST_BUILD_STEPS[2]}</li>
        <li>
          {'Scan the install code on '}
          <a href={GO_LIVE_HREF} className={LINK}>
            Go live
          </a>
          {' when it appears.'}
        </li>
      </ol>
      <a
        href={BUILD_MY_APP_HREF}
        className="mt-5 flex h-11 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
      >
        {FIRST_BUILD_CTA}
      </a>
    </div>
  );
}

/**
 * Install code when a ready public URL exists.
 * Otherwise, how to get the first build. The phone mock is not shown.
 */
export function BrandInstallPreview({ model }: { model?: InstallPreviewModel }) {
  const shown = model ? { ...model, installs: safeInstalls(model.installs) } : undefined;
  const mode = installPreviewMode(shown);
  if (mode === 'instructions') {
    return (
      <div data-install-preview="instructions">
        <p className={EYEBROW}>{FIRST_BUILD_EYEBROW}</p>
        <FirstBuildGuide />
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
